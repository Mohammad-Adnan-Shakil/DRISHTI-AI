# DRISHTI-AI 👁️
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
| 3 | EfficientNet-B4 classifies DR severity (Grade 0–4) |
| 4 | Grad-CAM generates heatmap showing WHERE retinal damage is |
| 5 | Groq LLM generates referral recommendation in plain language |
| 6 | Patient record saved, doctor notified, referral tracked |

---

## DR Severity Grading

| Grade | Diagnosis | Action |
|-------|-----------|--------|
| 0 | No DR | Monitor annually |
| 1 | Mild DR | Monitor every 6 months |
| 2 | Moderate DR | Refer within 3 months |
| 3 | Severe DR | Refer within 2 weeks |
| 4 | Proliferative DR | Urgent referral within 48 hours |

---

## Tech Stack

### ML & Signal Processing
- **EfficientNet-B4** (PyTorch + timm) — DR grading model
- **MATLAB Image Processing Toolbox** — CLAHE preprocessing, quality assessment, vessel segmentation
- **Simulink + Stateflow** — DR screening pipeline model, referral workflow state machine
- **Grad-CAM** — explainability heatmaps
- **Training Data** — APTOS 2019 + IDRiD dataset

### Backend
- **FastAPI** (Python) — REST API
- **NeonDB** (PostgreSQL serverless) — patient records, screenings, referrals
- **Groq LLM** — referral recommendation generation

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
│ │ └── services/ # ML, MATLAB, Groq integrations
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
| Sensitivity (Grade 2+) | > 90% |
| Specificity | > 85% |
| Processing time | < 5 seconds/image |
| Report generation | < 30 seconds |

---

## Team

**Presidency University, Bengaluru — Batch 2024–2028**

| Role | Scope |
|------|-------|
| ML + Backend | EfficientNet, Grad-CAM, MATLAB, FastAPI, NeonDB, Groq, PWA offline logic |
| Frontend | React PWA, doctor dashboard, health worker UI |



