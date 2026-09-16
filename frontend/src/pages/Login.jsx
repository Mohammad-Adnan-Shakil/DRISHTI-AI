import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ChevronDown, ArrowRight, Shield, Users, Stethoscope, BarChart3 } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [language, setLanguage] = useState('en')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = (e) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      if (email.includes('doctor') || email.includes('dr.')) {
        navigate('/doctor-dashboard')
      } else if (email.includes('admin')) {
        navigate('/analytics')
      } else {
        navigate('/dashboard')
      }
    }, 350)
  }

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col relative overflow-hidden text-[#20312A] selection:bg-[#E6F4EA] selection:text-[#047857]">
      {/* Background: Stronger retina/eye motif watermark + diagonal mint→cream gradient wash */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Diagonal gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#E6F4EA]/30 via-[#F8FAF7] to-[#CCFBF1]/20" />
        {/* Retina ring motifs at 5% opacity */}
        <svg className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1440 900">
          <defs>
            <linearGradient id="login-retina-fade" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#285943" stopOpacity="0.08" />
              <stop offset="60%" stopColor="#16866A" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#F8FAF7" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Large retinal ring top-right */}
          <circle cx="1150" cy="150" r="380" stroke="url(#login-retina-fade)" strokeWidth="2" />
          <circle cx="1150" cy="150" r="500" stroke="url(#login-retina-fade)" strokeWidth="1.2" strokeDasharray="6 6" />
          <circle cx="1150" cy="150" r="260" stroke="url(#login-retina-fade)" strokeWidth="1.5" />
          {/* Smaller retinal ring bottom-left */}
          <circle cx="180" cy="760" r="250" stroke="url(#login-retina-fade)" strokeWidth="1.5" />
          <circle cx="180" cy="760" r="350" stroke="url(#login-retina-fade)" strokeWidth="1" strokeDasharray="4 4" />
          {/* Subtle optic disc glow center-right */}
          <circle cx="1150" cy="150" r="45" fill="#285943" opacity="0.03" />
          <circle cx="1150" cy="150" r="28" fill="#16866A" opacity="0.04" />
        </svg>
      </div>

      {/* Top Header — language selector only, no duplicate logo */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-end">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#047857] border border-[#047857]/20">
            <span className="w-2 h-2 rounded-full bg-[#047857] animate-pulse" />
            <span>Online</span>
          </div>

          <div className="relative">
            <select
              aria-label="Select interface language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
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

      {/* Main Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6">
          {/* Clean White Auth Card */}
          <div className="bg-[#FFFFFF] border border-[#E2E7E3] rounded-2xl shadow-[0_4px_24px_rgba(40,89,67,0.06)] p-6 sm:p-8 space-y-6">
            {/* Brand Lockup — single, inside card */}
            <div className="text-center space-y-3">
              <div className="inline-flex w-14 h-14 rounded-full p-3 bg-gradient-to-br from-[#E6F4EA] to-[#CCFBF1] items-center justify-center text-[#047857] shadow-xs mb-1">
                <Eye className="w-7 h-7" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[#20312A] font-heading">DRISHTI</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#047857] border border-[#047857]/20">
                  Clinical AI
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#20312A] font-heading">
                Log in to your account
              </h1>
              <p className="text-sm text-[#66756D] font-medium">
                Better Vision. Better Tomorrow.
              </p>
              <p className="text-xs text-[#66756D]/80">
                AI-assisted screening across 24 PHCs · Rural Tele-Ophthalmology Network
              </p>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleLogin} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#20312A] mb-1.5" htmlFor="login-email">
                  Email Address / Facility ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#66756D] absolute left-3.5 top-3.5 pointer-events-none" strokeWidth={2} />
                  <input
                    id="login-email"
                    type="text"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kavya.n@phc-hosakote.gov.in"
                    className="w-full pl-10 pr-4 py-3 text-sm border border-[#E2E7E3] rounded-xl bg-white text-[#20312A] focus:outline-none focus:ring-2 focus:ring-[#16866A] focus:border-[#16866A] placeholder:text-[#66756D]/50 font-medium transition-all"
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
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#66756D] absolute left-3.5 top-3.5 pointer-events-none" strokeWidth={2} />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter passcode"
                    className="w-full pl-10 pr-12 py-3 text-sm border border-[#E2E7E3] rounded-xl bg-white text-[#20312A] focus:outline-none focus:ring-2 focus:ring-[#16866A] focus:border-[#16866A] placeholder:text-[#66756D]/50 font-medium transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1.5 top-1.5 w-9 h-9 flex items-center justify-center rounded-lg text-[#66756D] hover:text-[#20312A] hover:bg-[#F8FAF7] cursor-pointer focus:outline-none transition-colors"
                    title={showPassword ? 'Hide passcode' : 'Show passcode'}
                    aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Full Width Primary CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-gradient-to-r from-[#D9F99D] via-[#DCFCE7] to-[#CCFBF1] text-[#14532D] font-bold border border-[#A7F3D0] shadow-xs hover:brightness-105 hover:shadow-md transition-all active:scale-[0.99] inline-flex items-center justify-center gap-2 cursor-pointer mt-2 focus:outline-none focus:ring-2 focus:ring-[#16866A] focus:ring-offset-2 text-sm sm:text-base"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 text-[#14532D]" />
                  </>
                )}
              </button>
            </form>

            {/* Security Trust Line */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#66756D]">
              <Shield className="w-3.5 h-3.5 text-[#047857]" />
              <span>Secured clinical data channel · HIPAA-aligned infrastructure</span>
            </div>
          </div>

          {/* Demo Access Section — clearly separated card */}
          <div className="bg-[#FFFFFF] border border-[#E2E7E3] rounded-2xl shadow-[0_2px_12px_rgba(40,89,67,0.04)] p-5 space-y-3.5">
            <div className="text-center">
              <h2 className="text-sm font-bold text-[#20312A] font-heading">Demo Access</h2>
              <p className="text-xs text-[#66756D] mt-0.5">Quick access for evaluation — no credentials required</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="min-h-[44px] flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl bg-[#F8FAF7] border border-[#E2E7E3] text-[#285943] hover:bg-[#E6F4EA] hover:border-[#A7F3D0] hover:shadow-xs transition-all cursor-pointer group"
              >
                <Users className="w-5 h-5 text-[#285943] group-hover:text-[#047857] transition-colors" strokeWidth={2} />
                <span className="text-xs font-bold leading-tight text-center">Health Worker</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/doctor-dashboard')}
                className="min-h-[44px] flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl bg-[#F8FAF7] border border-[#E2E7E3] text-[#285943] hover:bg-[#E6F4EA] hover:border-[#A7F3D0] hover:shadow-xs transition-all cursor-pointer group"
              >
                <Stethoscope className="w-5 h-5 text-[#285943] group-hover:text-[#047857] transition-colors" strokeWidth={2} />
                <span className="text-xs font-bold leading-tight text-center">Doctor</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/analytics')}
                className="min-h-[44px] flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl bg-[#F8FAF7] border border-[#E2E7E3] text-[#285943] hover:bg-[#E6F4EA] hover:border-[#A7F3D0] hover:shadow-xs transition-all cursor-pointer group"
              >
                <BarChart3 className="w-5 h-5 text-[#285943] group-hover:text-[#047857] transition-colors" strokeWidth={2} />
                <span className="text-xs font-bold leading-tight text-center">Admin</span>
              </button>
            </div>
          </div>

          {/* Minimal Footer */}
          <p className="text-center text-[11px] text-[#66756D]">
            DRISHTI Tele-Ophthalmology Network · MoHFW Rural AI Initiative
          </p>
        </div>
      </main>
    </div>
  )
}
