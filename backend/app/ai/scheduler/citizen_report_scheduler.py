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

LLM_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama3-8b-8192"

def get_urgency_from_llm(report_content: str, report_type: str) -> float:
    """
    Call Groq API to get urgency score from LLM.
    Returns a float between 0.0 and 5.0.
    """
    if not LLM_API_KEY:
        print("Error: GROQ_API_KEY is not set. Using fallback heuristic.")
        # Fallback to heuristic
        if report_type == "event":
            if "darurat" in report_content.lower() or "bahaya" in report_content.lower():
                return 4.5
            return 3.0
        if "penuh" in report_content.lower():
            return 4.0
        return 2.0

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
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {LLM_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": GROQ_MODEL,
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
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error calling Groq API: {http_err}")
        # Specifically handle 401 Unauthorized
        if http_err.response.status_code == 401:
            print("  - The GROQ_API_KEY is likely invalid or has expired.")
    except Exception as e:
        print(f"Error calling Groq API: {e}")

    # Fallback to heuristic on any exception
    if report_type == "event":
        if "darurat" in report_content.lower() or "bahaya" in report_content.lower():
            return 4.5
        return 3.0
    if "penuh" in report_content.lower():
        return 4.0
    return 2.0

def fetch_new_citizen_reports(db: Session) -> list:
    """
    Fetches unprocessed citizen reports directly from the database.
    Only fetches reports where is_grouped is False.
    """
    try:
        reports = db.query(CitizenReport).filter(CitizenReport.is_grouped == False).all()
        return reports
    except Exception as e:
        print(f"Error fetching citizen reports from DB: {e}")
        return []

def mark_report_as_processed(db: Session, report_id: int) -> bool:
    """
    Mark a citizen report as processed by updating is_grouped to True in the database.
    """
    try:
        report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
        if report:
            report.is_grouped = True
            return True
        return False
    except Exception as e:
        print(f"Error updating report {report_id} in DB: {e}")
        return False

def process_citizen_reports():
    """
    Fetches new citizen reports, processes them to generate an urgency score,
    and stores the result in the historical_waste_data table.
    """
    db = SessionLocal()
    try:
        print("Fetching new citizen reports...")
        reports = fetch_new_citizen_reports(db)

        if not reports:
            print("No new citizen reports to process.")
            return

        print(f"Processing {len(reports)} new citizen reports...")
        processed_count = 0
        
        for report in reports:
            print(f"Processing report ID: {report.id} for zone: {report.zone_id}")

            # Fetch zone details from the relationship
            zone = report.zone
            if not zone:
                # This should ideally not happen if DB constraints are set
                zone = db.query(Zone).filter(Zone.id == report.zone_id).first()
                if not zone:
                    print(f"  - Zone with ID {report.zone_id} not found. Skipping.")
                    continue
            
            # Get urgency score from LLM
            urgency_score = get_urgency_from_llm(report.report_content, report.type)
            print(f"  - Urgency Score: {urgency_score}")
            
            # Get temporal data
            temporal = get_temporal()
            
            # Get rainfall for the zone
            rainfall = get_rainfall(zone)
            
            # Calculate growth rate based on rainfall and urgency score
            growth_rate = get_growth_rate(rainfall, urgency_score)
            
            # Get previous history for current fill calculation
            previous = db.query(HistoricalWasteData).filter(
                HistoricalWasteData.tps_id == str(zone.id)
            ).order_by(HistoricalWasteData.timestamp_prediction.desc()).first()
            
            current_fill = get_current_fill(previous)
            
            # Create new historical data entry
            new_waste_data = HistoricalWasteData(
                kecamatan=zone.kecamatan,
                tps_id=str(zone.id),
                tps_type=zone.jenis_tps,
                zone_population=get_zone_population(zone.kecamatan),
                tps_capacity_kg=get_tps_capacity(zone.id),
                day_of_week=temporal["day_of_week"],
                is_weekend=temporal["is_weekend"],
                is_holiday=0, # Assuming no holiday check for now
                daily_growth_rate=growth_rate,
                rainfall_today=rainfall,
                event_urgency_score=urgency_score,
                current_fill_percentage=current_fill,
                timestamp_prediction=temporal["timestamp_prediction"]
            )
            
            db.add(new_waste_data)
            
            # Mark report as processed in the DB
            if mark_report_as_processed(db, report.id):
                processed_count += 1

        db.commit()
        print(f"Finished processing {processed_count} citizen reports.")
    
    except Exception as e:
        print(f"An error occurred during citizen report processing: {e}")
        db.rollback()
    finally:
        db.close()
