from fastapi import APIRouter
router = APIRouter()

@router.post("/explain")
async def explain():
    return {"status": "stub — Phase 3"}