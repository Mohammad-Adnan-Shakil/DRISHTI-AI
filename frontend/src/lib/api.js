// src/lib/api.js
// DRISHTI-AI — Unified API Service Layer
// All endpoints hit the backend at API_URL.

// Vite replaces VITE_API_URL at build time. Keep this fallback so a clone
// remains runnable without an environment file.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')

export function apiAssetUrl(path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('drishti.token')
  return token ? { Authorization: `Bearer ${token}`, ...extra } : { ...extra }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function post(baseUrl, path, body, isFormData = false, timeoutMs = null) {
  const headers = isFormData
    ? getAuthHeaders()
    : getAuthHeaders({ 'Content-Type': 'application/json' })
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
  const res = await fetch(`${baseUrl}${path}`, { headers: getAuthHeaders() })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GET ${path} failed [${res.status}]: ${err}`)
  }
  return res.json()
}

// ─────────────────────────────────────────────
// ML ENDPOINTS — LOCAL (classify + explain)
// ─────────────────────────────────────────────

export async function qualityCheck(imageFile) {
  const form = new FormData()
  form.append('file', imageFile)
  return post(API_URL, '/api/quality-check', form, true, 30000)
}

export async function classify(imageFile) {
  const form = new FormData()
  form.append('file', imageFile)
  return post(API_URL, '/api/classify', form, true)
}

export async function explain(imageFile, grade = null) {
  const form = new FormData()
  form.append('file', imageFile)
  if (grade !== null) form.append('grade', grade)
  return post(API_URL, '/api/explain', form, true)
}

export async function recommend(payload) {
  return post(API_URL, '/api/recommend', payload)
}

// ─────────────────────────────────────────────
// PATIENT ENDPOINTS
// ─────────────────────────────────────────────

export async function createPatient(payload) {
  return post(API_URL, '/api/patient', payload)
}

export async function getPatient(patientId) {
  return get(API_URL, `/api/patient/${patientId}`)
}

export async function getPatientRisk(patientId) {
  return get(API_URL, `/api/patient/${patientId}/risk`)
}

export async function getPatientHistory(patientId) {
  return get(API_URL, `/api/patient/${patientId}/history`)
}

// ─────────────────────────────────────────────
// SCREENING ENDPOINTS
// ─────────────────────────────────────────────

export async function saveScreening(payload) {
  return post(API_URL, '/api/screening', payload)
}

export async function getPendingScreenings() {
  return get(API_URL, '/api/screenings/pending')
}

export async function markPatientScreeningsReviewed(patientId) {
  const res = await fetch(`${API_URL}/api/patient/${patientId}/screenings/review`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PATCH /api/patient/${patientId}/screenings/review failed [${res.status}]: ${err}`)
  }
  return res.json()
}

export async function getReviewedScreenings() {
  return get(API_URL, '/api/screenings/reviewed')
}

export async function getScreeningStats() {
  return get(API_URL, '/api/screenings/stats')
}

// ─────────────────────────────────────────────
// REFERRAL ENDPOINTS
// ─────────────────────────────────────────────

export async function getPendingReferrals() {
  return get(API_URL, '/api/referrals/pending')
}

export async function createReferral(payload) {
  return post(API_URL, '/api/referral', payload)
}

export async function updateReferral(referralId, payload) {
  const res = await fetch(`${API_URL}/api/referral/${referralId}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PATCH /api/referral/${referralId} failed [${res.status}]: ${err}`)
  }
  return res.json()
}

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
