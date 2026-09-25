from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from app.core.database import get_db
from app.models.patient import Patient
from app.models.screening import Screening
from app.models.referral import Referral
from app.services.risk_service import calculate_risk

router = APIRouter()

class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    phone: Optional[str] = None
    email: Optional[str] = None
    phc_id: Optional[str] = None
    diabetes_duration_years: Optional[float] = None
    hba1c_level: Optional[float] = None
    hypertension: bool = False
    family_history_dr: bool = False
    preferred_language: str = "english"
    consent: Optional[bool] = True

    diabetes_duration_score: Optional[int] = None
    hba1c_score: Optional[int] = None
    bp_status_score: Optional[int] = None
    renal_marker_score: Optional[int] = None
    insulin_use_score: Optional[int] = None
    prior_dr_history_score: Optional[int] = None
    smoking_status_score: Optional[int] = None
    risk_score_total: Optional[int] = None
    risk_tier: Optional[str] = None

class PatientResponse(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    phone: Optional[str]
    email: Optional[str] = None
    phc_id: Optional[str]
    diabetes_duration_years: Optional[float]
    hba1c_level: Optional[float]
    hypertension: bool
    family_history_dr: bool
    preferred_language: str
    consent: Optional[bool] = True

    diabetes_duration_score: Optional[int] = None
    hba1c_score: Optional[int] = None
    bp_status_score: Optional[int] = None
    renal_marker_score: Optional[int] = None
    insulin_use_score: Optional[int] = None
    prior_dr_history_score: Optional[int] = None
    smoking_status_score: Optional[int] = None
    risk_score_total: Optional[int] = None
    risk_tier: Optional[str] = None

    class Config:
        from_attributes = True

class ScreeningHistoryItem(BaseModel):
    screening_id: int
    date: Optional[str]
    dr_grade: int
    dr_confidence: Optional[float] = None
    fundus_image_url: Optional[str] = None
    heatmap_url: Optional[str] = None
    vessel_map_url: Optional[str] = None
    referral_recommended: bool = False
    reviewed: bool = False
    microaneurysm_count: Optional[int] = 0
    microaneurysm_url: Optional[str] = None
    exudate_area_percent: Optional[float] = 0.0
    exudate_url: Optional[str] = None
    hemorrhage_count: Optional[int] = 0
    hemorrhage_url: Optional[str] = None
    optic_disc_center: Optional[List[int]] = None
    optic_disc_url: Optional[str] = None
    ophthalmologist_grade: Optional[int] = None
    doctor_notes: Optional[str] = None
    doctor_name: Optional[str] = None
    reviewed_at: Optional[str] = None

    class Config:
        from_attributes = True

@router.post("/patient", response_model=PatientResponse)
async def create_patient(data: PatientCreate, db: AsyncSession = Depends(get_db)):
    patient = Patient(**data.model_dump())
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient

@router.get("/patient/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/patient/{patient_id}/risk")
async def get_patient_risk(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    screening_result = await db.execute(
        select(Screening)
        .where(Screening.patient_id == patient_id)
        .order_by(Screening.created_at.desc())
    )
    latest = screening_result.scalars().first()
    dr_grade = latest.dr_grade if latest else 0

    patient_dict = {
        "diabetes_duration_years": patient.diabetes_duration_years,
        "hba1c_level": patient.hba1c_level,
        "hypertension": patient.hypertension,
        "family_history_dr": patient.family_history_dr
    }

    risk = calculate_risk(dr_grade, patient_dict)
    risk["patient_id"] = patient_id
    risk["dr_grade"] = dr_grade
    return risk

@router.get("/patient/{patient_id}/history", response_model=List[ScreeningHistoryItem])
async def get_patient_history(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Patient not found")

    screening_result = await db.execute(
        select(Screening)
        .where(Screening.patient_id == patient_id)
        .order_by(Screening.created_at.desc())
    )
    screenings = screening_result.scalars().all()

    ref_result = await db.execute(
        select(Referral)
        .where(Referral.patient_id == patient_id)
    )
    referrals = ref_result.scalars().all()
    ref_by_screening = {r.screening_id: r for r in referrals}

    history_items = []
    for s in screenings:
        r = ref_by_screening.get(s.id)
        is_reviewed = s.reviewed or (r is not None and r.status == "attended")
        ophth_grade = (r.ophthalmologist_grade if (r and r.ophthalmologist_grade is not None) else s.dr_grade) if is_reviewed else None
        doc_notes = (r.doctor_notes if (r and r.doctor_notes) else None) if is_reviewed else None
        doc_name = (r.doctor_name if (r and r.doctor_name) else "Dr. Arjun Sharma") if is_reviewed else None
        reviewed_at_str = None
        if is_reviewed:
            if r and r.updated_at:
                reviewed_at_str = r.updated_at.isoformat()
            elif s.created_at:
                reviewed_at_str = s.created_at.isoformat()

        history_items.append({
            "screening_id": s.id,
            "date": s.created_at.isoformat() if s.created_at else None,
            "dr_grade": s.dr_grade,
            "dr_confidence": s.dr_confidence,
            "fundus_image_url": s.fundus_image_url,
            "heatmap_url": s.heatmap_url,
            "vessel_map_url": getattr(s, "vessel_map_url", None),
            "referral_recommended": s.referral_recommended,
            "reviewed": is_reviewed,
            "microaneurysm_count": s.microaneurysm_count if s.microaneurysm_count is not None else 0,
            "microaneurysm_url": s.microaneurysm_url,
            "exudate_area_percent": s.exudate_area_percent if s.exudate_area_percent is not None else 0.0,
            "exudate_url": s.exudate_url,
            "hemorrhage_count": s.hemorrhage_count if s.hemorrhage_count is not None else 0,
            "hemorrhage_url": s.hemorrhage_url,
            "optic_disc_center": s.optic_disc_center,
            "optic_disc_url": s.optic_disc_url,
            "ophthalmologist_grade": ophth_grade,
            "doctor_notes": doc_notes,
            "doctor_name": doc_name,
            "reviewed_at": reviewed_at_str,
        })

    return history_items

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    phc_id: Optional[str] = None
    consent: Optional[bool] = None

@router.patch("/patient/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: int, data: PatientUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(patient, key, value)
    await db.commit()
    await db.refresh(patient)
    return patient