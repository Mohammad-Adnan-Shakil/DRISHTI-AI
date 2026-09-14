import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Check,
  CheckCircle2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Camera,
  Upload,
  Sparkles,
  Info,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Printer,
  Sliders
} from 'lucide-react'
import Navbar from '../components/Navbar'
import GradeBadge from '../components/GradeBadge'

// Mock Patient Database
const PATIENTS = {
  'DRI-2026-00421': {
    id: 'DRI-2026-00421',
    name: 'Anitha R.',
    initials: 'AR',
    ageGender: '52F (52 yrs • Female)',
    phc: 'PHC Hosakote',
    diabetesDuration: '8 Years (Type II)',
    hba1c: '7.8% (Elevated)',
    hypertension: 'Yes (Stage 1)',
    language: 'Kannada (KN)',
    audioGuidance: true,
    lastScreened: '14 months ago',
    priorGrade: 0,
    priorGradeLabel: 'Grade 0 · No DR',
    abhaId: '91-4829-1049-2210'
  },
  'DRI-2026-00418': {
    id: 'DRI-2026-00418',
    name: 'Ramesh B.',
    initials: 'RB',
    ageGender: '61M (61 yrs • Male)',
    phc: 'PHC Hosakote',
    diabetesDuration: '12 Years (Type II)',
    hba1c: '8.4% (Poorly Controlled)',
    hypertension: 'Yes',
    language: 'Kannada (KN)',
    audioGuidance: true,
    lastScreened: '8 months ago',
    priorGrade: 1,
    priorGradeLabel: 'Grade 1 · Mild NPDR',
    abhaId: '91-3712-8821-4402'
  }
}

// ICDR DR Grade Definitions for Scale & Simulation
const GRADE_CONFIG = {
  0: {
    title: 'Grade 0 · No Diabetic Retinopathy',
    risk: 'Low Risk',
    riskColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    confidence: 97.4,
    findings: 'Normal retinal microvasculature. No microaneurysms, hemorrhages, or exudates identified in 45° fundus field.',
    recommendationTitle: 'Routine Annual Follow-up at PHC',
    recommendation: 'No diabetic retinopathy detected. Continue current glycemic management and schedule standard annual non-mydriatic screening at PHC.',
    timeframe: 'Routine follow-up in 12 months',
    primaryActionLabel: '✓ Save & Discharge',
    primaryActionRoute: '/dashboard',
    urgencyText: 'Routine Annual Surveillance'
  },
  1: {
    title: 'Grade 1 · Mild Non-Proliferative DR',
    risk: 'Low to Moderate Risk',
    riskColor: 'bg-amber-100 text-amber-800 border-amber-300',
    confidence: 93.8,
    findings: 'Isolated microaneurysms identified in inferior-temporal arcade (< 5 lesions). No hard exudates or macular edema detected.',
    recommendationTitle: '6-Month Surveillance & Glycemic Review',
    recommendation: 'Mild early microaneurysms present. Intensify glycemic and blood pressure control. Repeat screening at PHC in 6 months.',
    timeframe: 'Re-screen at PHC in 6 months',
    primaryActionLabel: '✓ Save & Discharge',
    primaryActionRoute: '/dashboard',
    urgencyText: 'Semi-Annual Surveillance'
  },
  2: {
    title: 'Grade 2 · Moderate Non-Proliferative DR',
    risk: 'HIGH RISK',
    riskColor: 'bg-orange-100 text-orange-800 border-orange-200',
    confidence: 94.2,
    findings: 'Salient microaneurysms, dot hemorrhages, and early hard exudate clusters identified in inferior-temporal quadrant. Mild venous tortuosity.',
    recommendationTitle: 'Refer patient for ophthalmologist evaluation',
    recommendation: 'Refer to Taluk Hospital / District Hospital eye OPD for comprehensive dilated slit-lamp fundoscopy and baseline macular OCT. Review glycemic and blood pressure management.',
    timeframe: 'Recommended evaluation: Within 2–4 weeks',
    primaryActionLabel: '↗ Save & Create Referral',
    primaryActionRoute: '/referrals',
    urgencyText: 'High Urgency Referral'
  },
  3: {
    title: 'Grade 3 · Severe Non-Proliferative DR',
    risk: 'URGENT RISK',
    riskColor: 'bg-rose-100 text-rose-800 border-rose-200',
    confidence: 95.6,
    findings: 'Multiple intraretinal microvascular abnormalities (IRMA), extensive dot-blot hemorrhages in ≥ 2 quadrants, and prominent venous beading.',
    recommendationTitle: 'Urgent Ophthalmology Referral Required',
    recommendation: 'High risk of progression to proliferative DR and vision loss. Direct urgent referral to District Ophthalmic Center for prompt evaluation and pan-retinal photocoagulation assessment.',
    timeframe: 'Urgent referral: Within 1–2 weeks',
    primaryActionLabel: '↗ Save & Create Referral',
    primaryActionRoute: '/referrals',
    urgencyText: 'Urgent Ophthalmology Referral'
  },
  4: {
    title: 'Grade 4 · Proliferative Diabetic Retinopathy',
    risk: 'CRITICAL SIGHT THREAT',
    riskColor: 'bg-red-100 text-red-900 border-red-300',
    confidence: 96.8,
    findings: 'Neovascularization of the disc/retina (NVD/NVE), preretinal fibrous proliferation, and localized vitreous hemorrhage risk.',
    recommendationTitle: 'Immediate Specialist Referral & Intervention',
    recommendation: 'Severe sight-threatening proliferative DR. Arrange immediate priority transport to Tertiary Eye Institute / Medical College for urgent anti-VEGF injection / pan-retinal laser.',
    timeframe: 'Immediate referral: Within 48–72 hours',
    primaryActionLabel: '↗ Save & Create Referral',
    primaryActionRoute: '/referrals',
    urgencyText: 'Critical Sight-Threatening Emergency'
  }
}

