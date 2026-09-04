# DRISHTI-AI
### Explainable AI for Diabetic Retinopathy Screening in Rural India
**SIH 2026 | Problem Statement: SIH26038 | Organization: MathWorks**
**Theme: Clean & Green Technology**

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
| 6 | LLM generates referral recommendation in patient preferred language |
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
- **Training Data** — APTOS 2019 (3,662) + IDRiD (516, pixel-level masks) + Messidor-2 (1,748) + EyePACS subset — 5,900+ images total

### Backend
- **FastAPI** (Python) — REST API
- **NeonDB** (PostgreSQL serverless) — patient records, screenings, referrals
- **OpenRouter LLM** — multilingual referral recommendations (Kannada, Hindi, Tamil, Telugu, Marathi, English)
- **Risk stratification engine** — scores Grade 0/1 patients using HbA1c, diabetes duration, hypertension, family history

### Frontend
- **React + Tailwind CSS** — doctor dashboard + health worker interface
- **PWA + Service Worker + IndexedDB** — offline-first, auto-sync when connection restored

### Deployment
- Backend → Render
- Frontend → Vercel

---

## Repository Structure

DRISHTI-AI/
├── backend/ # FastAPI REST API
│ ├── app/
│ │ ├── api/ # Route handlers
│ │ ├── core/ # Config, DB connection
│ │ ├── models/ # SQLAlchemy models
│ │ └── services/ # ML, MATLAB, LLM, risk engine
│ └── main.py
├── ml/
│ ├── matlab/ # MATLAB scripts (CLAHE, quality, segmentation)
│ ├── simulink/ # Simulink pipeline model + Stateflow referral FSM
│ └── models/ # Trained model weights (.pth)
├── frontend/ # React PWA (doctor dashboard + health worker UI)
└── docs/ # Architecture diagrams, API spec


---

## Target Metrics

| Metric | Target |
|--------|--------|
| Sensitivity (Grade 2+) | 91-94% |
| Specificity | > 85% |
| Processing time | < 5 seconds/image |
| Report generation | < 30 seconds |
| Languages supported | 6 (Kannada, Hindi, Tamil, Telugu, Marathi, English) |

---

## Team

**Presidency University, Bengaluru — Batch 2024-2028**

| Role | Scope |
|------|-------|
| ML + Backend | EfficientNet, Grad-CAM, MATLAB, FastAPI, NeonDB, LLM, risk engine, PWA offline logic |
| Frontend | React PWA, doctor dashboard, health worker UI |