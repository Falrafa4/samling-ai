import os
import requests
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.historical_waste_data import HistoricalWasteData
from app.models.citizen_reports import CitizenReport
from app.models.zones import Zone
from app.utils.timezone import get_jakarta_now
from app.ai.scheduler.feature_engineer import (
    get_zone_population,
    get_tps_capacity,
    get_rainfall,
    get_growth_rate,
    get_current_fill,
    get_temporal
)

LLM_API_KEY = os.getenv("OPENROUTER_API_KEY")
CITIZEN_REPORTS_API_URL = "https://api-samling.naufalrafa.my.id/api/v1/citizen-reports"
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"

def get_urgency_from_llm(report_content: str, report_type: str) -> float:
    """
    Call OpenRouter API to get urgency score from LLM.
    Returns a float between 0.0 and 5.0.
    """
    system_prompt = (
        "You are an expert in analyzing citizen reports for a waste management system. "
        "Your task is to assign an urgency score from 0.0 to 5.0 based on the report's content and type. "
        "A score of 5.0 represents an extreme emergency that requires immediate attention "
        "(e.g., hazardous waste, fire, major public obstruction), while 0.0 is not urgent at all. "
        "Respond with only a single floating-point number, no other text."
    )
    
    user_prompt = (
        f"Report Content: \"{report_content}\"\n"
        f"Report Type: \"{report_type}\"\n"
        f"Provide only the urgency score as a single number between 0.0 and 5.0."
    )
    
    try:
        response = requests.post(
            OPENROUTER_API_URL,
            headers={
                "Authorization": f"Bearer {LLM_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": OPENROUTER_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 10
            },
            timeout=30
        )
        response.raise_for_status()
        
        result = response.json()
        score_text = result.get("choices", [{}])[0].get("message", {}).get("content", "2.5").strip()
        
        # Parse the score, ensuring it's between 0.0 and 5.0
        score = float(score_text)
        score = max(0.0, min(5.0, score))
        
        return score
    except Exception as e:
        print(f"Error calling LLM API: {e}")
        # Fallback to heuristic
        if report_type == "event":
            if "darurat" in report_content.lower() or "bahaya" in report_content.lower():
                return 4.5
            return 3.0
        if "penuh" in report_content.lower():
            return 4.0
        return 2.0

def fetch_new_citizen_reports(db: Session) -> list:
    """
    Fetches unprocessed citizen reports from the API.
    Only fetches reports where is_grouped is False.
    """
    try:
        response = requests.get(CITIZEN_REPORTS_API_URL)
        response.raise_for_status()
        all_reports = response.json().get("data", [])
        
        # Filter for unprocessed reports (is_grouped = False)
        unprocessed = [
            report for report in all_reports
            if report.get("is_grouped") is False
        ]
        
        return unprocessed
    except requests.exceptions.RequestException as e:
        print(f"Error fetching citizen reports: {e}")
        return []


def mark_report_as_processed(report_id: int) -> bool:
    """
    Mark a citizen report as processed by updating is_grouped to True.
    """
    try:
        response = requests.patch(
            f"{CITIZEN_REPORTS_API_URL}/{report_id}",
            json={"is_grouped": True},
            timeout=10
        )
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error updating report {report_id}: {e}")
        return False

def process_citizen_reports():
    """
    Fetches new citizen reports, processes them to generate an urgency score,
    and stores the result in the historical_waste_data table.
    """
    db = SessionLocal()
    print("Fetching new citizen reports...")
    reports = fetch_new_citizen_reports(db)

    if not reports:
        print("No new citizen reports to process.")
        db.close()
        return

    print(f"Processing {len(reports)} new citizen reports...")
    processed_count = 0
    
    for report_data in reports:
        # Extract report details
        report_id = report_data.get("id")
        report_content = report_data.get("report_content", "")
        report_type = report_data.get("type", "waste")
        zone_id = report_data.get("zone_id")

        print(f"Processing report ID: {report_id} for zone: {zone_id}")

        # Fetch zone details
        zone = db.query(Zone).filter(Zone.id == zone_id).first()
        if not zone:
            print(f"  - Zone with ID {zone_id} not found. Skipping.")
            continue
        
        # Get urgency score from LLM
        urgency_score = get_urgency_from_llm(report_content, report_type)
        print(f"  - Urgency Score: {urgency_score}")
        
        # Get temporal data
        temporal = get_temporal()
        
        # Get rainfall for the zone
        rainfall = get_rainfall(zone)
        
        # Calculate growth rate based on rainfall and urgency score
        growth_rate = get_growth_rate(rainfall, urgency_score)
        
        # Get previous history for current fill calculation
        previous = db.query(HistoricalWasteData).filter(
            HistoricalWasteData.tps_id == zone.id
        ).order_by(HistoricalWasteData.timestamp_prediction.desc()).first()
        
        current_fill = get_current_fill(previous)
        
        # Create new historical data entry
        new_waste_data = HistoricalWasteData(
            kecamatan=zone.kecamatan,
            tps_id=zone.id,
            tps_type=zone.jenis_tps,
            zone_population=get_zone_population(zone.kecamatan),
            tps_capacity_kg=get_tps_capacity(zone.id),
            day_of_week=temporal["day_of_week"],
            is_weekend=temporal["is_weekend"],
            is_holiday=0,
            daily_growth_rate=growth_rate,
            rainfall_today=rainfall,
            event_urgency_score=urgency_score,
            current_fill_percentage=current_fill,
            timestamp_prediction=temporal["timestamp_prediction"]
        )
        
        db.add(new_waste_data)
        
        # Mark report as processed
        mark_report_as_processed(report_id)
        processed_count += 1

    db.commit()
    print(f"Finished processing {processed_count} citizen reports.")
    db.close()
