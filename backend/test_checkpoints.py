import asyncio
import os
import sys
import time
from pathlib import Path
import httpx
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.patient import Patient
from app.models.screening import Screening

BASE_URL = "http://127.0.0.1:8000"
REPORTS_DIR = Path(__file__).resolve().parent / "static" / "reports"

DUMMY_PDF_BYTES = (
    b"%PDF-1.4\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
    b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF"
)

async def main():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Login as doctor to get JWT token
        print("=== AUTHENTICATING ===")
        login_res = await client.post(
            "/api/auth/login",
            data={"username": "dr_sharma", "password": "drishti123"},
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Doctor authenticated successfully.")

        # 2. Setup Patient 1 (consent=True, email=drishti.screening@gmail.com)
        async with AsyncSessionLocal() as session:
            p1 = Patient(
                name="Ramesh Kumar",
                age=54,
                gender="male",
                email="drishti.screening@gmail.com",
                consent=True,
                phc_id="PHC Hosakote",
            )
            session.add(p1)
            await session.commit()
            await session.refresh(p1)

            s1 = Screening(
                patient_id=p1.id,
                dr_grade=2,
                dr_confidence=0.91,
                referral_recommended=True,
                reviewed=False,
                recommendation_text="Refer to ophthalmologist within 2-4 weeks for dilated examination.",
            )
            session.add(s1)
            await session.commit()
            await session.refresh(s1)
            s1_id = s1.id
            p1_id = p1.id

        print(f"\nCreated Test Patient 1 (id={p1_id}, email=drishti.screening@gmail.com, consent=True)")
        print(f"Created Test Screening 1 (id={s1_id}, dr_grade=2, reviewed=False)")

        # CHECKPOINT B: Upload PDF report to POST /api/screenings/{id}/report
        print("\n==========================================")
        print(f"CHECKPOINT B: Upload PDF report for screening {s1_id}")
        print("==========================================")
        files = {"file": ("test_report.pdf", DUMMY_PDF_BYTES, "application/pdf")}
        upload_res = await client.post(
            f"/api/screenings/{s1_id}/report",
            files=files,
            headers=headers,
        )
        print(f"Upload Status Code: {upload_res.status_code}")
        print(f"Upload Response JSON: {upload_res.json()}")
        expected_file = REPORTS_DIR / f"{s1_id}.pdf"
        print(f"File exists on disk ({expected_file}): {expected_file.exists()}")
        if expected_file.exists():
            print(f"File size on disk: {expected_file.stat().st_size} bytes")

        # CHECKPOINT C: Trigger doctor-confirm endpoint
        print("\n==========================================")
        print(f"CHECKPOINT C: Trigger doctor-confirm endpoint for screening {s1_id}")
        print("==========================================")
        confirm_res = await client.post(
            f"/api/screenings/{s1_id}/confirm",
            json={"ophthalmologist_grade": 2, "doctor_notes": "Mild macular edema suspected, concurred with Grade 2"},
            headers=headers,
        )
        print(f"Confirm Status Code: {confirm_res.status_code}")
        print(f"Confirm Response JSON: {confirm_res.json()}")

        # CHECKPOINT D: Wait for background email task and verify DB
        print("\n==========================================")
        print("CHECKPOINT D: Verify Email Dispatch & DB Status")
        print("==========================================")
        # Wait up to 10 seconds for background email task to complete
        for _ in range(10):
            await asyncio.sleep(1.0)
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(Screening).where(Screening.id == s1_id))
                sc = res.scalar_one()
                if sc.email_status is not None:
                    break

        async with AsyncSessionLocal() as session:
            res = await session.execute(select(Screening).where(Screening.id == s1_id))
            sc = res.scalar_one()
            print(f"Screening {s1_id} reviewed: {sc.reviewed}")
            print(f"Screening {s1_id} email_status in DB: {sc.email_status}")
            print(f"Screening {s1_id} email_sent_at in DB: {sc.email_sent_at}")

        # CHECKPOINT E: Trigger doctor-confirm again on the same screening. Confirm NO second email is sent.
        print("\n==========================================")
        print(f"CHECKPOINT E: Idempotency Check on Screening {s1_id}")
        print("==========================================")
        sent_at_before = sc.email_sent_at
        repeat_res = await client.post(
            f"/api/screenings/{s1_id}/confirm",
            json={"ophthalmologist_grade": 2, "doctor_notes": "Second confirmation call"},
            headers=headers,
        )
        print(f"Second Confirm Status Code: {repeat_res.status_code}")
        print(f"Second Confirm Response JSON: {repeat_res.json()}")
        await asyncio.sleep(2.0)

        async with AsyncSessionLocal() as session:
            res = await session.execute(select(Screening).where(Screening.id == s1_id))
            sc_after = res.scalar_one()
            print(f"email_sent_at unchanged: {sc_after.email_sent_at == sent_at_before}")
            print(f"email_status remains: {sc_after.email_status}")

        # CHECKPOINT F: Patient with consent=False: no email sent, email_status="skipped"
        print("\n==========================================")
        print("CHECKPOINT F: Consent=False Gating Check")
        print("==========================================")
        async with AsyncSessionLocal() as session:
            p2 = Patient(
                name="Sunita Devi",
                age=61,
                gender="female",
                email="drishti.screening@gmail.com",
                consent=False,
                phc_id="PHC Hosakote",
            )
            session.add(p2)
            await session.commit()
            await session.refresh(p2)

            s2 = Screening(
                patient_id=p2.id,
                dr_grade=1,
                dr_confidence=0.88,
                referral_recommended=False,
                reviewed=False,
            )
            session.add(s2)
            await session.commit()
            await session.refresh(s2)
            s2_id = s2.id
            p2_id = p2.id

        print(f"Created Test Patient 2 (id={p2_id}, email=drishti.screening@gmail.com, consent=False)")
        print(f"Created Test Screening 2 (id={s2_id}, dr_grade=1, reviewed=False)")

        confirm_res_2 = await client.post(
            f"/api/screenings/{s2_id}/confirm",
            json={"doctor_notes": "Confirmed mild non-proliferative changes"},
            headers=headers,
        )
        print(f"Confirm Status Code: {confirm_res_2.status_code}")
        print(f"Confirm Response JSON: {confirm_res_2.json()}")

        # Wait for background task
        for _ in range(5):
            await asyncio.sleep(0.5)
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(Screening).where(Screening.id == s2_id))
                sc2 = res.scalar_one()
                if sc2.email_status is not None:
                    break

        async with AsyncSessionLocal() as session:
            res = await session.execute(select(Screening).where(Screening.id == s2_id))
            sc2 = res.scalar_one()
            print(f"Screening {s2_id} email_status in DB: {sc2.email_status}")
            print(f"Screening {s2_id} email_sent_at in DB: {sc2.email_sent_at}")
            assert sc2.email_status == "skipped", f"Expected email_status 'skipped', got {sc2.email_status}"
            assert sc2.email_sent_at is None, f"Expected email_sent_at to be None, got {sc2.email_sent_at}"
        print("CHECKPOINT F PASSED: email_status is 'skipped' and no email sent.")

if __name__ == "__main__":
    asyncio.run(main())
