from pathlib import Path
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List
from app.core.database import get_db, AsyncSessionLocal
from app.api.auth import verify_token, TokenData
from app.models.screening import Screening
from app.models.patient import Patient
from app.models.referral import Referral
from app.services.email_service import (
    send_email,
    render_screening_email,
    LOGO_INLINE,
    mask_email,
    GRADE_STYLES,
)
from app.core.logging_config import logger

router = APIRouter()

REPORTS_DIR = Path(__file__).resolve().parent.parent.parent / "static" / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

GRADE_ACTIONS = {
    0: "Annual screening recommended. Continue regular blood sugar control and healthy diet.",
    1: "Monitor every 6 months. Maintain glycemic and blood pressure targets.",
    2: "Refer to ophthalmologist within 2-4 weeks for comprehensive dilated examination.",
    3: "Urgent referral to ophthalmologist within 2 weeks.",
    4: "Emergency referral to ophthalmologist within 48 hours for immediate evaluation.",
}

class ScreeningCreate(BaseModel):
    patient_id: int
    dr_grade: int
    dr_confidence: Optional[float] = None
    dme_present: bool = False
    dme_confidence: Optional[float] = None
    quality_score: Optional[int] = None
    fundus_image_url: Optional[str] = None
    heatmap_url: Optional[str] = None
    vessel_map_url: Optional[str] = None
    risk_stratification: Optional[str] = None
    referral_recommended: bool = False
    recommendation_text: Optional[str] = None
    recommendation_language: str = "english"
    microaneurysm_count: Optional[int] = 0
    microaneurysm_url: Optional[str] = None
    exudate_area_percent: Optional[float] = 0.0
    exudate_url: Optional[str] = None
    hemorrhage_count: Optional[int] = 0
    hemorrhage_url: Optional[str] = None
    optic_disc_center: Optional[List[int]] = None
    optic_disc_url: Optional[str] = None

class ScreeningResponse(BaseModel):
    id: int
    patient_id: int
    dr_grade: int
    dr_confidence: Optional[float]
    dme_present: bool
    dme_confidence: Optional[float]
    quality_score: Optional[int]
    fundus_image_url: Optional[str]
    heatmap_url: Optional[str]
    vessel_map_url: Optional[str]
    risk_stratification: Optional[str]
    referral_recommended: bool
    recommendation_text: Optional[str]
    recommendation_language: str
    microaneurysm_count: Optional[int] = 0
    microaneurysm_url: Optional[str] = None
    exudate_area_percent: Optional[float] = 0.0
    exudate_url: Optional[str] = None
    hemorrhage_count: Optional[int] = 0
    hemorrhage_url: Optional[str] = None
    optic_disc_center: Optional[List[int]] = None
    optic_disc_url: Optional[str] = None
    email_status: Optional[str] = None
    email_sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.post("/screening", response_model=ScreeningResponse)
