import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Register from './pages/Register'
import Screening from './pages/Screening'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorReview from './pages/DoctorReview'
import Referrals from './pages/Referrals'
import Analytics from './pages/Analytics'
import PatientHistory from './pages/PatientHistory'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/register" element={<Register />} />
      <Route path="/screening" element={<Screening />} />
      <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
      <Route path="/doctor-review/:id" element={<DoctorReview />} />
      <Route path="/referrals" element={<Referrals />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/history/:patientId" element={<PatientHistory />} />
      <Route path="/history" element={<Navigate to="/history/DRI-2026-00421" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
