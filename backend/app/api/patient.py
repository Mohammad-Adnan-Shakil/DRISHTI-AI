from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.models.patient import Patient

router = APIRouter()

class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    phone: Optional[str] = None
    phc_id: Optional[str] = None
    diabetes_duration_years: Optional[float] = None
    hba1c_level: Optional[float] = None
    hypertension: bool = False
    family_history_dr: bool = False
    preferred_language: str = "english"

class PatientResponse(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    phone: Optional[str]
    phc_id: Optional[str]
    diabetes_duration_years: Optional[float]
    hba1c_level: Optional[float]
    hypertension: bool
    family_history_dr: bool
    preferred_language: str

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


from app.services.risk_service import calculate_risk as _calc_risk
from app.models.screening import Screening as _Screening

@router.get("/patient/{patient_id}/risk")
async def get_patient_risk(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get latest screening grade
    screening_result = await db.execute(
        select(_Screening)
        .where(_Screening.patient_id == patient_id)
        .order_by(_Screening.created_at.desc())
    )
    latest = screening_result.scalars().first()
    dr_grade = latest.dr_grade if latest else 0

    patient_dict = {
        "diabetes_duration_years": patient.diabetes_duration_years,
        "hba1c_level": patient.hba1c_level,
        "hypertension": patient.hypertension,
        "family_history_dr": patient.family_history_dr
    }

    risk = _calc_risk(dr_grade, patient_dict)
    risk["patient_id"] = patient_id
    risk["dr_grade"] = dr_grade
    return risk
