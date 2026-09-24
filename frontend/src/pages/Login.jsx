import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ChevronDown, ArrowRight, Shield, Users, Stethoscope, BarChart3 } from 'lucide-react'
import { login, DEMO_ROLES, getRoleHome } from '../lib/auth'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)


  const handleLogin = async (e) => {
  e.preventDefault()
  setIsLoading(true)
  try {
    const data = await login(email, password)
    const requestedPath = location.state?.from
    navigate(requestedPath || getRoleHome(data.role), { replace: true })
  } catch (err) {
    alert('Invalid credentials. Please try again.')
  } finally {
    setIsLoading(false)
  }
}

  const handleDemoLogin = async (role) => {
  setIsLoading(true)
  const creds = {
    health_worker: { username: 'asha_worker', password: 'drishti123' },
    doctor: { username: 'dr_sharma', password: 'drishti123' },
    admin: { username: 'admin', password: 'drishti123' },
  }
  try {
    const data = await login(creds[role].username, creds[role].password)
    navigate(location.state?.from || getRoleHome(data.role), { replace: true })
  } catch (err) {
    alert('Demo login failed. Please try again.')
  } finally {
    setIsLoading(false)
  }
}

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#E6F4EA] via-[#F8FAF7] to-[#F8FAF7] relative overflow-hidden p-4 sm:p-6 text-[#20312A] selection:bg-[#E6F4EA] selection:text-[#047857]">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#16866A]/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 bg-[#D9F99D]/20 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Top Header — Language Selector */}
      <header className="absolute top-0 right-0 left-0 z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-end">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#047857] border border-[#047857]/20">
            <span className="w-2 h-2 rounded-full bg-[#047857] animate-pulse" />
            <span>Online</span>
          </div>

          <div className="relative">
            <select
              aria-label="Select Interface Language"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="text-xs bg-white border border-[#E2E7E3] text-[#20312A] py-1.5 pl-2.5 pr-7 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-[#16866A] shadow-xs appearance-none cursor-pointer"
            >
              <option value="en">English (EN)</option>
              <option value="kn">ಕನ್ನಡ (KN)</option>
              <option value="hi">हिन्दी (HI)</option>
              <option value="te">తెలుగు (TE)</option>
              <option value="ta">தமிழ் (TA)</option>
              <option value="mr">मराठी (MR)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#66756D] absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* Auth Card */}
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-[0_8px_30px_rgba(40,89,67,0.08)] border border-[#E2E7E3] z-10 my-8">
        {/* Unified Brand Lockup */}
        <div className="flex items-center justify-center mb-5">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#16866A] to-[#285943] text-white shadow-sm">
            <Eye size={18} strokeWidth={2.5} />
          </div>
          <span className="ml-2 text-xl font-extrabold tracking-tight text-[#20312A]">DRISHTI</span>
          <span className="bg-[#E6F4EA] text-[#047857] text-[10px] font-bold px-2 py-0.5 rounded-md ml-2">CLINICAL AI</span>
        </div>

        {/* Clean Typography */}
        <div className="text-center space-y-1 mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#20312A] font-heading">
            Welcome to DRISHTI
          </h1>
          <p className="text-sm text-[#66756D]">
            AI-Assisted Rural Tele-Ophthalmology Network
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#20312A] mb-1.5" htmlFor="login-email">
              Email Address / Facility ID
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-[#66756D] absolute left-3.5 pointer-events-none" strokeWidth={2} />
              <input
                id="login-email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kavya.n@phc-hosakote.gov.in"
                className="w-full bg-[#F8FAF7] border border-[#E2E7E3] text-[#20312A] focus:outline-none focus:ring-2 focus:ring-[#16866A] focus:border-[#16866A] rounded-xl px-10 py-3 text-sm placeholder:text-[#66756D]/50 font-medium transition-all"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#20312A]" htmlFor="login-password">
                Passcode
              </label>
              <button
                type="button"
                onClick={() => alert("Please contact your District Nodal Administrator (dno@karnataka.gov.in) to reset your clinical passcode.")}
                className="text-xs font-medium text-[#16866A] hover:text-[#285943] hover:underline cursor-pointer"
              >
                Forgot Passcode?
              </button>
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-[#66756D] absolute left-3.5 pointer-events-none" strokeWidth={2} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter passcode"
                className="w-full bg-[#F8FAF7] border border-[#E2E7E3] text-[#20312A] focus:outline-none focus:ring-2 focus:ring-[#16866A] focus:border-[#16866A] rounded-xl px-10 py-3 text-sm placeholder:text-[#66756D]/50 font-medium transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 w-8 h-8 flex items-center justify-center rounded-lg text-[#66756D] hover:text-[#20312A] hover:bg-[#E2E7E3]/40 cursor-pointer focus:outline-none transition-colors"
                title={showPassword ? 'Hide passcode' : 'Show passcode'}
                aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Luminous Gradient Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-[#D9F99D] via-[#DCFCE7] to-[#CCFBF1] text-[#14532D] font-bold rounded-xl py-3 w-full shadow-sm hover:brightness-105 transition-all mt-6 inline-flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#16866A] focus:ring-offset-2 text-sm sm:text-base"
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 text-[#14532D]" />
              </>
            )}
          </button>
        </form>

        {/* Security Trust Line */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#66756D] mt-4">
          <Shield className="w-3.5 h-3.5 text-[#047857]" />
          <span>Secured clinical data channel · HIPAA-aligned</span>
        </div>

        {/* Subtle Demo Login Section */}
        <div className="pt-6 mt-6 border-t border-[#E2E7E3] space-y-3">
          <p className="text-center text-xs font-medium text-[#66756D]">
            Demo Access (No credentials required)
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin(DEMO_ROLES.HEALTH_WORKER)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#E6F4EA] text-[#285943] text-sm font-semibold transition-colors border border-[#E2E7E3] cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#285943]" strokeWidth={2} />
              <span>Health Worker</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin(DEMO_ROLES.DOCTOR)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#E6F4EA] text-[#285943] text-sm font-semibold transition-colors border border-[#E2E7E3] cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-[#285943]" strokeWidth={2} />
              <span>Doctor</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin(DEMO_ROLES.ADMIN)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#E6F4EA] text-[#285943] text-sm font-semibold transition-colors border border-[#E2E7E3] cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-[#285943]" strokeWidth={2} />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trust/Social Proof Footer */}
      <p className="text-center text-[#66756D] text-sm mt-2 z-10">
        Trusted by 24+ Primary Health Centres across Karnataka
      </p>
    </div>
  )
}
