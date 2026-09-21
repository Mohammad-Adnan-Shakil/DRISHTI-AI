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
> Frontend live at [drishti-ai-ruddy.vercel.app](https://drishti-ai-ruddy.vercel.app) · Backend deployment in progress

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
| 1 | Health worker uploads fundus image via mobile PWA |
| 2 | MATLAB checks image quality + applies CLAHE enhancement |
| 3 | EfficientNet-B4 classifies DR severity (Grade 0-4) + flags DME |
| 4 | Risk stratification engine scores patient using clinical history |
| 5 | Grad-CAM generates heatmap showing WHERE retinal damage is |
| 6 | Groq LLM generates referral recommendation in patient preferred language |
| 7 | Patient record saved, doctor notified, referral tracked |

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

## Tech Stack

### ML & Signal Processing
- **EfficientNet-B4** (PyTorch + timm) — DR grading (Grade 0-4) + DME detection (multi-task)
- **MATLAB Image Processing Toolbox** — CLAHE preprocessing, quality assessment, vessel segmentation
- **Simulink + Stateflow** — DR screening pipeline model, referral workflow state machine
- **Grad-CAM** — explainability heatmaps showing lesion regions
- **Training Data** — APTOS 2019 (3,662) + IDRiD (455, pixel-level DME masks) — 4,117 images | Validated against Messidor-2 (1,748)

### Backend
- **FastAPI** (Python) — REST API
- **JWT Authentication** — python-jose + passlib, role-based access (health_worker, doctor, admin), 24-hour token expiry
- **NeonDB** (PostgreSQL serverless) — patient records, screenings, referrals
- **Groq LLM** — multilingual referral recommendations (Kannada, Hindi, Tamil, Telugu, Marathi, English)
- **Risk stratification engine** — scores Grade 0/1 patients using HbA1c, diabetes duration, hypertension, family history

### Frontend
- **React + Tailwind CSS** — doctor dashboard + health worker interface
- **PWA + Service Worker + IndexedDB** — offline-first, auto-sync when connection restored
- **Capacitor** — Android APK build
- **Role-based protected routes** — health_worker, doctor, admin access control

### Deployment
- Backend → deployment in progress
- Frontend → Vercel ✅ Live at [drishti-ai-ruddy.vercel.app](https://drishti-ai-ruddy.vercel.app)
- Model weights → HuggingFace Hub (`adnshkl/drishti-efficientnet-b4-dr`)
- Android APK → built (DRISHTI-AI.apk, 4.7MB)

---

## Repository Structure

DRISHTI-AI/
├── backend/ # FastAPI REST API
│ ├── app/
│ │ ├── api/ # Route handlers + JWT auth
│ │ ├── core/ # Config, DB connection
│ │ ├── models/ # SQLAlchemy models
│ │ └── services/ # ML, MATLAB, LLM, risk engine
│ └── main.py
├── ml/
│ ├── matlab/ # MATLAB scripts (CLAHE, quality, segmentation)
│ ├── simulink/ # Simulink pipeline model + Stateflow referral FSM
│ └── models/ # Trained model weights
├── frontend/ # React PWA (doctor dashboard + health worker UI)
│ └── android/ # Capacitor Android project
└── docs/ # Architecture diagrams, API spec


---

## Model Performance

| Metric | Target | Achieved |
|--------|--------|----------|
| Sensitivity (Grade 2+) | 91-94% | **92.8%** |
| Specificity | > 85% | **93.6%** |
| Processing time | < 5 seconds/image | **~2 seconds** |
| Report generation | < 30 seconds | — |
| Languages supported | 6 | **6** |

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
| ML + Backend | EfficientNet, Grad-CAM, MATLAB, FastAPI, NeonDB, Groq, JWT auth, risk engine, PWA offline logic |
| Frontend | React PWA, doctor dashboard, health worker UI, role-based routing |

---

<div align="center">

[![GitHub](https://img.shields.io/badge/Mohammad--Adnan--Shakil-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Mohammad-Adnan-Shakil)
[![LinkedIn](https://img.shields.io/badge/mohammadadnanshakil-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/mohammadadnanshakil)

<img src="https://capsule-render.vercel.app/api?type=waving&color=000000,8B0000,DC143C&height=120&section=footer"/>

</div>