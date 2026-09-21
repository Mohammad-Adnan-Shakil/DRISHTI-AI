const TOKEN_KEY = 'drishti.token'
const SESSION_KEY = 'drishti.session'

export const DEMO_ROLES = {
  HEALTH_WORKER: 'health_worker',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
}

export async function login(username, password) {
  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }),
  })
  if (!res.ok) throw new Error('Invalid credentials')
  const data = await res.json()
  localStorage.setItem(TOKEN_KEY, data.access_token)
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    isAuthenticated: true,
    role: data.role,
    name: data.name,
    phc_id: data.phc_id,
    username,
  }))
  return data
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getSession() {
  try {
    const value = localStorage.getItem(SESSION_KEY)
    if (!value) return null
    const session = JSON.parse(value)
    if (!session?.isAuthenticated || !session.role) return null
    return session
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
}

export function getRoleHome(role) {
  if (role === 'doctor') return '/doctor-dashboard'
  if (role === 'admin') return '/analytics'
  return '/dashboard'
}
