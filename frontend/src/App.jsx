import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Register from './pages/Register'
import Screening from './pages/Screening'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorReview from './pages/DoctorReview'
import Analytics from './pages/Analytics'
import ReferralBoard from './pages/ReferralBoard'
import PatientHistory from './pages/PatientHistory'
import { getRoleHome, getSession } from './lib/auth'

function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation()
  const session = getSession()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return <Navigate to={getRoleHome(session.role)} replace />
  }

  return children
}

function protectedElement(element, allowedRoles) {
  return <ProtectedRoute allowedRoles={allowedRoles}>{element}</ProtectedRoute>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={protectedElement(<Dashboard />)} />
      <Route path="/register" element={protectedElement(<Register />)} />
      <Route path="/screening" element={protectedElement(<Screening />)} />
      <Route path="/doctor-dashboard" element={protectedElement(<DoctorDashboard />)} />
      <Route path="/doctor-review/:id" element={protectedElement(<DoctorReview />)} />
      <Route path="/analytics" element={protectedElement(<Analytics />, ['Admin'])} />
      <Route path="/referrals" element={protectedElement(<ReferralBoard />, ['Admin'])} />
      <Route path="/history/:patientId" element={protectedElement(<PatientHistory />)} />
      <Route path="/history" element={protectedElement(<Navigate to="/history/DRI-2026-00421" replace />)} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