async def save_screening(data: ScreeningCreate, db: AsyncSession = Depends(get_db), token: TokenData = Depends(verify_token)):
    result = await db.execute(select(Patient).where(Patient.id == data.patient_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Patient not found")
    screening = Screening(**data.model_dump())
    db.add(screening)
    await db.commit()
    await db.refresh(screening)
    return screening

@router.post("/screenings/{screening_id}/report")
@router.post("/screening/{screening_id}/report")
async def upload_screening_report(
    screening_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    token: TokenData = Depends(verify_token),
):
    """
    Accepts multipart PDF upload of the client-side generated report.
    Validates content-type is application/pdf, size <= 5MB.
    Saves to backend/static/reports/{screening_id}.pdf.
    """
    result = await db.execute(select(Screening).where(Screening.id == screening_id))
    screening = result.scalar_one_or_none()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only application/pdf is allowed")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 5MB")
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File cannot be empty")

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_file = REPORTS_DIR / f"{screening_id}.pdf"
    report_file.write_bytes(content)

    logger.info(f"Saved PDF report for screening_id={screening_id} ({len(content)} bytes)")
    return {"status": "saved", "path": f"static/reports/{screening_id}.pdf"}

async def send_screening_email_task(screening_id: int):
    """
    Background task to send screening report email to patient.
    Uses a fresh DB session and respects idempotency & consent gates.
    """
    async with AsyncSessionLocal() as session:
        try:
            stmt = (
                select(Screening, Patient)
                .join(Patient, Screening.patient_id == Patient.id)
                .where(Screening.id == screening_id)
            )
            result = await session.execute(stmt)
            row = result.first()
            if not row:
                logger.error(f"[EmailTask] Screening {screening_id} or patient record not found")
                return
            screening, patient = row

            # Idempotency check: if email_sent_at is already set on this screening, do not send again
            if screening.email_sent_at is not None:
                logger.info(f"[EmailTask] Screening {screening_id} email already sent at {screening.email_sent_at}. Skipping.")
                return

            # Gate: only send if patient.consent == True AND patient.email is not null
            patient_email = (patient.email or "").strip()
            if not (patient.consent is True and bool(patient_email)):
                logger.info(
                    f"[EmailTask] Screening {screening_id} email skipped: consent={patient.consent}, "
                    f"email={mask_email(patient_email) if patient_email else 'None'}"
                )
                screening.email_status = "skipped"
                await session.commit()
                return

            # Check Referral for doctor's grade
            ref_stmt = select(Referral).where(Referral.screening_id == screening_id)
            ref_result = await session.execute(ref_stmt)
            referral = ref_result.scalar_one_or_none()

            # DOCTOR's grade from Referral.ophthalmologist_grade if set, otherwise AI grade
            if referral and referral.ophthalmologist_grade is not None:
                effective_grade = referral.ophthalmologist_grade
            else:
                effective_grade = screening.dr_grade

            # Recommended action text
            recommended_action = screening.recommendation_text or GRADE_ACTIONS.get(
                effective_grade, "Consult your physician for further clinical evaluation."
            )

            screening_date = (
                screening.created_at.strftime("%d %b %Y")
                if screening.created_at
                else datetime.now(timezone.utc).strftime("%d %b %Y")
            )
            phc_name = patient.phc_id or "PHC Hosakote"
            phc_contact = "+91 80 2793 1234"

            # Check if PDF report exists
            pdf_path = REPORTS_DIR / f"{screening_id}.pdf"
            attachments = None
            if pdf_path.exists() and pdf_path.is_file():
                try:
                    pdf_bytes = pdf_path.read_bytes()
                    attachments = [("DRISHTI_Report.pdf", pdf_bytes, "application/pdf")]
                except Exception as e:
                    logger.warning(f"[EmailTask] Screening {screening_id}: failed to read report PDF {pdf_path}: {e}")
            else:
                logger.warning(
                    f"[EmailTask] Screening {screening_id}: report PDF not found at {pdf_path}. "
                    "Sending email without PDF attachment."
                )

            # Render email
            subject, html, text_body = render_screening_email(
                patient_name=patient.name,
                dr_grade=effective_grade,
                recommended_action=recommended_action,
                screening_date=screening_date,
                phc_name=phc_name,
                phc_contact=phc_contact,
            )

            # Send email
            email_res = await send_email(
                to=patient_email,
                subject=subject,
                html=html,
                text=text_body,
                inline_images=LOGO_INLINE,
                attachments=attachments,
            )

            status = email_res.get("status")  # "sent" or "failed"
            screening.email_status = status
            if status == "sent":
                screening.email_sent_at = datetime.now(timezone.utc)
            await session.commit()

            if status == "sent":
                logger.info(
                    f"[EmailTask] Screening {screening_id} email sent successfully to {mask_email(patient_email)} | "
                    f"message_id={email_res.get('message_id')}"
                )
            else:
                logger.error(
                    f"[EmailTask] Screening {screening_id} email failed to {mask_email(patient_email)} | "
                    f"error={email_res.get('error')}"
                )
        except Exception as exc:
            logger.error(f"[EmailTask] Error executing email background task for screening {screening_id}: {exc}")
            try:
                screening.email_status = "failed"
                await session.commit()
            except Exception:
                pass

class ScreeningConfirmRequest(BaseModel):
    ophthalmologist_grade: Optional[int] = None
    doctor_notes: Optional[str] = None

@router.post("/screenings/{screening_id}/confirm")
@router.post("/screening/{screening_id}/confirm")
@router.patch("/screenings/{screening_id}/confirm")
@router.patch("/screening/{screening_id}/confirm")
async def confirm_screening(
    screening_id: int,
    background_tasks: BackgroundTasks,
    data: Optional[ScreeningConfirmRequest] = None,
    db: AsyncSession = Depends(get_db),
    token: TokenData = Depends(verify_token),
):
    """
    Confirms/finalizes a screening, marks reviewed=True, updates referral if provided,
    and schedules email dispatch as a FastAPI BackgroundTask.
    """
    result = await db.execute(select(Screening).where(Screening.id == screening_id))
    screening = result.scalar_one_or_none()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")

    screening.reviewed = True

    # Check for linked referral
    ref_result = await db.execute(select(Referral).where(Referral.screening_id == screening_id))
    referral = ref_result.scalar_one_or_none()
    if referral:
        referral.status = "attended"
        if data:
            if data.ophthalmologist_grade is not None:
                referral.ophthalmologist_grade = data.ophthalmologist_grade
            if data.doctor_notes is not None:
                referral.doctor_notes = data.doctor_notes
    elif data and (data.ophthalmologist_grade is not None or data.doctor_notes is not None):
        referral = Referral(
            screening_id=screening.id,
            patient_id=screening.patient_id,
            status="attended",
            ophthalmologist_grade=data.ophthalmologist_grade,
            doctor_notes=data.doctor_notes,
        )
        db.add(referral)

    await db.commit()
    await db.refresh(screening)

    # Schedule background email task
    background_tasks.add_task(send_screening_email_task, screening_id)

    return {
        "status": "confirmed",
        "screening_id": screening_id,
        "reviewed": screening.reviewed,
        "email_status": screening.email_status,
        "email_sent_at": screening.email_sent_at.isoformat() if screening.email_sent_at else None,
    }

@router.patch("/patient/{patient_id}/screenings/review")
async def mark_patient_screenings_reviewed(
    patient_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    token: TokenData = Depends(verify_token)
):
    """
    Called when a doctor confirms/submits their review on the Doctor Review
    page. Marks every pending (referral-recommended, not yet reviewed)
    screening for this patient as reviewed, so they drop out of
    /screenings/pending — the doctor's queue no longer shows them.
    Schedules background email tasks for all confirmed screenings.
    """
    result = await db.execute(
        select(Screening).where(
            Screening.patient_id == patient_id,
            Screening.referral_recommended == True,
            Screening.reviewed == False
        )
    )
    screenings = result.scalars().all()
    if not screenings:
        raise HTTPException(status_code=404, detail="No pending screenings found for this patient")

    screening_ids = []
    for screening in screenings:
        screening.reviewed = True
        screening_ids.append(screening.id)

    await db.commit()

    for sid in screening_ids:
        background_tasks.add_task(send_screening_email_task, sid)

    return {"patient_id": patient_id, "reviewed_count": len(screenings), "screening_ids": screening_ids}


@router.get("/screenings/pending")
async def get_pending_screenings(db: AsyncSession = Depends(get_db), token: TokenData = Depends(verify_token)):
    result = await db.execute(
        select(Screening, Patient)
        .join(Patient, Screening.patient_id == Patient.id)
        .where(Screening.referral_recommended == True, Screening.reviewed == False)
        .order_by(Screening.created_at.desc())
    )
    rows = result.all()
    return [
        {
            "screening_id": s.id,
            "patient_id": p.id,
            "patient_name": p.name,
            "patient_age": p.age,
            "phc_id": p.phc_id,
            "dr_grade": s.dr_grade,
            "dr_confidence": s.dr_confidence,
            "dme_present": s.dme_present,
            "risk_stratification": s.risk_stratification,
            "fundus_image_url": s.fundus_image_url,
            "heatmap_url": s.heatmap_url,
            "recommendation_text": s.recommendation_text,
            "referral_recommended": s.referral_recommended,
            "microaneurysm_count": s.microaneurysm_count if s.microaneurysm_count is not None else 0,
            "microaneurysm_url": s.microaneurysm_url,
            "exudate_area_percent": s.exudate_area_percent if s.exudate_area_percent is not None else 0.0,
            "exudate_url": s.exudate_url,
            "hemorrhage_count": s.hemorrhage_count if s.hemorrhage_count is not None else 0,
            "hemorrhage_url": s.hemorrhage_url,
            "optic_disc_center": s.optic_disc_center,
            "optic_disc_url": s.optic_disc_url,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s, p in rows
    ]

@router.get("/screenings/reviewed")
async def get_reviewed_screenings(db: AsyncSession = Depends(get_db), token: TokenData = Depends(verify_token)):
    result = await db.execute(
        select(Screening, Patient)
        .join(Patient, Screening.patient_id == Patient.id)
        .where(Screening.reviewed == True)
        .order_by(Screening.created_at.desc())
    )
    rows = result.all()
    return [
        {
            "screening_id": s.id,
            "patient_id": p.id,
            "patient_name": p.name,
            "patient_age": p.age,
            "phc_id": p.phc_id,
            "dr_grade": s.dr_grade,
            "dr_confidence": s.dr_confidence,
            "dme_present": s.dme_present,
            "risk_stratification": s.risk_stratification,
            "fundus_image_url": s.fundus_image_url,
            "heatmap_url": s.heatmap_url,
            "recommendation_text": s.recommendation_text,
            "referral_recommended": s.referral_recommended,
            "microaneurysm_count": s.microaneurysm_count if s.microaneurysm_count is not None else 0,
            "microaneurysm_url": s.microaneurysm_url,
            "exudate_area_percent": s.exudate_area_percent if s.exudate_area_percent is not None else 0.0,
            "exudate_url": s.exudate_url,
            "hemorrhage_count": s.hemorrhage_count if s.hemorrhage_count is not None else 0,
            "hemorrhage_url": s.hemorrhage_url,
            "optic_disc_center": s.optic_disc_center,
            "optic_disc_url": s.optic_disc_url,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s, p in rows
    ]

@router.get("/screenings/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db), token: TokenData = Depends(verify_token)):
    total = await db.execute(select(func.count(Screening.id)))
    referrals = await db.execute(
        select(func.count(Screening.id)).where(Screening.referral_recommended == True)
    )
    dme_cases = await db.execute(
        select(func.count(Screening.id)).where(Screening.dme_present == True)
    )
    grade_dist = await db.execute(
        select(Screening.dr_grade, func.count(Screening.id))
        .group_by(Screening.dr_grade)
    )
    total_patients = await db.execute(select(func.count(Patient.id)))

    active_phcs = await db.execute(
        select(func.count(func.distinct(Patient.phc_id)))
        .join(Screening, Screening.patient_id == Patient.id)
        .where(Patient.phc_id.isnot(None))
    )
    pending_reviews = await db.execute(
        select(func.count(Screening.id))
        .where(Screening.reviewed == False, Screening.referral_recommended == True)
    )
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    reviewed_30d = await db.execute(
        select(func.count(Screening.id))
        .where(Screening.reviewed == True, Screening.created_at >= thirty_days_ago)
    )

    referrals_recommended_count = referrals.scalar()

    return {
        "total_screenings": total.scalar(),
        "referrals_recommended": referrals_recommended_count,
        "dme_cases": dme_cases.scalar(),
        "grade_distribution": {str(g): c for g, c in grade_dist.all()},
        "total_patients": total_patients.scalar(),
        "active_phcs": active_phcs.scalar(),
        "pending_reviews": pending_reviews.scalar(),
        "reviewed_30d": reviewed_30d.scalar(),
        "referable_cases": referrals_recommended_count
    }

@router.get("/screening/{screening_id}", response_model=ScreeningResponse)
async def get_screening(screening_id: int, db: AsyncSession = Depends(get_db), token: TokenData = Depends(verify_token)):
    result = await db.execute(select(Screening).where(Screening.id == screening_id))
    screening = result.scalar_one_or_none()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")
    return screening

# Note: GET /patient/{patient_id}/history lives in app/api/patient.py


