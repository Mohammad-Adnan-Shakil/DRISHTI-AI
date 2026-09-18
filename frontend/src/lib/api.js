// src/lib/api.js
// DRISHTI-AI — Unified API Service Layer
// All endpoints hit the backend at API_URL.

// Vite replaces VITE_API_URL at build time. Keep this fallback so a clone
// remains runnable without an environment file.
const API_URL = (import.meta.env.VITE_API_URL || 'https://drishti-ai-mj1b.onrender.com').replace(/\/+$/, '')

export function apiAssetUrl(path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function post(baseUrl, path, body, isFormData = false, timeoutMs = null) {
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' }
  const controller = timeoutMs ? new AbortController() : null
  const timeoutId = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null
  let res
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: isFormData ? body : JSON.stringify(body),
      signal: controller?.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`POST ${path} timed out after ${timeoutMs}ms`)
    throw err
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
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
 * 30s timeout — mobile networks can be slow, and this check is a
 * nice-to-have, not a gate: callers should treat a timeout the same as any
 * other failure and proceed to classify regardless.
 * @param {File} imageFile
 * @returns {{ quality_score, brightness, contrast, sharpness, passed, enhanced_image_path }}
 */
export async function qualityCheck(imageFile) {
  const form = new FormData()
  form.append('file', imageFile)
  return post(API_URL, '/api/quality-check', form, true, 30000)
}

/**
 * POST /api/classify  — runs on LOCAL backend
 * @param {File} imageFile
 * @returns {{ grade, label, confidence, risk, action, all_probs, fundus_image_url }}
 */
export async function classify(imageFile) {
  const form = new FormData()
  form.append('file', imageFile)
  return post(API_URL, '/api/classify', form, true)
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
  return post(API_URL, '/api/explain', form, true)
}

/**
 * POST /api/recommend
 * @param {{ dr_grade, dme_present, risk_stratification, language, patient_context }} payload
 * @returns {{ recommendation, language }}
 */
export async function recommend(payload) {
  return post(API_URL, '/api/recommend', payload)
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
  return post(API_URL, '/api/patient', payload)
}

/**
 * GET /api/patient/:id
 * @param {string} patientId
 */
export async function getPatient(patientId) {
  return get(API_URL, `/api/patient/${patientId}`)
}

/**
 * GET /api/patient/:id/risk
 * @param {string} patientId
 */
export async function getPatientRisk(patientId) {
  return get(API_URL, `/api/patient/${patientId}/risk`)
}

/**
 * GET /api/patient/:id/history
 * @param {string} patientId
 */
export async function getPatientHistory(patientId) {
  return get(API_URL, `/api/patient/${patientId}/history`)
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
  return post(API_URL, '/api/screening', payload)
}

/**
 * GET /api/screenings/pending
 */
export async function getPendingScreenings() {
  return get(API_URL, '/api/screenings/pending')
}

/**
 * PATCH /api/patient/:patientId/screenings/review
 * Marks all of a patient's pending (referral-recommended, unreviewed)
 * screenings as reviewed — called when a doctor confirms & submits their
 * review on the Doctor Review page. Removes the patient from the queue
 * returned by getPendingScreenings().
 * @param {string|number} patientId
 * @returns {{ patient_id, reviewed_count }}
 */
export async function markPatientScreeningsReviewed(patientId) {
  const res = await fetch(`${API_URL}/api/patient/${patientId}/screenings/review`, {
    method: 'PATCH',
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PATCH /api/patient/${patientId}/screenings/review failed [${res.status}]: ${err}`)
  }
  return res.json()
}

/**
 * GET /api/screenings/reviewed
 * Same response shape as getPendingScreenings(), filtered to screenings
 * the doctor has already reviewed (reviewed = true).
 */
export async function getReviewedScreenings() {
  return get(API_URL, '/api/screenings/reviewed')
}

/**
 * GET /api/screenings/stats
 */
export async function getScreeningStats() {
  return get(API_URL, '/api/screenings/stats')
}

// ─────────────────────────────────────────────
// REFERRAL ENDPOINTS
// ─────────────────────────────────────────────

/**
 * GET /api/referrals/pending
 * @returns {Array<{ referral_id, patient_id, patient_name, patient_age, screening_id, status, doctor_notes }>}
 */
export async function getPendingReferrals() {
  return get(API_URL, '/api/referrals/pending')
}

/**
 * POST /api/referral
 * @param {{ screening_id, patient_id }} payload
 */
export async function createReferral(payload) {
  return post(API_URL, '/api/referral', payload)
}

/**
 * PATCH /api/referral/:id
 * @param {number|string} referralId
 * @param {{ status: 'pending'|'sent'|'attended'|'no_show' }} payload
 */
export async function updateReferral(referralId, payload) {
  const res = await fetch(`${API_URL}/api/referral/${referralId}`, {
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
 * GET /api/referrals/stats
 */
export async function getReferralStats() {
  return get(API_URL, '/api/referrals/stats')
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────

export async function healthCheck() {
  return get(API_URL, '/health')
}

export async function localHealthCheck() {
  return get(API_URL, '/health')
}
