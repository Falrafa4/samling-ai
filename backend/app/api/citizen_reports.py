from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from difflib import SequenceMatcher

from app.database.database import get_db
from app.models.citizen_reports import CitizenReport
from app.models.zones import Zone
from app.schemas.citizen_reports import CitizenReportCreate, CitizenReportUpdate, CitizenReportResponse, WhatsAppWebhookInput
from app.api.deps import get_current_user
from app.utils.response import response_success

router = APIRouter(tags=["citizen-reports"])

@router.post("/citizen-reports", status_code=status.HTTP_201_CREATED)
def create_citizen_report(report_in: CitizenReportCreate, db: Session = Depends(get_db)):
    """
    Terima Laporan Pengaduan Warga Baru (Endpoint Publik untuk Webhook Chatbot WhatsApp).
    Melakukan deteksi duplikasi dalam 12 jam terakhir di zona yang sama dengan threshold kemiripan teks > 60%.
    Jika duplikat, laporan baru dan laporan pembanding sebelumnya akan ditandai is_grouped = True.
    """
    # 1. Validasi zone_id ada di database
    zone = db.query(Zone).filter(Zone.id == report_in.zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Zone dengan ID {report_in.zone_id} tidak terdaftar di sistem."
        )

    # 2. Ambil laporan di zona yang sama dalam 12 jam terakhir
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    twelve_hours_ago = now - timedelta(hours=12)
    
    previous_reports = (
        db.query(CitizenReport)
        .filter(
            CitizenReport.zone_id == report_in.zone_id,
            CitizenReport.created_at >= twelve_hours_ago
        )
        .all()
    )

    # 3. Hitung kemiripan teks menggunakan SequenceMatcher
    is_duplicate = False
    matching_reports = []
    
    for r in previous_reports:
        # Menghitung rasio kemiripan konten aduan secara case-insensitive
        ratio = SequenceMatcher(None, r.report_content.strip().lower(), report_in.report_content.strip().lower()).ratio()
        if ratio > 0.60:
            is_duplicate = True
            matching_reports.append(r)

    # 4. Simpan aduan baru
    new_report = CitizenReport(
        whatsapp_number=report_in.whatsapp_number,
        report_content=report_in.report_content,
        zone_id=report_in.zone_id,
        status="Baru",
        is_grouped=is_duplicate
    )
    db.add(new_report)

    # 5. Jika terdeteksi duplikat, set is_grouped = True pada laporan pembanding sebelumnya
    if is_duplicate:
        for r in matching_reports:
            r.is_grouped = True

    db.commit()
    db.refresh(new_report)

    # Load zone relationship to return in response
    new_report_loaded = (
        db.query(CitizenReport)
        .options(joinedload(CitizenReport.zone))
        .filter(CitizenReport.id == new_report.id)
        .first()
    )

    data = CitizenReportResponse.model_validate(new_report_loaded)
    return response_success(data=data, message="Laporan aduan warga berhasil diterima.")

@router.get("/citizen-reports")
def get_citizen_reports(
    zone_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Mengambil daftar laporan pengaduan warga (Memerlukan Autentikasi).
    Mendukung pemfilteran berdasarkan zone_id dan status untuk visualisasi Kanban Board.
    Menerapkan Eager Loading pada relasi zone untuk performa kueri yang optimal.
    """
    query = db.query(CitizenReport).options(joinedload(CitizenReport.zone))
    
    if zone_id is not None:
        query = query.filter(CitizenReport.zone_id == zone_id)
    if status is not None:
        query = query.filter(CitizenReport.status == status)
        
    reports = query.order_by(CitizenReport.created_at.desc()).all()
    
    data = [CitizenReportResponse.model_validate(r) for r in reports]
    return response_success(data=data, message="Daftar laporan aduan warga berhasil diambil.")

@router.put("/citizen-reports/{id}")
def update_citizen_report(
    id: int,
    report_update: CitizenReportUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Memperbarui status atau wilayah tugas laporan aduan (Memerlukan Autentikasi).
    Digunakan untuk memindahkan kartu aduan di Kanban Board (Baru -> Sedang Ditangani -> Selesai).
    """
    # 1. Cari laporan berdasarkan ID
    report = db.query(CitizenReport).filter(CitizenReport.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laporan aduan tidak ditemukan."
        )

    # 2. Validasi zone_id jika diperbarui
    if report_update.zone_id is not None:
        zone = db.query(Zone).filter(Zone.id == report_update.zone_id).first()
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Zone dengan ID {report_update.zone_id} tidak terdaftar."
            )
        report.zone_id = report_update.zone_id

    # 3. Perbarui status jika disediakan
    if report_update.status is not None:
        valid_statuses = ["Baru", "Sedang Ditangani", "Selesai"]
        if report_update.status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Status tidak valid. Pilih di antara: {', '.join(valid_statuses)}"
            )
        report.status = report_update.status

    db.commit()
    
    # Reload with zone eager loaded
    report_loaded = (
        db.query(CitizenReport)
        .options(joinedload(CitizenReport.zone))
        .filter(CitizenReport.id == id)
        .first()
    )
    
    data = CitizenReportResponse.model_validate(report_loaded)
    return response_success(data=data, message="Laporan aduan warga berhasil diperbarui.")

@router.delete("/citizen-reports/{id}")
def delete_citizen_report(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Menghapus laporan pengaduan warga berdasarkan ID (Memerlukan Autentikasi).
    """
    report = db.query(CitizenReport).filter(CitizenReport.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laporan aduan tidak ditemukan."
        )
        
    db.delete(report)
    db.commit()
    return response_success(message="Laporan aduan warga berhasil dihapus.")

@router.post("/webhook/whatsapp", status_code=status.HTTP_201_CREATED)
def whatsapp_webhook(webhook_in: WhatsAppWebhookInput, db: Session = Depends(get_db)):
    """
    WhatsApp Chatbot Webhook (Endpoint Publik untuk Twilio/Chatbot Gateway).
    Menyimpan pesan aduan warga langsung ke citizen_reports dengan zone_id dan deteksi duplikasi dalam 12 jam terakhir.
    """
    # 1. Validasi zone_id ada di database
    zone = db.query(Zone).filter(Zone.id == webhook_in.zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Zone dengan ID {webhook_in.zone_id} tidak terdaftar di sistem."
        )

    # 2. Ambil laporan di zona yang sama dalam 12 jam terakhir
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    twelve_hours_ago = now - timedelta(hours=12)
    
    previous_reports = (
        db.query(CitizenReport)
        .filter(
            CitizenReport.zone_id == webhook_in.zone_id,
            CitizenReport.created_at >= twelve_hours_ago
        )
        .all()
    )

    # 3. Hitung kemiripan teks menggunakan SequenceMatcher
    is_duplicate = False
    matching_reports = []
    
    for r in previous_reports:
        ratio = SequenceMatcher(None, r.report_content.strip().lower(), webhook_in.report_content.strip().lower()).ratio()
        if ratio > 0.60:
            is_duplicate = True
            matching_reports.append(r)

    # 4. Simpan aduan baru
    new_report = CitizenReport(
        whatsapp_number=webhook_in.whatsapp_number,
        report_content=webhook_in.report_content,
        zone_id=webhook_in.zone_id,
        status="Baru",
        is_grouped=is_duplicate
    )
    db.add(new_report)

    # 5. Jika terdeteksi duplikat, set is_grouped = True pada laporan pembanding sebelumnya
    if is_duplicate:
        for r in matching_reports:
            r.is_grouped = True

    db.commit()
    return {"status": "success", "message": "Report saved"}