const STEPS = [
  { id: 'select-patient', number: 1, label: 'Select Patient' },
  { id: 'capture', number: 2, label: 'Capture Image' },
  { id: 'quality-check', number: 3, label: 'Quality Check' },
  { id: 'processing', number: 4, label: 'AI Analysis' },
  { id: 'results', number: 5, label: 'Results' }
]

export default function Screening() {
  const navigate = useNavigate()

  // Step state machine: 'select-patient' | 'capture' | 'quality-check' | 'processing' | 'results'
  const [screeningStep, setScreeningStep] = useState('capture')
  const [selectedPatientId, setSelectedPatientId] = useState('DRI-2026-00421')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeEye, setActiveEye] = useState('OD') // 'OD' | 'OS'
  const [activeLayer, setActiveLayer] = useState('original') // 'original' | 'gradcam' | 'vessel' | 'compare'
  const [zoomLevel, setZoomLevel] = useState(1.0)
  const [isCapturing, setIsCapturing] = useState(false)
  const [hasImage, setHasImage] = useState(false)

  // Quality check state
  const [isQualityRejected, setIsQualityRejected] = useState(false)

  // AI Pipeline simulation state
  const [pipelineStage, setPipelineStage] = useState(5) // 0..5 stages
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(100)

  // Simulated Grade selection (0..4)
  const [simulatedGrade, setSimulatedGrade] = useState(2)

  const selectedPatient = PATIENTS[selectedPatientId] || PATIENTS['DRI-2026-00421']
  const gradeInfo = GRADE_CONFIG[simulatedGrade] || GRADE_CONFIG[2]

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 2.0))
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))
  const handleZoomReset = () => setZoomLevel(1.0)

  // Patient Lookup Form
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.toLowerCase().includes('00418') || searchQuery.toLowerCase().includes('ramesh')) {
      setSelectedPatientId('DRI-2026-00418')
    } else {
      setSelectedPatientId('DRI-2026-00421')
    }
  }

  // Camera capture simulation
  const handleCaptureImage = () => {
    setIsCapturing(true)
    setTimeout(() => {
      setIsCapturing(false)
      setHasImage(true)
      setScreeningStep('quality-check')
    }, 1200)
  }

  // Upload simulation
  const handleUploadImage = () => {
    setHasImage(true)
    setScreeningStep('quality-check')
  }

  // AI Pipeline execution
  const startAIAnalysis = () => {
    setScreeningStep('processing')
    setIsAnalyzing(true)
    setPipelineStage(1)
    setAnalysisProgress(15)

    const interval = setInterval(() => {
      setPipelineStage(prev => {
        if (prev === 1) { setAnalysisProgress(35); return 2 }
        if (prev === 2) { setAnalysisProgress(60); return 3 }
        if (prev === 3) { setAnalysisProgress(82); return 4 }
        if (prev === 4) { setAnalysisProgress(95); return 5 }
        if (prev >= 5) {
          clearInterval(interval)
          setAnalysisProgress(100)
          setIsAnalyzing(false)
          // Transition to results automatically after brief completion
          setTimeout(() => {
            setScreeningStep('results')
          }, 800)
          return 5
        }
        return prev + 1
      })
    }, 600)
  }

  const getStepIndex = (stepId) => STEPS.findIndex(s => s.id === stepId)
  const currentStepIndex = getStepIndex(screeningStep)

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A] pb-16 md:pb-12">
      {/* 1. Global Navbar with Health Worker Profile */}
      <Navbar />

      {/* 2. Sticky Compact Patient Context Bar (when patient is selected) */}
      {selectedPatient && (
        <aside aria-label="Selected Patient Banner" className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E7E3] px-4 sm:px-6 lg:px-8 py-2.5 shadow-xs transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16866A]" />
              <div className="flex items-center gap-1.5 font-heading">
                <span className="font-bold text-[#20312A] text-sm">{selectedPatient.name}</span>
                <span className="text-[#66756D] font-mono">· {selectedPatient.id}</span>
              </div>
              <span className="hidden md:inline-flex items-center text-[#66756D]">
                {selectedPatient.phc} • {selectedPatient.ageGender}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-full bg-[#F8FAF7] border border-[#E2E7E3] font-semibold text-[#20312A] text-[11px] sm:text-xs">
                {activeEye === 'OD' ? 'OD (Right Eye)' : 'OS (Left Eye)'}
              </span>
              {screeningStep === 'results' && (
                <GradeBadge grade={simulatedGrade} />
              )}
            </div>
          </div>
        </aside>
      )}

      {/* 3. Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">

        {/* 5-STEP HORIZONTAL STEPPER */}
        <section aria-label="Screening Progress" className="bg-white rounded-2xl border border-[#E2E7E3] p-3.5 sm:p-4 shadow-sm">
          {/* Desktop 5-Step Stepper */}
          <div className="hidden sm:flex items-center justify-between gap-2">
            {STEPS.map((step, idx) => {
              const isCompleted = idx < currentStepIndex
              const isCurrent = idx === currentStepIndex

              return (
                <div key={step.id} className="flex items-center gap-2 flex-1 last:flex-none">
                  <button
                    type="button"
                    onClick={() => setScreeningStep(step.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-gradient-to-r from-[#D9F99D] via-[#DCFCE7] to-[#CCFBF1] text-[#14532D] font-bold border border-[#A7F3D0] shadow-xs'
                        : isCompleted
                        ? 'bg-[#E6F4EA] text-[#047857] border border-[#047857]/20 font-semibold hover:bg-[#d6ecdc]'
                        : 'bg-[#F8FAF7] text-[#66756D] border border-[#E2E7E3] font-medium hover:text-[#20312A]'
                    }`}
                  >
                    {isCompleted ? (
                      <span className="w-4 h-4 rounded-full bg-[#047857] text-white flex items-center justify-center font-bold text-[10px]">
                        ✓
                      </span>
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-[#14532D] animate-pulse" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-mono">
                        {step.number}
                      </span>
                    )}
                    <span>{step.label}</span>
                  </button>

                  {idx < STEPS.length - 1 && (
                    <div className="flex-1 h-[2px] bg-[#E2E7E3] mx-1 rounded-full relative overflow-hidden">
                      {isCompleted && (
                        <div className="absolute inset-0 bg-[#047857]" />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile Stepper Banner */}
          <div className="sm:hidden flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full font-bold bg-[#E6F4EA] text-[#047857] border border-[#047857]/20">
                Step {currentStepIndex + 1} of 5
              </span>
              <span className="font-bold text-[#20312A]">{STEPS[currentStepIndex].label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setScreeningStep(STEPS[currentStepIndex - 1].id)}
                  className="px-2 py-1 bg-[#F8FAF7] border border-[#E2E7E3] rounded text-[11px] font-medium text-[#20312A]"
                >
                  Prev
                </button>
              )}
              {currentStepIndex < STEPS.length - 1 && (
                <button
                  type="button"
                  onClick={() => setScreeningStep(STEPS[currentStepIndex + 1].id)}
                  className="px-2 py-1 bg-gradient-to-r from-[#D9F99D] via-[#DCFCE7] to-[#CCFBF1] text-[#14532D] border border-[#A7F3D0] rounded text-[11px] font-bold"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </section>

        {/* WORKSPACE 2-COLUMN LAYOUT (LEFT 38% / RIGHT 62%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ============================================================ */}
          {/* LEFT COLUMN: PATIENT SELECTION, ACTIVE RECORD & PROTOCOL (5 cols) */}
          {/* ============================================================ */}
          <section className="lg:col-span-5 space-y-5">

            {/* A) SELECT PATIENT CARD */}
            <div className="bg-white rounded-2xl border border-[#E2E7E3] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#66756D]">
                  Select Patient
                </span>
                <span className="text-[11px] text-[#16866A] font-semibold bg-[#E6F4EA] px-2 py-0.5 rounded-full">
                  PHC Hosakote
                </span>
              </div>

              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Patient ID (00421) or Name..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E2E7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16866A] text-[#20312A]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-[#E6F4EA] text-[#20312A] border border-[#E2E7E3] shadow-2xs transition-colors cursor-pointer"
                >
                  Search
                </button>
              </form>

              {/* Recent Patient Chips */}
              <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[#66756D] text-[11px]">Recent:</span>
                <button
                  type="button"
                  onClick={() => setSelectedPatientId('DRI-2026-00421')}
                  className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                    selectedPatientId === 'DRI-2026-00421'
                      ? 'bg-[#E6F4EA] text-[#047857] border-[#047857]/30 font-bold'
                      : 'bg-[#F8FAF7] text-[#20312A] border-[#E2E7E3] hover:bg-slate-100'
                  }`}
                >
                  Anitha R. (00421)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPatientId('DRI-2026-00418')}
                  className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                    selectedPatientId === 'DRI-2026-00418'
                      ? 'bg-[#E6F4EA] text-[#047857] border-[#047857]/30 font-bold'
                      : 'bg-[#F8FAF7] text-[#20312A] border-[#E2E7E3] hover:bg-slate-100'
                  }`}
                >
                  Ramesh B. (00418)
                </button>
              </div>
            </div>

            {/* B) ACTIVE PATIENT RECORD CARD (Dominant Left Card) */}
            <div className="bg-white rounded-2xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] overflow-hidden">
              <div className="bg-[#285943]/5 px-5 py-3.5 border-b border-[#E2E7E3] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#047857]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#20312A]">
                    Active Patient Record
                  </span>
                </div>

              </div>

              <div className="p-5 space-y-4">
                {/* Header Profile with Avatar */}
                <div className="flex items-start justify-between pb-4 border-b border-[#E2E7E3]">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-[#20312A] font-heading leading-tight">
                      {selectedPatient.name}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {selectedPatient.id}
                      </span>
                      <span className="text-xs text-[#475569] font-medium">{selectedPatient.phc}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#285943] to-[#16866A] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                    {selectedPatient.initials}
                  </div>
                </div>

                {/* Clinical Grid — Standardized (Two clean patterns: plain meta text + soft pills) */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-[#F8FAF7] border border-[#E2E7E3] p-3 rounded-xl">
                    <span className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider block">Age / Gender</span>
                    <span className="font-bold text-[#20312A] mt-0.5 block">{selectedPatient.ageGender}</span>
                  </div>
                  <div className="bg-[#F8FAF7] border border-[#E2E7E3] p-3 rounded-xl">
                    <span className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider block">Diabetes Duration</span>
                    <span className="font-bold text-[#20312A] mt-0.5 block">{selectedPatient.diabetesDuration}</span>
                  </div>
                  <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider block">Latest HbA1c</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">Elevated</span>
                    </div>
                    <span className="font-bold text-amber-900 mt-0.5 block">{selectedPatient.hba1c}</span>
                  </div>
                  <div className="bg-[#F8FAF7] border border-[#E2E7E3] p-3 rounded-xl">
                    <span className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider block">Hypertension</span>
                    <span className="font-bold text-[#20312A] mt-0.5 block">{selectedPatient.hypertension}</span>
                  </div>
                </div>

                {/* Additional Clinical Context */}
                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F8FAF7] border border-[#E2E7E3]">
                    <span className="text-[#475569]">Preferred Language:</span>
                    <span className="font-semibold text-[#20312A]">
                      {selectedPatient.language} • Audio Guidance
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F8FAF7] border border-[#E2E7E3]">
                    <span className="text-[#475569]">Prior DR Status:</span>
                    <GradeBadge grade={selectedPatient.priorGrade} />
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F8FAF7] border border-[#E2E7E3]">
                    <span className="text-[#475569]">Primary ABHA ID:</span>
                    <span className="font-mono font-medium text-[#20312A]">{selectedPatient.abhaId}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to={`/history/${selectedPatient.id}`}
                    className="w-full py-2.5 bg-white hover:bg-[#E6F4EA] border border-[#E2E7E3] text-[#20312A] text-xs font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>View Longitudinal History</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#285943]" />
                  </Link>
                </div>
              </div>
            </div>

            {/* C) STANDARD PHC SCREENING PROTOCOL (Calm Secondary Guidance) */}
            <div className="bg-[#F8FAF7] rounded-2xl border border-[#E2E7E3]/70 p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#16866A]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                  PHC Clinical Screening Protocol
                </h3>
              </div>
              <ul className="text-xs text-[#66756D] space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Acquire 45° non-mydriatic retinal fundus image in a semi-darkened room.</li>
                <li>Ensure patient looks directly at green internal fixation target.</li>
                <li>Verify automated QA illumination and focus score before AI inference.</li>
                <li>Screening result assists decision-making; suspicious cases must be verified.</li>
              </ul>
              <div className="pt-2 border-t border-[#E2E7E3]/60 flex items-center justify-between text-[11px] text-[#66756D]">
                <span>Edge AI Model: <strong>ResNet50-PHC v2.4</strong></span>
                <span className="text-[#047857] font-semibold">Offline Ready</span>
              </div>
            </div>

          </section>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: WORKSPACE, VIEWER, QA CHECK, PIPELINE, RESULTS (7 cols) */}
          {/* ============================================================ */}
          <section className="lg:col-span-7 space-y-6">

            {/* 1. FUNDUS ACQUISITION & VIEWER CARD */}
            <div className="bg-white rounded-2xl border border-[#E2E7E3] p-5 sm:p-6 shadow-sm space-y-4">

              {/* EYE SELECTOR & QA STATUS HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E7E3]">
                <div>
                  <span className="text-xs font-bold text-[#66756D] uppercase tracking-wider block mb-1">
                    Target Eye Selection
                  </span>
                  <div className="inline-flex rounded-full p-1 bg-[#F8FAF7] border border-[#E2E7E3]">
                    <button
                      type="button"
                      onClick={() => setActiveEye('OD')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeEye === 'OD'
                          ? 'bg-gradient-to-r from-[#D9F99D] via-[#DCFCE7] to-[#CCFBF1] text-[#14532D] border border-[#A7F3D0] shadow-xs'
                          : 'text-[#66756D] hover:text-[#20312A] hover:bg-white/80'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${activeEye === 'OD' ? 'bg-[#14532D]' : 'bg-slate-400'}`} />
                      <span>OD (Right Eye)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEye('OS')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeEye === 'OS'
                          ? 'bg-gradient-to-r from-[#D9F99D] via-[#DCFCE7] to-[#CCFBF1] text-[#14532D] border border-[#A7F3D0] shadow-xs'
                          : 'text-[#66756D] hover:text-[#20312A] hover:bg-white/80'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${activeEye === 'OS' ? 'bg-[#14532D]' : 'bg-slate-400'}`} />
                      <span>OS (Left Eye)</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E6F4EA] text-[#047857] border border-[#047857]/20 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" />
                    <span>92% GOOD</span>
                  </span>
                  <span className="text-[11px] text-[#66756D] font-medium">Ready for AI</span>
                </div>
              </div>

              {/* EXPLAINABLE AI LAYER TOGGLES */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#66756D] uppercase tracking-wider">
                    Layer:
                  </span>
                  <div className="bg-[#F1F5F9] p-1 rounded-lg inline-flex items-center gap-1 text-xs">
                    {[
                      { id: 'original', label: 'Original' },
                      { id: 'gradcam', label: 'Grad-CAM Heatmap' },
                      { id: 'vessel', label: 'Vessel Map' },
                      { id: 'compare', label: 'Compare' }
                    ].map((layer) => (
                      <button
                        key={layer.id}
                        type="button"
                        onClick={() => setActiveLayer(layer.id)}
                        className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer font-medium ${
                          activeLayer === layer.id
                            ? 'bg-white shadow-sm rounded-md text-[#20312A] font-semibold'
                            : 'text-[#66756D] hover:text-[#20312A]'
                        }`}
                      >
                        {layer.label}
                      </button>
                    ))}
                  </div>
                </div>

                <span className="text-[11px] text-[#475569] font-medium">
                  10:32 AM · 2048×2048 · 92% QA
                </span>
              </div>

              {/* HIGH-FIDELITY RETINAL FUNDUS DISPLAY FRAME */}
              <div className="relative w-full aspect-square max-h-[380px] sm:max-h-[440px] mx-auto bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center group">
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <svg className="w-full h-full object-cover select-none" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient cx="50%" cy="50%" id="fundusBg" r="50%">
                        <stop offset="0%" stopColor="#C2410C" />
                        <stop offset="45%" stopColor="#9A3412" />
                        <stop offset="75%" stopColor="#7C2D12" />
                        <stop offset="92%" stopColor="#451A03" />
                        <stop offset="100%" stopColor="#180B04" />
                      </radialGradient>
                      <radialGradient cx="42%" cy="46%" id="opticDisc" r="50%">
                        <stop offset="0%" stopColor="#FED7AA" />
                        <stop offset="40%" stopColor="#FDBA74" />
                        <stop offset="85%" stopColor="#EA580C" />
                        <stop offset="100%" stopColor="#9A3412" />
                      </radialGradient>
                      <radialGradient cx="50%" cy="50%" id="macula" r="50%">
                        <stop offset="0%" stopColor="#431407" stopOpacity="0.85" />
                        <stop offset="60%" stopColor="#7C2D12" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#9A3412" stopOpacity="0" />
                      </radialGradient>
                      {/* Grad-CAM Attention Heatmap Gradients */}
                      <radialGradient cx="45%" cy="46%" id="screeningGradCam" r="48%">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.88" />
                        <stop offset="35%" stopColor="#F97316" stopOpacity="0.75" />
                        <stop offset="65%" stopColor="#EAB308" stopOpacity="0.45" />
                        <stop offset="85%" stopColor="#22C55E" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient cx="58%" cy="54%" id="screeningGradCam2" r="35%">
                        <stop offset="0%" stopColor="#DC2626" stopOpacity="0.8" />
                        <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                      </radialGradient>
                      <filter id="screeningBlur">
                        <feGaussianBlur stdDeviation="10" />
                      </filter>
                    </defs>

                    {/* Base Fundus Globe */}
                    <circle cx="250" cy="250" fill="url(#fundusBg)" r="240" />

                    {/* Retinal Vasculature Paths */}
                    <g fill="none" opacity="0.88" stroke="#7F1D1D" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M210,230 Q220,170 270,120 T360,90" strokeWidth="3.2" />
                      <path d="M210,230 Q190,160 140,110 T70,80" strokeWidth="2.8" />
                      <path d="M210,230 Q230,290 290,340 T390,390" strokeWidth="3.4" />
                      <path d="M210,230 Q180,300 130,360 T50,400" strokeWidth="2.6" />
                      <path d="M270,120 Q310,105 340,75" strokeWidth="1.6" />
                      <path d="M290,340 Q330,360 370,410" strokeWidth="1.8" />
                      <path d="M140,110 Q110,95 85,60" strokeWidth="1.5" />
                      <path d="M130,360 Q105,390 75,420" strokeWidth="1.5" />
                    </g>

                    {/* Optic Disc */}
                    <circle cx="210" cy="230" fill="url(#opticDisc)" opacity="0.95" r="38" />
                    <circle cx="206" cy="227" fill="#FFF7ED" opacity="0.65" r="16" />

                    {/* Macula & Fovea */}
                    <circle cx="310" cy="245" fill="url(#macula)" r="45" />
                    <circle cx="310" cy="245" fill="#2E0A02" opacity="0.9" r="6" />

                    {/* Grad-CAM Heatmap Layer */}
                    {(activeLayer === 'gradcam' || activeLayer === 'compare') && (
                      <g className="animate-in fade-in duration-300" filter="url(#screeningBlur)" opacity="0.82">
                        <circle cx="230" cy="235" fill="url(#screeningGradCam)" r="130" />
                        <circle cx="295" cy="265" fill="url(#screeningGradCam2)" r="95" />
                      </g>
                    )}

                    {/* Vessel Segmentation Map Layer */}
                    {(activeLayer === 'vessel' || activeLayer === 'compare') && (
                      <g className="animate-in fade-in duration-300" fill="none" opacity="0.92" stroke="#22D3EE" strokeLinecap="round">
                        <path d="M210,230 Q220,170 270,120 T360,90" strokeWidth="2.8" />
                        <path d="M210,230 Q190,160 140,110 T70,80" strokeWidth="2.4" />
                        <path d="M210,230 Q230,290 290,340 T390,390" strokeWidth="3" />
                        <path d="M210,230 Q180,300 130,360 T50,400" strokeWidth="2.2" />
                        <circle cx="270" cy="120" fill="#22D3EE" r="2.5" />
                        <circle cx="290" cy="340" fill="#22D3EE" r="2.5" />
                      </g>
                    )}

                    {/* Compare Split Line */}
                    {activeLayer === 'compare' && (
                      <line stroke="#FFFFFF" strokeDasharray="5 5" strokeWidth="2" x1="250" x2="250" y1="10" y2="490" />
                    )}
                  </svg>
                </div>

                {/* Overlays */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span>{activeEye} • 45° Field • {activeLayer.toUpperCase()}</span>
                </div>

                {/* Zoom Controls (More comfortable hit area & styling) */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-sm text-white p-1.5 rounded-xl border border-slate-700/60 shadow-md">
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomReset}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Reset Zoom"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Retake Control */}
                <div className="absolute bottom-3 right-3">
                  <button
                    type="button"
                    onClick={() => { setHasImage(false); setScreeningStep('capture'); setZoomLevel(1.0) }}
                    className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Retake</span>
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS UNDER VIEWER (Sequencing: Capture first, then Retake / Run Analysis) */}
              {!hasImage ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCaptureImage}
                    disabled={isCapturing}
                    className="btn-gradient-pill min-h-[44px] h-12 px-5 text-sm font-bold shadow-xs hover:brightness-105 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A]"
                  >
                    <Camera className="w-5 h-5 text-[#14532D]" />
                    <span>{isCapturing ? 'Acquiring Image...' : 'Capture Image'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadImage}
                    className="min-h-[44px] h-12 px-5 bg-white hover:bg-[#E6F4EA] active:bg-slate-100 text-[#20312A] font-semibold text-sm rounded-xl border border-[#E2E7E3] shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A]"
                  >
                    <Upload className="w-5 h-5 text-slate-500" />
                    <span>Upload from Device</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setHasImage(false); setScreeningStep('capture'); setZoomLevel(1.0) }}
                    className="min-h-[44px] h-12 px-5 bg-white hover:bg-[#E6F4EA] active:bg-slate-100 text-[#20312A] font-semibold text-sm rounded-xl border border-[#E2E7E3] shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A]"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-600" />
                    <span>Retake Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadImage}
                    className="min-h-[44px] h-12 px-5 bg-white hover:bg-[#E6F4EA] active:bg-slate-100 text-[#475569] hover:text-[#20312A] font-semibold text-sm rounded-xl border border-[#E2E7E3] shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A]"
                  >
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>Upload Replacement</span>
                  </button>
                </div>
              )}

              {/* Layer Explanation Caption */}
              {activeLayer === 'gradcam' && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Grad-CAM Explanation:</strong> The highlighted region represents the visual attention map of the neural network. This highlights candidate lesion areas and is intended for clinical assistance, not definitive lesion segmentation.
                  </span>
                </div>
              )}
            </div>

            {/* 2. QUALITY CHECK CARD (Active once image is captured) */}
            {(screeningStep === 'quality-check' || (screeningStep === 'capture' && hasImage)) && (
              <div className="bg-white rounded-2xl border border-[#E2E7E3] p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E7E3]">
                  <div>
                    <h3 className="text-sm font-bold text-[#20312A] font-heading">
                      Image Quality Check
                    </h3>
                    <p className="text-xs text-[#66756D] mt-0.5">
                      Automated 4-point optical quality assessment before deep learning inference
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQualityRejected(!isQualityRejected)}
                    className="text-[11px] font-semibold text-[#66756D] hover:text-[#20312A] underline cursor-pointer"
                  >
                    {isQualityRejected ? 'Simulate Pass' : 'Simulate Low Quality'}
                  </button>
                </div>

                {isQualityRejected ? (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      <div>
                        <h4 className="font-bold text-xs">Image Quality Insufficient (Score: 54/100)</h4>
                        <p className="text-[11px] text-rose-700 mt-0.5">Motion blur and peripheral underexposure detected. Cannot proceed to clinical AI analysis.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setIsQualityRejected(false); setHasImage(false); setScreeningStep('capture') }}
                      className="min-h-[44px] h-11 w-full bg-white hover:bg-[#E6F4EA] border border-[#E2E7E3] text-[#20312A] font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-600" />
                      <span>Retake Fundus Image</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl p-2.5 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-[11px]">✓</span>
                        <span className="text-[#20312A] font-medium">Illumination</span>
                      </div>
                      <div className="bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl p-2.5 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-[11px]">✓</span>
                        <span className="text-[#20312A] font-medium">Retina Centered</span>
                      </div>
                      <div className="bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl p-2.5 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-[11px]">✓</span>
                        <span className="text-[#20312A] font-medium">Minimal Blur</span>
                      </div>
                      <div className="bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl p-2.5 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-[11px]">✓</span>
                        <span className="text-[#20312A] font-medium">Field of View</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={startAIAnalysis}
                        className="btn-gradient-pill w-full min-h-[44px] h-12 text-base font-bold shadow-md hover:shadow transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        <Sparkles className="w-5 h-5 text-[#14532D]" />
                        <span>Run AI Analysis</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 3. AI PROCESSING PIPELINE CARD (Step 4) */}
            {screeningStep === 'processing' && (
              <div className="bg-white rounded-2xl border border-[#E2E7E3] p-5 sm:p-6 shadow-md space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E7E3]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#285943] text-white flex items-center justify-center shadow-xs">
                      <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''} text-[#A7F3D0]`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#20312A] font-heading">
                        AI Analysis Pipeline
                      </h3>
                      <p className="text-xs text-[#66756D]">
                        Executing 5-stage inference on local PHC Edge NPU
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreeningStep('results')}
                    className="text-xs font-semibold text-[#285943] hover:underline cursor-pointer"
                  >
                    Skip to Results →
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#66756D]">Inference Progress</span>
                    <span className="text-[#285943] font-mono font-bold">{analysisProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F8FAF7] border border-[#E2E7E3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#D9F99D] via-[#16866A] to-[#285943] transition-all duration-300 rounded-full"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                </div>

                {/* 5 Stages List */}
                <div className="divide-y divide-slate-100 border border-[#E2E7E3] rounded-xl overflow-hidden text-xs">
                  <div className="p-3 flex items-center justify-between bg-emerald-50/40">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">✓</span>
                      <span className="font-semibold text-[#20312A]">1. Image Quality Check</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#66756D]">0.28s</span>
                  </div>
                  <div className={`p-3 flex items-center justify-between ${pipelineStage >= 2 ? 'bg-emerald-50/40' : 'bg-white opacity-70'}`}>
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                        {pipelineStage >= 2 ? '✓' : '•'}
                      </span>
                      <span className="font-semibold text-[#20312A]">2. Image Enhancement (CLAHE & Normalization)</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#66756D]">0.42s</span>
                  </div>
                  <div className={`p-3 flex items-center justify-between ${pipelineStage >= 3 ? 'bg-emerald-50/40' : 'bg-white opacity-70'}`}>
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                        {pipelineStage >= 3 ? '✓' : '•'}
                      </span>
                      <span className="font-semibold text-[#20312A]">3. DR Classification (ResNet50-PHC v2.4)</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#66756D]">0.85s</span>
                  </div>
                  <div className={`p-3 flex items-center justify-between ${pipelineStage >= 4 ? 'bg-emerald-50/40' : 'bg-white opacity-70'}`}>
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                        {pipelineStage >= 4 ? '✓' : '•'}
                      </span>
                      <span className="font-semibold text-[#20312A]">4. Grad-CAM Explanation Heatmap</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#66756D]">0.54s</span>
                  </div>
                  <div className={`p-3 flex items-center justify-between ${pipelineStage >= 5 ? 'bg-emerald-50/40' : 'bg-white opacity-70'}`}>
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                        {pipelineStage >= 5 ? '✓' : '•'}
                      </span>
                      <span className="font-semibold text-[#20312A]">5. Microvascular Caliber Segmentation</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#66756D]">0.48s</span>
                  </div>
                </div>

                <div className="p-3 bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl text-xs text-[#66756D] flex items-center justify-between">
                  <span>Edge Privacy: On-device processing • No identifiable patient data transmitted.</span>
                  <span className="font-mono text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-700">ON-DEVICE NPU</span>
                </div>
              </div>
            )}

            {/* 4. RESULTS STEP (FLAGSHIP STITCH CLINICAL RESULT BLOCK) */}
            {screeningStep === 'results' && (
              <div className="space-y-5 animate-in fade-in duration-300">

                {/* Subtle Simulation Demo Control */}
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E2E7E3] text-xs">
                  <div className="flex items-center gap-2 text-[#66756D]">
                    <Sliders className="w-3.5 h-3.5 text-[#16866A]" />
                    <span className="font-semibold text-[#20312A]">Demo Simulator:</span>
                    <span>Switch simulated grade to review alternate clinical flows:</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3, 4].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSimulatedGrade(g)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                          simulatedGrade === g
                            ? 'bg-[#20312A] text-white shadow-xs'
                            : 'bg-[#F8FAF7] text-[#66756D] border border-[#E2E7E3] hover:bg-slate-100'
                        }`}
                      >
                        G{g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* A) AI-ASSISTED SCREENING RESULT CARD */}
                <div className="bg-white rounded-2xl border-2 border-[#E2E7E3] p-5 sm:p-6 shadow-[0_2px_12px_rgba(40,89,67,0.04)] space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E7E3]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#16866A]" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#20312A] font-heading">
                        AI-Assisted Screening Result
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#047857] bg-[#E6F4EA] px-2.5 py-0.5 rounded-full border border-[#047857]/20">
                      Verified by ResNet50-PHC v2.4
                    </span>
                  </div>

                  {/* Primary Grade Title & Risk Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <GradeBadge grade={simulatedGrade} />
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#20312A] font-heading">
                          {gradeInfo.title}
                        </h2>
                      </div>
                      <p className="text-xs text-[#66756D] mt-1">
                        Examined Eye: <strong className="text-[#20312A]">{activeEye === 'OD' ? 'Right Eye (OD)' : 'Left Eye (OS)'}</strong> · Field: 45° Non-Mydriatic
                      </p>
                    </div>

                    <span className={`whitespace-nowrap inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-extrabold border shrink-0 self-start sm:self-auto ${gradeInfo.riskColor}`}>
                      {gradeInfo.risk}
                    </span>
                  </div>

                  {/* Findings Line */}
                  <div className="p-3 bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl text-xs text-[#20312A] leading-relaxed">
                    <strong>Salient Clinical Findings:</strong> {gradeInfo.findings}
                  </div>

                  {/* Diagnostic Confidence Metric */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#66756D]">Diagnostic AI Confidence</span>
                      <span className="text-[#20312A] font-bold font-mono">{gradeInfo.confidence}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#F8FAF7] border border-[#E2E7E3] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#16866A] rounded-full"
                        style={{ width: `${gradeInfo.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* ICDR Clinical Classification Scale Visual (0–4) */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-[#66756D] uppercase tracking-wider block mb-2">
                      International Clinical Diabetic Retinopathy (ICDR) Scale:
                    </span>
                    <div className="grid grid-cols-5 gap-1 text-center">
                      {[
                        { grade: 0, label: '0: None' },
                        { grade: 1, label: '1: Mild' },
                        { grade: 2, label: '2: Moderate' },
                        { grade: 3, label: '3: Severe' },
                        { grade: 4, label: '4: Prolif.' }
                      ].map(item => (
                        <div
                          key={item.grade}
                          className={`p-2 rounded-lg border text-xs transition-all ${
                            simulatedGrade === item.grade
                              ? 'bg-[#20312A] text-white font-bold border-[#20312A] shadow-xs'
                              : 'bg-[#F8FAF7] text-[#66756D] border-[#E2E7E3]'
                          }`}
                        >
                          <div className="font-mono text-[11px]">{item.grade}</div>
                          <div className="text-[10px] leading-tight truncate">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mandatory Clinical Disclaimer */}
                  <div className="pt-2 border-t border-[#E2E7E3] text-[11px] text-[#66756D] leading-relaxed flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#16866A] shrink-0 mt-0.5" />
                    <span>
                      AI screening supports clinical decision-making and does not replace professional diagnosis. Final assessment should be performed by a qualified ophthalmologist.
                    </span>
                  </div>
                </div>

                {/* B) CLINICAL RECOMMENDATION CARD */}
                <div className="bg-white rounded-2xl border border-[#E2E7E3] p-5 sm:p-6 shadow-[0_2px_12px_rgba(40,89,67,0.04)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#20312A] font-heading flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#16866A]" />
                      <span>Clinical Recommendation</span>
                    </h3>
                    <span className="text-xs font-bold text-[#285943] bg-[#E6F4EA] px-2.5 py-1 rounded-full border border-[#047857]/20">
                      {gradeInfo.timeframe}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-extrabold text-[#20312A] font-heading">
                      {gradeInfo.recommendationTitle}
                    </h4>
                    <p className="text-xs text-[#66756D] leading-relaxed">
                      {gradeInfo.recommendation}
                    </p>
                  </div>
                </div>

                {/* C) PRIMARY ACTION & PRINT REPORT */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  {/* Primary CTA */}
                  <button
                    type="button"
                    onClick={() => navigate(gradeInfo.primaryActionRoute)}
                    className="flex-1 btn-gradient-pill min-h-[44px] h-12 px-6 text-sm font-bold shadow-sm hover:brightness-105 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{gradeInfo.primaryActionLabel}</span>
                  </button>

                  {/* Print Action */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="min-h-[44px] h-12 px-4 bg-transparent text-[#66756D] hover:text-[#285943] hover:bg-[#F3F6F1] font-semibold text-xs rounded-xl border border-[#E2E7E3] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span>Print Report</span>
                  </button>
                </div>

              </div>
            )}

          </section>
        </div>

      </main>
    </div>
  )
}
