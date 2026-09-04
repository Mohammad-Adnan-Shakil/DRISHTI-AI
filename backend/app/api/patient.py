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
