import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Check,
  FileText,
  AlertCircle,
  Save,
  Zap,
  CheckCircle2
} from 'lucide-react'
import DoctorNavbar from '../components/DoctorNavbar'
import GradeBadge from '../components/GradeBadge'
import { handleZoomIn, handleZoomOut, handleZoomReset } from '../lib/zoomHandlers'
import { markPatientScreeningsReviewed } from '../lib/api'

export default function DoctorReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const patientId = id || 'DRI-2026-00419'

  // Retinal Image Analysis state
  const [activeLayer, setActiveLayer] = useState('original') // 'original', 'gradcam', 'vessel'
  const [zoomLevel, setZoomLevel] = useState(1.0)

  // Clinical Decision State Machine
  const [isAiAgreed, setIsAiAgreed] = useState(true)
  const [doctorGrade, setDoctorGrade] = useState('grade-4')
  const [overrideAssessment, setOverrideAssessment] = useState('')
  const [overrideError, setOverrideError] = useState('')
  const [careInstructions, setCareInstructions] = useState(
    'Preretinal hemorrhages confirmed in superior quadrant. Urgent vitreoretinal specialist evaluation required. Contact patient for immediate transport.'
  )
  const [referralPlan, setReferralPlan] = useState('urgent-referral')
  const [smsAlert, setSmsAlert] = useState(true)
  const [workerAlert, setWorkerAlert] = useState(true)

  // Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraftSaved, setIsDraftSaved] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // Zoom handlers (using shared utility)
  const zoomIn = () => handleZoomIn(setZoomLevel)
  const zoomOut = () => handleZoomOut(setZoomLevel)
  const zoomReset = () => handleZoomReset(setZoomLevel)

  // Quick chips insertion for override rationale
  const handleInsertChip = (chipText) => {
    setOverrideAssessment(prev => (prev ? `${prev} ${chipText}` : chipText))
    if (overrideError) setOverrideError('')
  }

  // Handle AI Agreement toggle
  const handleAiAgreementChange = (e) => {
    const checked = e.target.checked
    setIsAiAgreed(checked)
    if (checked) {
      setDoctorGrade('grade-4')
      setOverrideError('')
    } else {
      // Switched to override
      setOverrideError('')
    }
  }

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return // already submitting — ignore repeat clicks

    // Validation: if disagreeing/overriding AI, clinical assessment rationale is required
    if (!isAiAgreed && !overrideAssessment.trim()) {
      setOverrideError("Doctor's clinical assessment rationale is required when overriding AI.")
      return
    }

    setOverrideError('')
    setIsSubmitting(true)

    const toast = isAiAgreed
      ? 'Review confirmed · Doctor concurred with AI'
      : 'Review confirmed · Doctor clinical assessment recorded'

    try {
      // patientId is numeric only for real, API-backed patients (route param
      // from a queue built off getPendingScreenings()) — demo/mock patient
      // IDs like 'DRI-2026-00419' have nothing to mark reviewed server-side.
      if (/^\d+$/.test(patientId)) {
        await markPatientScreeningsReviewed(patientId)
      }
    } catch (err) {
      console.error('Failed to mark screening(s) reviewed:', err)
    } finally {
      setIsSubmitting(false)
      setToastMessage(toast)
      setTimeout(() => {
        navigate('/doctor-dashboard')
      }, 1200)
    }
  }

  const handleSaveDraft = () => {
    setIsDraftSaved(true)
    setTimeout(() => setIsDraftSaved(false), 2000)
  }

  // Helper text for current layer
  const getLayerCaption = () => {
    switch (activeLayer) {
      case 'gradcam':
        return 'Grad-CAM Heatmap: High-intensity neural activation (red/amber) localized to superior temporal retinal arcades.'
      case 'vessel':
        return 'Vessel Map: Digital vessel skeleton highlighting tortuosity and microvascular caliber alterations.'
      default:
        return 'Displaying standard calibrated 45° macular-centered non-mydriatic digital fundus photograph.'
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A] antialiased selection:bg-[#E6F4EA] selection:text-[#047857] pb-12 relative">
      <DoctorNavbar />

      {/* SUCCESS TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#064E3B] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#059669] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <CheckCircle2 className="w-5 h-5 text-[#A7F3D0]" />
          <span className="text-sm font-bold tracking-tight">{toastMessage}</span>
        </div>
      )}

      {/* 1. BACK NAVIGATION BAR */}
      <div className="bg-white border-b border-[#E2E7E3] sticky top-16 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between flex-wrap gap-2">
          {/* Back button & Breadcrumb */}
          <div className="flex items-center space-x-3">
            <Link
              to="/doctor-dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#285943] hover:text-[#16866A] hover:bg-[#E6F4EA]/60 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Review Queue</span>
            </Link>
            <div className="flex items-center text-xs text-[#66756D] font-medium">
              <span className="text-slate-300 mx-1.5">/</span>
              <div className="text-slate-900 font-semibold">
                Review Queue
              </div>
              <span className="text-slate-300 mx-1.5">/</span>
              <span className="text-[#20312A] font-semibold">{patientId}</span>
            </div>
          </div>

          <div className="text-xs text-[#66756D] font-medium hidden sm:block">
            Doctor Clinical Workspace · Tele-Retina Hub
          </div>
        </div>
      </div>

      {/* 2. FULL-WIDTH TRIAGE STRIP */}
      <div className="w-full bg-[#B91C1C] text-white font-bold tracking-wide px-4 py-2.5 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <span className="text-xs sm:text-sm font-bold tracking-wide text-white">
              Triage Status: Critical Review (Grade 4)
            </span>
          </div>
          <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30 backdrop-blur-xs">
            Review SLA: 24h · Priority 1
          </span>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 3. PATIENT CONTEXT HEADER (De-boxed, airy layout on page background) */}
        <section className="border-b border-[#E2E7E3] pb-4 pt-1">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left Demographics */}
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#E6F4EA] text-[#14532D] border border-[#A7F3D0] flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-xs">
                RT
              </div>
              <div>
                <div className="flex items-center flex-wrap gap-2">
                  <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#20312A] tracking-tight">
                    Ravi T.
                  </h1>
                  <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-white text-[#20312A] border border-[#E2E7E3] rounded-md shadow-2xs">
                    {patientId}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-bold bg-[#450A0A] text-red-200 rounded-md border border-red-800">
                    Critical Urgency
                  </span>
                </div>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-[#66756D] font-medium mt-1">
                  <span><strong>Demographics:</strong> 58 yrs, Male</span>
                  <span className="text-slate-300">•</span>
                  <span><strong>PHC Unit:</strong> PHC Chelur</span>
                  <span className="text-slate-300">•</span>
                  <span><strong>Referred By:</strong> Health Worker Kavya N.</span>
                </div>
              </div>
            </div>

            {/* Right Clinical Vitals (Airy stats with clean dividers) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-center gap-4 lg:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E2E7E3]/60">
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-[#66756D] tracking-wider">Diabetes Duration</div>
                <div className="text-xs font-bold text-[#20312A] mt-0.5">12 Years</div>
              </div>
              <div className="hidden lg:block h-7 w-px bg-[#E2E7E3]" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Latest HbA1c</div>
                <div className="text-xs font-bold text-[#20312A] mt-0.5 flex items-center gap-1">
                  <span className="text-rose-700 font-extrabold">8.4%</span>
                  <span className="text-[10px] font-semibold text-rose-600">(Uncontrolled)</span>
                </div>
              </div>
              <div className="hidden lg:block h-7 w-px bg-[#E2E7E3]" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-[#66756D] tracking-wider">Hypertension</div>
                <div className="text-xs font-bold text-rose-600 mt-0.5">Yes</div>
              </div>
              <div className="hidden lg:block h-7 w-px bg-[#E2E7E3]" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-[#047857] tracking-wider">Eye</div>
                <div className="text-xs font-bold text-[#14532D] mt-0.5">OD (Right Eye)</div>
              </div>
              <div className="hidden lg:block h-7 w-px bg-[#E2E7E3]" />
              <div className="text-left col-span-2 sm:col-span-1">
                <div className="text-[10px] uppercase font-bold text-[#66756D] tracking-wider">Captured</div>
                <div className="text-xs font-bold text-[#20312A] mt-0.5">Today, 7:55 AM</div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. TWO-COLUMN WORKSPACE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: AI & VISUAL INSPECTION (~60%, 7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Retinal Image Analysis Card */}
            <div className="bg-white rounded-2xl border border-[#E2E7E3] p-5 sm:p-6 shadow-[0_2px_12px_rgba(40,89,67,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#20312A] font-heading">
                      Retinal Image Analysis
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#E6F4EA] text-[#047857] border border-[#A7F3D0]">
                      OD (Right Eye)
                    </span>
                  </div>
                  <p className="text-xs text-[#66756D] mt-0.5">
                    Field: 45° Macula-Centered · Mode: Non-Mydriatic Digital Fundus
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>91% · Good Quality</span>
                </div>
              </div>

              {/* Layer Toggles (Segmented Controls) */}
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-[#F1F5F9] p-1 rounded-lg inline-flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveLayer('original')}
                    className={`px-3.5 py-1.5 rounded-md text-xs transition-all cursor-pointer font-medium ${
                      activeLayer === 'original'
                        ? 'bg-white shadow-sm rounded-md text-[#20312A] font-semibold'
                        : 'text-[#66756D] hover:text-[#20312A]'
                    }`}
                  >
                    Original Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLayer('gradcam')}
                    className={`px-3.5 py-1.5 rounded-md text-xs transition-all cursor-pointer font-medium ${
                      activeLayer === 'gradcam'
                        ? 'bg-white shadow-sm rounded-md text-[#20312A] font-semibold'
                        : 'text-[#66756D] hover:text-[#20312A]'
                    }`}
                  >
                    Grad-CAM Attention
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLayer('vessel')}
                    className={`px-3.5 py-1.5 rounded-md text-xs transition-all cursor-pointer font-medium ${
                      activeLayer === 'vessel'
                        ? 'bg-white shadow-sm rounded-md text-[#20312A] font-semibold'
                        : 'text-[#66756D] hover:text-[#20312A]'
                    }`}
                  >
                    Vessel Segmentation
                  </button>
                </div>
              </div>

              {/* Retinal Canvas Viewport */}
              <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center select-none group">
                <div
                  className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <svg className="w-full h-full max-h-[440px]" viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient cx="50%" cy="50%" id="docRevFundusBg" r="50%">
                        <stop offset="0%" stopColor="#c2410c" />
                        <stop offset="45%" stopColor="#9a3412" />
                        <stop offset="75%" stopColor="#7c2d12" />
                        <stop offset="95%" stopColor="#431407" />
                        <stop offset="100%" stopColor="#180703" />
                      </radialGradient>
                      <radialGradient cx="50%" cy="50%" id="docRevOpticDisc" r="50%">
                        <stop offset="0%" stopColor="#fed7aa" />
                        <stop offset="70%" stopColor="#fdba74" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </radialGradient>
                      <radialGradient cx="50%" cy="50%" id="docRevMacula" r="50%">
                        <stop offset="0%" stopColor="#451a03" stopOpacity="0.9" />
                        <stop offset="70%" stopColor="#78350f" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#9a3412" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient cx="58%" cy="34%" id="docGradCamHeat" r="42%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.88" />
                        <stop offset="35%" stopColor="#f97316" stopOpacity="0.72" />
                        <stop offset="65%" stopColor="#eab308" stopOpacity="0.45" />
                        <stop offset="85%" stopColor="#22c55e" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </radialGradient>
                      <filter id="docBlurHeat">
                        <feGaussianBlur stdDeviation="14" />
                      </filter>
                    </defs>
                    <rect fill="#070a13" height="450" width="600" />
                    <circle cx="300" cy="225" fill="url(#docRevFundusBg)" r="210" />
                    <circle cx="210" cy="225" fill="url(#docRevOpticDisc)" opacity="0.95" r="32" />
                    <ellipse cx="210" cy="225" fill="#ffedd5" opacity="0.8" rx="16" ry="18" />
                    <circle cx="375" cy="230" fill="url(#docRevMacula)" r="42" />
                    <circle cx="375" cy="230" fill="#290f03" opacity="0.85" r="7" />

                    {/* Retinal vessels */}
                    <g fill="none" opacity="0.85" stroke="#5b1406" strokeLinecap="round">
                      <path d="M210 210 Q 230 160 290 120 T 400 95" strokeWidth="4.5" />
                      <path d="M210 240 Q 235 300 300 330 T 410 355" strokeWidth="4.2" />
                      <path d="M210 215 Q 180 165 140 135 T 100 125" strokeWidth="3.8" />
                      <path d="M210 235 Q 175 285 135 315 T 95 325" strokeWidth="3.5" />
                      <path d="M290 120 Q 330 110 365 80" strokeWidth="2.5" />
                      <path d="M330 112 Q 380 140 430 125" strokeWidth="2" />
                      <path d="M300 330 Q 350 340 385 375" strokeWidth="2.5" />
                      <path d="M340 335 Q 390 310 435 320" strokeWidth="2" />
                    </g>
                    <g fill="none" opacity="0.9" stroke="#7f1d1d" strokeLinecap="round">
                      <path d="M208 212 Q 228 162 288 122 T 398 97" strokeWidth="2.6" />
                      <path d="M208 238 Q 233 298 298 328 T 408 353" strokeWidth="2.4" />
                      <path d="M320 118 Q 360 130 405 115" strokeWidth="1.4" />
                      <path d="M335 328 Q 375 315 415 322" strokeWidth="1.4" />
                    </g>

                    {/* Proliferative Neovascularization & Hemorrhages */}
                    <g fill="#450a0a" opacity="0.8">
                      <circle cx="350" cy="145" r="5" />
                      <circle cx="362" cy="152" r="4" />
                      <circle cx="335" cy="135" r="3.5" />
                      <circle cx="420" cy="140" r="6" />
                      <circle cx="435" cy="150" r="4.5" />
                      <ellipse cx="390" cy="170" rx="11" ry="5" transform="rotate(-18 390 170)" />
                      <ellipse cx="325" cy="168" rx="8" ry="4" transform="rotate(24 325 168)" />
                      <circle cx="285" cy="180" r="2.5" />
                      <circle cx="270" cy="165" r="2" />
                      <circle cx="445" cy="195" r="3.5" />
                      <circle cx="460" cy="175" r="4" />
                      <circle cx="380" cy="290" r="3" />
                      <circle cx="395" cy="305" r="4.5" />
                    </g>

                    {/* Vessel Segmentation Layer */}
                    {activeLayer === 'vessel' && (
                      <g fill="none" opacity="0.95" stroke="#06b6d4" strokeLinecap="round">
                        <path d="M210 210 Q 230 160 290 120 T 400 95" strokeWidth="4" />
                        <path d="M210 240 Q 235 300 300 330 T 410 355" strokeWidth="3.8" />
                        <path d="M210 215 Q 180 165 140 135 T 100 125" strokeWidth="3.5" />
                        <path d="M210 235 Q 175 285 135 315 T 95 325" strokeWidth="3.2" />
                        <path d="M290 120 Q 330 110 365 80" strokeWidth="2.2" />
                        <path d="M330 112 Q 380 140 430 125" strokeWidth="1.8" />
                        <path d="M300 330 Q 350 340 385 375" strokeWidth="2.2" />
                        <path d="M340 335 Q 390 310 435 320" strokeWidth="1.8" />
                        <path d="M250 145 Q 265 125 280 115" strokeWidth="1.2" />
                        <path d="M350 100 Q 375 88 410 82" strokeWidth="1.2" />
                        <path d="M270 315 Q 290 335 315 348" strokeWidth="1.2" />
                        <path d="M365 345 Q 395 365 425 370" strokeWidth="1.2" />
                        <path d="M355 140 Q 370 148 390 152" strokeDasharray="2 2" strokeWidth="1" />
                        <path d="M410 135 Q 425 142 445 148" strokeDasharray="2 2" strokeWidth="1" />
                      </g>
                    )}

                    {/* Grad-CAM Heatmap Layer */}
                    {activeLayer === 'gradcam' && (
                      <g>
                        <circle cx="380" cy="150" fill="url(#docGradCamHeat)" filter="url(#docBlurHeat)" mixBlendMode="screen" r="130" />
                        <circle cx="380" cy="150" fill="#ef4444" filter="url(#docBlurHeat)" opacity="0.35" r="65" />
                        <rect fill="none" height="75" opacity="0.8" rx="8" stroke="#fef08a" strokeDasharray="4 3" strokeWidth="1.5" width="135" x="310" y="110" />
                        <text fill="#fef08a" fontFamily="monospace" fontSize="11" fontWeight="bold" x="314" y="104">
                          High Activation · Superior Temporal
                        </text>
                      </g>
                    )}
                  </svg>
                </div>

                {/* ZOOM CONTROLS */}
                <div className="absolute bottom-3 right-3 flex items-center bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 rounded-xl p-1 text-white text-xs shadow-md gap-1">
                  <button
                    type="button"
                    onClick={zoomIn}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-700 transition font-bold text-sm cursor-pointer"
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={zoomOut}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-700 transition font-bold text-sm cursor-pointer"
                    title="Zoom Out"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={zoomReset}
                    className="px-2 h-7 flex items-center justify-center rounded-lg hover:bg-slate-700 transition text-[11px] font-medium cursor-pointer"
                    title="Reset Zoom"
                  >
                    Reset
                  </button>
                </div>

                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-300 border border-slate-700/60">
                  Zoom: {Math.round(zoomLevel * 100)}%
                </div>
              </div>

              {/* HELPER CAPTION */}
              <div className="mt-3 p-3 bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-[#16866A] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#20312A] leading-relaxed font-medium">
                  {getLayerCaption()}
                </p>
              </div>
            </div>

            {/* AI Screening Result Card */}
            <div className="bg-white rounded-2xl border border-[#E2E7E3] p-5 sm:p-6 shadow-[0_2px_12px_rgba(40,89,67,0.04)] space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#285943]" />
                  <h3 className="text-sm font-bold text-[#20312A] tracking-tight font-heading">
                    AI Screening Result
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E6F4EA] text-[#047857] border border-[#A7F3D0]">
                    AI output · read-only
                  </span>
                </div>
                <span className="text-[11px] font-medium text-[#66756D] font-mono">
                  Drishti-Engine v2.4
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Predicted Grade with GradeBadge */}
                <div className="p-3.5 bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-[#66756D] tracking-wider mb-2">Predicted Grade</div>
                  <div>
                    <GradeBadge grade={4} />
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="p-3.5 bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#66756D] tracking-wider">
                    <span>Confidence</span>
                    <span className="text-xs font-bold text-[#20312A] font-mono">91%</span>
                  </div>
                  <div className="w-full bg-[#E2E7E3] rounded-full h-2 mt-2.5 overflow-hidden">
                    <div className="bg-[#285943] h-2 rounded-full transition-all" style={{ width: '91%' }} />
                  </div>
                </div>

                {/* Risk Level */}
                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Risk Level</div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-rose-900">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                    <span>CRITICAL</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl">
                <p className="text-xs text-[#20312A] leading-relaxed font-medium">
                  Model attention concentrated on regions suggestive of neovascularization and preretinal hemorrhage patterns in the superior temporal area.
                </p>
              </div>

              <div className="flex items-start gap-2 pt-1 text-[#66756D] text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="leading-normal font-normal">
                  Grad-CAM shows regions contributing to the model prediction. This is AI attention, not definitive clinical evidence. Final assessment is by the doctor.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CLINICAL DECISION (~40%, 5 cols, sticky on desktop) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-[#E2E7E3] p-5 sm:p-6 shadow-[0_2px_12px_rgba(40,89,67,0.04)]">
              <div className="flex items-center space-x-3 pb-4 border-b border-[#E2E7E3]">
                <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] border border-[#A7F3D0] flex items-center justify-center text-[#047857] flex-shrink-0 shadow-2xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#20312A] tracking-tight font-heading">
                    Clinical Assessment & Decision
                  </h3>
                  <p className="text-xs text-[#66756D] mt-0.5">
                    Review AI screening, confirm clinical diagnosis, and issue referral order.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                {/* 1. COMPACT AI AGREEMENT ROW */}
                <div className="p-3.5 bg-gradient-to-r from-[#D9F99D]/20 via-[#DCFCE7]/30 to-[#CCFBF1]/20 border border-[#A7F3D0] rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                  <label className="flex items-start sm:items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAiAgreed}
                      onChange={handleAiAgreementChange}
                      className="mt-0.5 sm:mt-0 w-4.5 h-4.5 rounded text-[#16866A] accent-[#16866A] focus:ring-2 focus:ring-[#16866A] border-[#A7F3D0] cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#20312A]">
                        AI screening result is clinically correct
                      </div>
                      <div className="text-[11px] text-[#66756D] font-medium mt-0.5">
                        AI Grade 4 · Proliferative DR
                      </div>
                    </div>
                  </label>

                  {/* Right-aligned chip */}
                  <div className="shrink-0">
                    {isAiAgreed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                        <Check className="w-3 h-3 text-teal-600" />
                        <span>AI Accepted</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <Zap className="w-3 h-3 text-amber-600" />
                        <span>Clinical Override</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. DOCTOR ASSESSMENT STATE MACHINE */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#20312A] uppercase tracking-wider" htmlFor="doctorGradeSelect">
                      Doctor-confirmed DR Grade <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[11px] text-[#66756D] font-mono">
                      AI Baseline: Grade 4
                    </span>
                  </div>

                  <select
                    id="doctorGradeSelect"
                    value={doctorGrade}
                    disabled={isAiAgreed}
                    onChange={(e) => setDoctorGrade(e.target.value)}
                    className={`w-full text-xs font-semibold text-[#20312A] rounded-xl px-3.5 py-2.5 border transition-all cursor-pointer ${
                      isAiAgreed
                        ? 'bg-[#F8FAF7] border-[#E2E7E3] text-[#20312A] opacity-90 cursor-not-allowed'
                        : 'bg-white border-[#16866A] ring-1 ring-[#16866A] shadow-xs'
                    }`}
                  >
                    <option value="grade-0">Grade 0 · No DR</option>
                    <option value="grade-1">Grade 1 · Mild NPDR</option>
                    <option value="grade-2">Grade 2 · Moderate NPDR</option>
                    <option value="grade-3">Grade 3 · Severe NPDR</option>
                    <option value="grade-4">Grade 4 · Proliferative DR</option>
                  </select>

                  <div className="flex items-center gap-2 pt-1">
                    {isAiAgreed ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#047857] border border-[#A7F3D0]">
                        <Check className="w-3.5 h-3.5 text-[#047857]" />
                        <span>Confirms AI Prediction</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Doctor Override: Grade adjusted</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. REVEALED TEXTAREA IF UNCHECKED (OVERRIDE) */}
                {!isAiAgreed && (
                  <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-[#20312A] uppercase tracking-wider flex items-center justify-between" htmlFor="overrideAssessment">
                      <span>Doctor's clinical assessment <span className="text-rose-600">*</span></span>
                      <span className="text-[11px] text-rose-600 font-medium">Required for override</span>
                    </label>
                    <textarea
                      id="overrideAssessment"
                      rows={3}
                      value={overrideAssessment}
                      onChange={(e) => {
                        setOverrideAssessment(e.target.value)
                        if (overrideError) setOverrideError('')
                      }}
                      placeholder="Document why the AI screening result differs from your clinical assessment..."
                      className={`w-full text-xs text-[#20312A] bg-white rounded-xl p-3 leading-relaxed shadow-xs focus:border-[#16866A] focus:ring-1 focus:ring-[#16866A] transition-colors placeholder:text-slate-400 font-normal border ${
                        overrideError ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-[#E2E7E3]'
                      }`}
                    />
                    {overrideError && (
                      <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{overrideError}</span>
                      </p>
                    )}

                    {/* Quick Disagreement Reason Chips */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-[#66756D] block">
                        Click reason chip to insert:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Image quality limits AI reliability',
                          'Lesion pattern not consistent with AI grade',
                          'Media opacity / artifact confounded model',
                          'Clinical exam findings differ from model attention'
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => handleInsertChip(`+ ${chip}.`)}
                            className="text-[11px] font-medium bg-[#F8FAF7] hover:bg-[#E6F4EA] text-[#20312A] px-2.5 py-1 rounded-lg border border-[#E2E7E3] transition cursor-pointer"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. REFERRAL & ACTION PLAN */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#20312A] uppercase tracking-wider">
                      Referral & Action Plan <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[11px] text-[#66756D] font-medium">Suggested by Grade 4</span>
                  </div>

                  <div className="space-y-3">
                    {/* Option 1: Confirm Urgent Referral */}
                    <label
                      onClick={() => setReferralPlan('urgent-referral')}
                      className={`rounded-xl p-4 cursor-pointer flex gap-3 transition-all ${
                        referralPlan === 'urgent-referral'
                          ? 'border-2 border-[#16866A] bg-[#F0FDF4] shadow-xs'
                          : 'border border-[#E2E7E3] bg-white hover:border-[#16866A]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="referralPlan"
                        value="urgent-referral"
                        checked={referralPlan === 'urgent-referral'}
                        onChange={() => setReferralPlan('urgent-referral')}
                        className="mt-0.5 h-4 w-4 text-[#16866A] accent-[#16866A] border-slate-300 focus:ring-[#16866A] cursor-pointer shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#20312A]">
                            Confirm Urgent Referral (District Eye Hospital)
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B91C1C] text-white shadow-2xs">
                            Critical · 24–48 Hours
                          </span>
                        </div>
                        <p className="text-xs text-[#66756D] mt-1 leading-normal font-medium">
                          Direct referral notification dispatched to District Vitreoretinal Unit.
                        </p>
                      </div>
                    </label>

                    {/* Option 2: Schedule Tele-Ophthalmology */}
                    <label
                      onClick={() => setReferralPlan('tele-consult')}
                      className={`rounded-xl p-4 cursor-pointer flex gap-3 transition-all ${
                        referralPlan === 'tele-consult'
                          ? 'border-2 border-[#16866A] bg-[#F0FDF4] shadow-xs'
                          : 'border border-[#E2E7E3] bg-white hover:border-[#16866A]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="referralPlan"
                        value="tele-consult"
                        checked={referralPlan === 'tele-consult'}
                        onChange={() => setReferralPlan('tele-consult')}
                        className="mt-0.5 h-4 w-4 text-[#16866A] accent-[#16866A] border-slate-300 focus:ring-[#16866A] cursor-pointer shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#20312A]">
                            Schedule Tele-Ophthalmology Consult
                          </span>
                          <span className="text-[11px] font-mono text-[#66756D] font-medium bg-slate-100 px-2 py-0.5 rounded">
                            Within 7 Days
                          </span>
                        </div>
                        <p className="text-xs text-[#66756D] mt-1 leading-normal font-medium">
                          Second-opinion remote session with senior retina consultant.
                        </p>
                      </div>
                    </label>

                    {/* Option 3: Routine PHC Follow-up */}
                    <label
                      onClick={() => setReferralPlan('routine-phc')}
                      className={`rounded-xl p-4 cursor-pointer flex gap-3 transition-all ${
                        referralPlan === 'routine-phc'
                          ? 'border-2 border-[#16866A] bg-[#F0FDF4] shadow-xs'
                          : 'border border-[#E2E7E3] bg-white hover:border-[#16866A]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="referralPlan"
                        value="routine-phc"
                        checked={referralPlan === 'routine-phc'}
                        onChange={() => setReferralPlan('routine-phc')}
                        className="mt-0.5 h-4 w-4 text-[#16866A] accent-[#16866A] border-slate-300 focus:ring-[#16866A] cursor-pointer shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#20312A]">
                            Routine PHC Follow-up (No Referral)
                          </span>
                          <span className="text-[11px] font-mono text-[#66756D] font-medium bg-slate-100 px-2 py-0.5 rounded">
                            Rescreen 6–12 Mo
                          </span>
                        </div>
                        <p className="text-xs text-[#66756D] mt-1 leading-normal font-medium">
                          Patient counselled for glycemic control and 6-month rescreening at PHC.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 5. CARE INSTRUCTIONS FOR REFERRAL TEAM */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-[#20312A] uppercase tracking-wider flex items-center justify-between" htmlFor="careInstructions">
                    <span>Care instructions for health worker / referral team</span>
                    <span className="text-[11px] text-[#66756D] font-normal lowercase">Optional</span>
                  </label>
                  <textarea
                    id="careInstructions"
                    rows={2}
                    value={careInstructions}
                    onChange={(e) => setCareInstructions(e.target.value)}
                    className="w-full text-xs text-[#20312A] bg-white border border-[#E2E7E3] rounded-xl p-3 leading-relaxed shadow-xs focus:border-[#16866A] focus:ring-1 focus:ring-[#16866A] transition-colors placeholder:text-slate-400 font-normal"
                  />
                </div>

                {/* 6. PATIENT GUIDANCE CHECKBOXES */}
                <div className="p-3.5 bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#20312A] uppercase tracking-wider">
                      Patient Guidance & Tele-Handoff
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F4EA] text-[#047857] border border-[#A7F3D0]">
                      <Check className="w-3 h-3 text-[#047857]" />
                      SMS + IVR Prompt
                    </span>
                  </div>
                  <div className="text-xs text-[#20312A] space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={smsAlert}
                        onChange={(e) => setSmsAlert(e.target.checked)}
                        className="h-4 w-4 text-[#16866A] accent-[#16866A] rounded border-[#E2E7E3] focus:ring-[#16866A] cursor-pointer"
                      />
                      <span className="text-xs font-medium text-[#20312A]">
                        Dispatch emergency SMS alert to patient/caregiver in Kannada
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={workerAlert}
                        onChange={(e) => setWorkerAlert(e.target.checked)}
                        className="h-4 w-4 text-[#16866A] accent-[#16866A] rounded border-[#E2E7E3] focus:ring-[#16866A] cursor-pointer"
                      />
                      <span className="text-xs font-medium text-[#20312A]">
                        Notify PHC Chelur ASHA worker (Kavya N.) for immediate field coordination
                      </span>
                    </label>
                  </div>
                </div>

                {/* 7. ACTIONS: SAVE DRAFT + CONFIRM & SUBMIT REVIEW */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="w-full sm:w-1/3 min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#E2E7E3] bg-white hover:bg-[#F8FAF7] text-[#20312A] font-semibold text-xs tracking-tight transition shadow-xs flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#16866A] cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-[#66756D]" />
                    <span>{isDraftSaved ? 'Draft Saved!' : 'Save Draft'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-gradient-pill w-full sm:flex-1 min-h-[44px] rounded-xl text-[#14532D] font-bold text-xs tracking-wide shadow-xs hover:brightness-105 hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#16866A] cursor-pointer disabled:opacity-75"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 text-[#14532D] animate-spin" />
                        <span>Confirming Review...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-[#14532D]" />
                        <span>Confirm & Submit Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
