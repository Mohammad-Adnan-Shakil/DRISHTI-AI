import asyncio
import os
import sys
from pathlib import Path
import httpx
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.patient import Patient
from app.models.screening import Screening

BASE_URL = "http://127.0.0.1:8000"
REPORTS_DIR = Path(__file__).resolve().parent / "static" / "reports"

# Minimal valid PDF bytes
SAMPLE_PDF_BYTES = (
    b"%PDF-1.4\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
    b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF"
)

async def run_tests():
    print("==================================================")
    print("STARTING END-TO-END AUTOMATED CHECKPOINTS")
    print("==================================================")
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        # Auth doctor
        login_res = await client.post(
            "/api/auth/login",
            data={"username": "dr_sharma", "password": "drishti123"},
        )
        assert login_res.status_code == 200, f"Doctor login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("[Auth] Doctor authenticated successfully.")

        # CHECKPOINT A: Register a new test patient with phone filled in
        print("\n--- CHECKPOINT A: Register new patient with phone ---")
        patient_payload = {
            "name": "Priyanka Patel",
            "age": 49,
            "gender": "female",
            "phone": "+91 98765 12345",
            "email": "drishti.screening@gmail.com",
            "diabetes_duration_years": 8.0,
            "hba1c": 8.4,
            "hypertension": True,
            "consent": True,
            "preferred_language": "English",
            "phc_id": "PHC Hosakote"
        }
        reg_res = await client.post("/api/patient", json=patient_payload)
        assert reg_res.status_code in (200, 201), f"Patient registration failed: {reg_res.text}"
        patient_data = reg_res.json()
        patient_id = patient_data["id"]
        print(f"Registered patient ID: {patient_id}")
        print(f"API returned phone: {patient_data.get('phone')}")
        print(f"API returned email: {patient_data.get('email')}")
        assert patient_data.get("phone") == "+91 98765 12345", f"Expected phone '+91 98765 12345', got {patient_data.get('phone')}"

        # Verify directly in DB
        async with AsyncSessionLocal() as session:
            db_pat = await session.get(Patient, patient_id)
            assert db_pat is not None, "Patient not found in DB!"
            print(f"DB verification: id={db_pat.id}, name='{db_pat.name}', phone='{db_pat.phone}', email='{db_pat.email}'")
            assert db_pat.phone == "+91 98765 12345", f"DB phone mismatch: {db_pat.phone}"
        print("CHECKPOINT A PASSED: Patient registered with phone and verified in DB.")

        # CHECKPOINT D: Full screening -> doctor confirm flow end to end with auto-uploaded report PDF
        print("\n--- CHECKPOINT D: Full screening -> report upload -> doctor confirm flow ---")
        # 1. Save screening (as PHC clinician does)
        screening_payload = {
            "patient_id": patient_id,
            "dr_grade": 2,
            "dr_confidence": 0.94,
            "referral_recommended": True,
            "recommendation_text": "Referral recommended for moderate NPDR management.",
            "recommendation_language": "english"
        }
        scr_res = await client.post("/api/screening", json=screening_payload, headers=headers)
        assert scr_res.status_code in (200, 201), f"Screening creation failed: {scr_res.text}"
        screening_id = scr_res.json()["id"]
        print(f"Created screening ID: {screening_id}")

        # 2. Upload report PDF (simulating the client-side auto-upload side-effect from Screening.jsx)
        files = {"file": (f"DRISHTI_Screening_{patient_id}.pdf", SAMPLE_PDF_BYTES, "application/pdf")}
        upload_res = await client.post(
            f"/api/screenings/{screening_id}/report",
            files=files,
            headers=headers
        )
        assert upload_res.status_code == 200, f"Report upload failed: {upload_res.text}"
        print(f"Report upload response: {upload_res.json()}")
        expected_pdf = REPORTS_DIR / f"{screening_id}.pdf"
        assert expected_pdf.exists(), f"Expected report PDF at {expected_pdf}"
        print(f"Verified report PDF saved at {expected_pdf} ({expected_pdf.stat().st_size} bytes)")

        # 3. Doctor reviews & confirms the screening
        confirm_payload = {
            "ophthalmologist_grade": 2,
            "doctor_notes": "Concur with AI Grade 2 (Moderate NPDR). Referral scheduled."
        }
        conf_res = await client.post(
            f"/api/screenings/{screening_id}/confirm",
            json=confirm_payload,
            headers=headers
        )
        assert conf_res.status_code == 200, f"Screening confirm failed: {conf_res.text}"
        print(f"Doctor confirmation response: {conf_res.json()}")

        # 4. Wait for background email task
        print("Waiting for background email dispatch...")
        for _ in range(12):
            await asyncio.sleep(1.0)
            async with AsyncSessionLocal() as session:
                sc = await session.get(Screening, screening_id)
                if sc and sc.email_status is not None:
                    break

        async with AsyncSessionLocal() as session:
            final_scr = await session.get(Screening, screening_id)
            print(f"Screening reviewed status: {final_scr.reviewed}")
            print(f"Screening email_status: {final_scr.email_status}")
            print(f"Screening email_sent_at: {final_scr.email_sent_at}")
            assert final_scr.reviewed is True, "Screening should be marked reviewed"
            assert final_scr.email_status == "sent", f"Expected email_status 'sent', got {final_scr.email_status}"
            assert final_scr.email_sent_at is not None, "email_sent_at should be recorded"

        print("CHECKPOINT D PASSED: Full flow completed, PDF uploaded, doctor confirmed, email dispatched with attachment.")

if __name__ == "__main__":
    asyncio.run(run_tests())
