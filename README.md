<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=1a0000,8B0000,DC143C&height=200&section=header&text=DRISHTI-AI&fontSize=52&fontColor=ffffff&fontAlignY=38&desc=Explainable%20AI%20for%20Diabetic%20Retinopathy%20Screening%20in%20Rural%20India&descAlignY=60&descSize=16&animation=fadeIn"/>

</div>

<div align="center">

![SIH](https://img.shields.io/badge/SIH_2026-Internal_Round_Cleared-DC143C?style=for-the-badge)
![Problem](https://img.shields.io/badge/SIH26038-MathWorks-8B0000?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active_Build-success?style=for-the-badge)
![Live](https://img.shields.io/badge/Live-drishti--ai--ruddy.vercel.app-111111?style=for-the-badge&logo=vercel)

</div>

> **🏥 Cleared Smart India Hackathon 2026 — College Internal Round**
> PPT submission deadline: Sep 30, 2026 · Targeting Grand Finale selection
> Frontend live at [drishti-ai-ruddy.vercel.app](https://drishti-ai-ruddy.vercel.app) · Android APK available

---

## The Problem

Diabetic Retinopathy (DR) is the leading cause of preventable blindness in India.
Over 77 million people have diabetes — most live in rural areas with no access to ophthalmologists.
By the time patients reach a specialist, irreversible damage has already occurred.

**DRISHTI-AI bridges this gap** — giving rural health workers an AI-powered screening
tool that works offline, explains its decisions, and routes patients to care automatically.

---

## What DRISHTI Does

| Step | What Happens |
|------|-------------|
| 1 | Health worker uploads fundus image via mobile PWA (installable as Android APK) |
| 2 | MATLAB checks image quality + applies CLAHE enhancement |
| 3 | EfficientNet-B4 classifies DR severity (Grade 0-4) + flags DME |
| 4 | Lesion-level detection: microaneurysm count, hemorrhage count, exudate area %, optic disc localization |
| 5 | Grad-CAM generates heatmap + Frangi vessel map showing WHERE retinal damage is |
| 6 | Risk stratification engine scores patient using clinical history (HbA1c, diabetes duration, hypertension, family history) |
| 7 | Doctor reviews AI grade, can apply a clinical override — logged in a read-only System Audit Trail |
| 8 | Patient automatically receives a screening result email (with a downloadable clinical PDF report) once consented and the doctor confirms |
| 9 | Referral routed and tracked; full longitudinal patient history with DR grade progression over time |
| 10 | Simulink-modeled telemedicine capacity pipeline simulates patient arrival, AI processing, and doctor review queues for district-scale deployment planning |

---

## DR Severity Grading

| Grade | Diagnosis | Action |
|-------|-----------|--------|
| 0 | No DR | Monitor annually (or 6-month if high-risk profile) |
| 1 | Mild DR | Monitor every 6 months |
| 2 | Moderate DR | Refer within 3 months |
| 3 | Severe DR | Refer within 2 weeks |
| 4 | Proliferative DR | Urgent referral within 48 hours |

---

## Explainability

DRISHTI doesn't just output a grade — it shows its work:
- **Grad-CAM saliency maps** — visual heatmap of what the model attended to
- **Frangi vessel segmentation** — retinal vasculature map
- **Lesion-level biomarkers** — microaneurysm count, hemorrhage count, exudate area %, optic disc coordinates, surfaced on the doctor dashboard, patient history, and clinical PDF report
- **System Audit Trail** — every doctor override of the AI grade is logged with a timestamp, the doctor's name, the AI-vs-doctor grade delta, and clinical notes

---

## Tech Stack

### ML & Signal Processing
- **EfficientNet-B4** (PyTorch + timm) — DR grading (Grade 0-4) + DME detection (multi-task)
- **MATLAB Image Processing Toolbox** — CLAHE preprocessing, quality assessment, vessel segmentation
- **Simulink (SimEvents)** — discrete-event simulation of the PHC screening pipeline: patient arrival, AI processing queue, doctor review queue, and capacity/backlog modeling
- **Grad-CAM** — explainability heatmaps showing lesion regions
<<<<<<< HEAD
- **Training Data** — APTOS 2019 + IDRiD, 3,751 images combined pool | Model retrained on APTOS-only (3,296 images) with IDRiD (455 images) fully held out as an independent external test set
=======
- **Training Data** — APTOS 2019 + IDRiD, 3,751 images total | Internal validation split: 563 images | External validation on IDRiD (held out from training) in progress
>>>>>>> 0a8663eae22ccd44e5c11e891bfec8ce0b739dc9

### Backend
- **FastAPI** (Python) — REST API
- **JWT Authentication** — python-jose + passlib, role-based access (health_worker, doctor, admin), 24-hour token expiry
- **NeonDB** (PostgreSQL serverless) — patient records, screenings, referrals
- **Automated patient email notifications** — Gmail SMTP, HTML report email with inline branding, DPDP-consent-gated, idempotent, sent as a background task on doctor confirmation
- **Clinical PDF report generation** — client-rendered, server-attached, includes lesion summary, risk factor breakdown, and multimodal imaging (fundus / Grad-CAM / vessel map)
- **Groq LLM** — multilingual referral recommendations (Kannada, Hindi, Tamil, Telugu, Marathi, English)
- **Risk stratification engine** — scores Grade 0/1 patients using HbA1c, diabetes duration, hypertension, family history
- **Rate limiting** — 5/min login, 10/min classify

### Frontend
- **React + Tailwind CSS** — doctor dashboard + health worker interface
- **6-language localization** — English, Kannada, Hindi, Telugu, Tamil, Marathi (core screening workflow)
- **PWA + Service Worker** — offline-capable app shell, verified working with no network connection
- **Capacitor** — Android APK build, tested end-to-end on-device
- **Role-based protected routes** — health_worker, doctor, admin access control

### Deployment
- Frontend → Vercel ✅ Live at [drishti-ai-ruddy.vercel.app](https://drishti-ai-ruddy.vercel.app)
- Backend → FastAPI, tunneled via ngrok for live demo access
- Model weights → HuggingFace Hub (`adnshkl/drishti-efficientnet-b4-dr`)
- Android APK → built and verified on-device (Capacitor)

---

## Repository Structure

DRISHTI-AI/
├── backend/ # FastAPI REST API
│ ├── app/
│ │ ├── api/ # Route handlers + JWT auth
│ │ ├── core/ # Config, DB connection
│ │ ├── models/ # SQLAlchemy models
│ │ └── services/ # ML, MATLAB, LLM, risk engine, email
│ └── main.py
├── ml/
│ ├── matlab/ # MATLAB scripts (CLAHE, quality, segmentation)
│ ├── simulink/ # drishti_telemedicine_capacity.slx — PHC screening pipeline capacity model
│ └── models/ # Trained model weights
├── frontend/ # React PWA (doctor dashboard + health worker UI)
│ ├── src/locales/ # 6-language translation files
│ └── android/ # Capacitor Android project
└── docs/ # Architecture diagrams, API spec


---

## Model Performance

<<<<<<< HEAD
| Metric | Target | Internal Validation (n=563) | External Validation — IDRiD, held out (n=455) |
|--------|--------|-----------|-----------|
| Sensitivity (Referable DR, Grade 2+) | >90% | 92.8% | **80.9%** (95% CI: 76.1–84.9%) |
| Specificity | >85% | 93.6% | **99.3%** (95% CI: 96.3–99.9%) |
| 5-class accuracy | — | — | 51.0% |
| Processing time | < 5 seconds/image | **~2 seconds** | — |
| Report generation | < 30 seconds | — | — |
| Languages supported | 6 | **6** | — |

*Internal validation is a held-out split from the training data pool. External validation retrains the model on APTOS only and tests exclusively on IDRiD (455 images never seen during training) — a true generalization check. The drop in sensitivity from internal to external validation reflects the known domain-shift challenge in DR screening AI (different camera, population, and label distribution between datasets), and is an area of active work rather than a hidden limitation.*
=======
| Metric | Target | Internal Validation (n=563) |
|--------|--------|-----------|
| Sensitivity (Referable DR, Grade 2+) | >90% | **92.8%** |
| Specificity | >85% | **93.6%** |
| Processing time | < 5 seconds/image | **~2 seconds** |
| Report generation | < 30 seconds | — |
| Languages supported | 6 | **6** |
>>>>>>> 0a8663eae22ccd44e5c11e891bfec8ce0b739dc9

*Internal validation is a held-out split from the same training data pool (APTOS + IDRiD combined), not an independent external test set. External validation on fully held-out IDRiD data is in progress — see [ml/README.md] for methodology once available.*

---

## Achievements

| Recognition | Details |
|---|---|
| 🏥 SIH 2026 | Cleared college internal round — SIH26038 · MathWorks · PPT submission Sep 30 |

---

## Team

**Presidency University, Bengaluru — Batch 2024-2028**

| Role | Scope |
|------|-------|
| ML + Backend | EfficientNet, Grad-CAM, MATLAB, Simulink, FastAPI, NeonDB, Groq, JWT auth, risk engine, email notifications, PWA offline logic |
| Frontend | React PWA, doctor dashboard, health worker UI, role-based routing, 6-language localization |

---

<div align="center">

[![GitHub](https://img.shields.io/badge/Mohammad--Adnan--Shakil-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Mohammad-Adnan-Shakil)
[![LinkedIn](https://img.shields.io/badge/mohammadadnanshakil-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/mohammadadnanshakil)

<img src="https://capsule-render.vercel.app/api?type=waving&color=000000,8B0000,DC143C&height=120&section=footer"/>

</div>
