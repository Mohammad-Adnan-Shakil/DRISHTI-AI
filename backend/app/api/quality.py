from fastapi import APIRouter
router = APIRouter()

@router.post("/quality-check")
async def quality_check():
    return {"status": "stub — Phase 2"}