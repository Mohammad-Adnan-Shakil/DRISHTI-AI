from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.models.referral import Referral
from app.models.screening import Screening
from app.models.patient import Patient

router = APIRouter()

class ReferralCreate(BaseModel):
    screening_id: int
    patient_id: int

class ReferralUpdate(BaseModel):
    status: str  # pending/sent/attended/no_show
    ophthalmologist_grade: Optional[int] = None
    doctor_notes: Optional[str] = None

class ReferralResponse(BaseModel):
    id: int
    screening_id: int
    patient_id: int
    status: str
    ophthalmologist_grade: Optional[int]
    doctor_notes: Optional[str]

    class Config:
        from_attributes = True

@router.post("/referral", response_model=ReferralResponse)
async def create_referral(data: ReferralCreate, db: AsyncSession = Depends(get_db)):
    # Verify screening exists
    result = await db.execute(select(Screening).where(Screening.id == data.screening_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Screening not found")

    referral = Referral(**data.model_dump())
    db.add(referral)
    await db.commit()
    await db.refresh(referral)
    return referral

@router.patch("/referral/{referral_id}", response_model=ReferralResponse)
async def update_referral(referral_id: int, data: ReferralUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Referral).where(Referral.id == referral_id))
    referral = result.scalar_one_or_none()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")

    valid_statuses = ["pending", "sent", "attended", "no_show"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")

    referral.status = data.status
    if data.ophthalmologist_grade is not None:
        referral.ophthalmologist_grade = data.ophthalmologist_grade
    if data.doctor_notes is not None:
        referral.doctor_notes = data.doctor_notes

    await db.commit()
    await db.refresh(referral)
    return referral

@router.get("/referrals/pending")
async def get_pending_referrals(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Referral, Patient)
        .join(Patient, Referral.patient_id == Patient.id)
        .where(Referral.status == "pending")
        .order_by(Referral.id.desc())
    )
    rows = result.all()
    return [
        {
            "referral_id": r.id,
            "patient_id": p.id,
            "patient_name": p.name,
            "patient_age": p.age,
            "screening_id": r.screening_id,
            "status": r.status,
            "doctor_notes": r.doctor_notes
        }
        for r, p in rows
    ]

@router.get("/referrals/stats")
async def get_referral_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    total = await db.execute(select(func.count(Referral.id)))
    pending = await db.execute(select(func.count(Referral.id)).where(Referral.status == "pending"))
    attended = await db.execute(select(func.count(Referral.id)).where(Referral.status == "attended"))
    no_show = await db.execute(select(func.count(Referral.id)).where(Referral.status == "no_show"))
    return {
        "total": total.scalar(),
        "pending": pending.scalar(),
        "attended": attended.scalar(),
        "no_show": no_show.scalar()
    }
