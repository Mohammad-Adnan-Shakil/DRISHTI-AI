from fastapi import APIRouter
router = APIRouter()

@router.post("/patient")
async def create_patient():
    return {"status": "stub — Phase 4"}

@router.get("/patient/{patient_id}")
async def get_patient(patient_id: int):
    return {"status": "stub — Phase 4"}