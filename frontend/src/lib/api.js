// src/lib/api.js
// DRISHTI-AI — Unified API Service Layer
// Render (cloud) for all endpoints except classify + explain
// Local backend for classify + explain (PyTorch/Grad-CAM)

const RENDER_URL = 'https://drishti-ai-69kp.onrender.com'

// ⚠️ UPDATE THIS to your laptop's local IP before demo
// Run `ipconfig` → find IPv4 Address under your WiFi adapter
// Example: 'http://192.168.1.5:8000'
const LOCAL_URL = 'http://192.168.1.2:8000'

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function post(baseUrl, path, body, isFormData = false) {
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' }
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: isFormData ? body : JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`POST ${path} failed [${res.status}]: ${err}`)
  }
  return res.json()
}

async function get(baseUrl, path) {
  const res = await fetch(`${baseUrl}${path}`)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GET ${path} failed [${res.status}]: ${err}`)
  }
  return res.json()
}

// ─────────────────────────────────────────────
// ML ENDPOINTS — LOCAL (classify + explain)
// ─────────────────────────────────────────────

/**
 * POST /api/quality-check
 * @param {File} imageFile
 * @returns {{ quality_score, brightness, contrast, sharpness, passed, enhanced_image_path }}
 */
export async function qualityCheck(imageFile) {
  const form = new FormData()
  form.append('file', imageFile)
  return post(RENDER_URL, '/api/quality-check', form, true)
}

/**
 * POST /api/classify  — runs on LOCAL backend
 * @param {File} imageFile
 * @returns {{ grade, label, confidence, risk, action, all_probs }}
 */
export async function classify(imageFile) {
  const form = new FormData()
  form.append('file', imageFile)
  return post(LOCAL_URL, '/api/classify', form, true)
}

/**
 * POST /api/explain  — runs on LOCAL backend (Grad-CAM)
 * @param {File} imageFile
 * @param {number} grade  optional target grade
 * @returns {{ heatmap_url, target_grade, cam_intensity }}
 */
export async function explain(imageFile, grade = null) {
  const form = new FormData()
  form.append('file', imageFile)
  if (grade !== null) form.append('grade', grade)
  return post(LOCAL_URL, '/api/explain', form, true)
}

/**
 * POST /api/recommend
 * @param {{ dr_grade, dme_present, risk_stratification, language, patient_context }} payload
 * @returns {{ recommendation, language }}
 */
export async function recommend(payload) {
  return post(RENDER_URL, '/api/recommend', payload)
}

// ─────────────────────────────────────────────
// PATIENT ENDPOINTS
// ─────────────────────────────────────────────

/**
 * POST /api/patient
 * @param {{ name, age, gender, phc_id, diabetes_duration_years, hba1c_level,
 *           hypertension, family_history_dr, preferred_language }} payload
 * @returns {{ id, name, ... }}
 */
export async function createPatient(payload) {
  return post(RENDER_URL, '/api/patient', payload)
}

/**
 * GET /api/patient/:id
 * @param {string} patientId
 */
export async function getPatient(patientId) {
  return get(RENDER_URL, `/api/patient/${patientId}`)
}

/**
 * GET /api/patient/:id/risk
 * @param {string} patientId
 */
export async function getPatientRisk(patientId) {
  return get(RENDER_URL, `/api/patient/${patientId}/risk`)
}

/**
 * GET /api/patient/:id/history
 * @param {string} patientId
 */
export async function getPatientHistory(patientId) {
  return get(RENDER_URL, `/api/patient/${patientId}/history`)
}

// ─────────────────────────────────────────────
// SCREENING ENDPOINTS
// ─────────────────────────────────────────────

/**
 * POST /api/screening
 * @param {{ patient_id, dr_grade, dr_confidence, quality_score,
 *           heatmap_url, risk_stratification, referral_recommended,
 *           recommendation_text, recommendation_language }} payload
 */
export async function saveScreening(payload) {
  return post(RENDER_URL, '/api/screening', payload)
}

/**
 * GET /api/screenings/pending
 */
export async function getPendingScreenings() {
  return get(RENDER_URL, '/api/screenings/pending')
}

/**
 * GET /api/screenings/stats
 */
export async function getScreeningStats() {
  return get(RENDER_URL, '/api/screenings/stats')
}

// ─────────────────────────────────────────────
// REFERRAL ENDPOINTS
// ─────────────────────────────────────────────

/**
 * POST /api/referral
 * @param {{ screening_id, patient_id }} payload
 */
export async function createReferral(payload) {
  return post(RENDER_URL, '/api/referral', payload)
}

/**
 * PATCH /api/referral/:id
 * @param {string|number} referralId
 * @param {{ status, doctor_notes, ophthalmologist_grade }} payload
 */
export async function updateReferral(referralId, payload) {
  const res = await fetch(`${RENDER_URL}/api/referral/${referralId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PATCH /api/referral/${referralId} failed [${res.status}]: ${err}`)
  }
  return res.json()
}

/**
 * GET /api/referrals/pending
 */
export async function getPendingReferrals() {
  return get(RENDER_URL, '/api/referrals/pending')
}

/**
 * GET /api/referrals/stats
 */
export async function getReferralStats() {
  return get(RENDER_URL, '/api/referrals/stats')
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────

export async function healthCheck() {
  return get(RENDER_URL, '/health')
}

export async function localHealthCheck() {
  return get(LOCAL_URL, '/health')
}