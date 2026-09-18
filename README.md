<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=1a0000,8B0000,DC143C&height=200&section=header&text=DRISHTI-AI&fontSize=52&fontColor=ffffff&fontAlignY=38&desc=Explainable%20AI%20for%20Diabetic%20Retinopathy%20Screening%20in%20Rural%20India&descAlignY=60&descSize=16&animation=fadeIn"/>

</div>

<div align="center">

![SIH](https://img.shields.io/badge/SIH_2026-Grand_Finale-DC143C?style=for-the-badge)
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
- **NeonDB** (PostgreSQL serverless) — patient records, screenings, referrals
- **Groq LLM** — multilingual referral recommendations (Kannada, Hindi, Tamil, Telugu, Marathi, English)
- **Risk stratification engine** — scores Grade 0/1 patients using HbA1c, diabetes duration, hypertension, family history

### Frontend
- **React + Tailwind CSS** — doctor dashboard + health worker interface
- **PWA + Service Worker + IndexedDB** — offline-first, auto-sync when connection restored

### Deployment
- Backend → Render *(deployment in progress — 900MB ONNX model via Cloudflare R2)*
- Frontend → Vercel ✅ Live at [drishti-ai-ruddy.vercel.app](https://drishti-ai-ruddy.vercel.app)
- Model weights → HuggingFace Hub (`adnshkl/drishti-efficientnet-b4-dr`)

---

## Repository Structure
