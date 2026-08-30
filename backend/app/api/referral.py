from fastapi import APIRouter
router = APIRouter()

@router.post("/referral")
async def create_referral():
    return {"status": "stub — Phase 6"}

@router.patch("/referral/{referral_id}")
async def update_referral(referral_id: int):
    return {"status": "stub — Phase 6"}

@router.get("/referrals/pending")
async def pending_referrals():
    return {"status": "stub — Phase 6"}

@router.get("/referrals/stats")
async def referral_stats():
    return {"status": "stub — Phase 6"}