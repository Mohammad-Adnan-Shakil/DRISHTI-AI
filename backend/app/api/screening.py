from fastapi import APIRouter
router = APIRouter()

@router.post("/screening")
async def save_screening():
    return {"status": "stub — Phase 4"}

@router.get("/patient/{patient_id}/history")
async def get_history(patient_id: int):
    return {"status": "stub — Phase 6"}