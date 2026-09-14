import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  Download,
  Info,
  CheckCircle2,
  TrendingUp,
  Send,
  Building,
  UserCheck,
  Eye,
  ChevronDown,
  Sparkles,
  FileCheck,
  Check,
  X,
  ExternalLink,
  Activity,
  Layers,
  Award,
  AlertCircle
} from 'lucide-react'
import Navbar from '../components/Navbar'
import GradeBadge from '../components/GradeBadge'

export default function PatientHistory() {
  const navigate = useNavigate()
  const { patientId } = useParams()
  const activePatientId = patientId || 'DRI-2026-00421'

  const [activeLayer, setActiveLayer] = useState('original') // 'original' | 'gradcam' | 'vessels'
  const [expandedVisits, setExpandedVisits] = useState({
    '2025-01': true,
    '2024-10': false,
    '2024-07': false,
    '2024-04': false,
    '2024-01': false,
  })
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const toggleVisit = (id) => {
    setExpandedVisits((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  const handlePrint = () => {
    setIsExportModalOpen(true)
  }

  const handleDownloadPdf = () => {
    setIsExportModalOpen(false)
    showToast(`Patient summary exported as clinical PDF (${activePatientId}.pdf)`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-2 px-4 py-3 bg-[#20312A] text-white rounded-xl shadow-xl border border-[#E2E7E3] animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-auto">
          <CheckCircle2 className="w-5 h-5 text-[#16866A] shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar />

      {/* Secondary Subnav */}
      <div className="border-b border-slate-200 bg-slate-100/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between text-xs sm:text-sm">
          <nav aria-label="Clinical Subnav" className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/dashboard"
              className="px-3 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/screening"
              className="px-3 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors font-medium"
            >
              Screening
            </Link>
            <Link
              to="/referrals"
              className="px-3 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors font-medium"
            >
              Referrals
            </Link>
            <span className="px-3 py-1 rounded-md bg-white text-[#285943] font-semibold shadow-xs border border-slate-200">
              Patient History
            </span>
          </nav>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <Building className="w-3.5 h-3.5 text-teal-600" />
            <span>
              Network: <strong className="text-slate-700 font-medium">PHC Hosakote · Karnataka</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Dedicated Breadcrumb / Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#16866A] transition-colors px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="text-slate-300">/</span>
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 font-medium">
              <Link to="/dashboard" className="hover:text-[#16866A] transition-colors">Patients</Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-semibold">Anitha R. ({activePatientId})</span>
            </nav>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-[#285943] font-semibold text-xs sm:text-sm shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Summary</span>
            </button>
          </div>
        </div>

        {/* Patient Header Card */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6 space-y-5">
          {/* Clinical Disclaimer Notice */}
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#E6F4EA]/60 border border-[#047857]/20 text-[#20312A] text-xs leading-relaxed">
            <Info className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
            <p>
              <strong className="text-[#047857] uppercase tracking-wide mr-1 font-semibold">Clinical Notice:</strong>
              History displays AI-assisted screening records and clinical follow-up status. Final diagnosis and intervention planning remain the sole responsibility of the qualified ophthalmologist.
            </p>
          </div>

          {/* Profile & Action Cluster */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-2">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#285943]/10 text-[#285943] flex items-center justify-center text-xl sm:text-2xl shrink-0 font-extrabold shadow-inner">
                AR
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                    Anitha R.
                  </h1>
                  <span className="px-2.5 py-0.5 rounded bg-[#285943]/10 border border-[#285943]/20 text-[#285943] font-mono text-xs font-semibold">
                    {activePatientId}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Active Cohort
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  52 yrs • Female • PHC Hosakote • Primary ABHA ID: <span className="font-mono text-slate-700 font-medium">91-4829-1049-2210</span>
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className="h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#285943] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Summary</span>
              </button>
              <Link
                to="/referrals"
                className="h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4 text-teal-600" />
                <span>View Referral</span>
              </Link>
              <Link
                to="/screening"
                className="btn-gradient-pill min-h-[44px] h-10 px-4 text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all shadow-xs"
              >
                <Eye className="w-4 h-4 text-[#14532D]" />
                <span>Start New Screening</span>
              </Link>
            </div>
          </div>

          {/* Clinical Facts Grid / Chips */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Diabetes Duration</span>
              <span className="text-sm text-slate-900 mt-1 font-bold">8 Years</span>
              <span className="text-[11px] text-slate-500">Type II (Insulin + Oral)</span>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex flex-col">
              <span className="text-[10px] text-amber-800 uppercase tracking-wider font-semibold">Latest HbA1c</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-amber-900 font-bold">7.8%</span>
                <span className="text-xs font-bold text-amber-700">↑</span>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">Elevated Glycemic</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Hypertension</span>
              <span className="text-sm text-slate-900 mt-1 font-bold">Yes (Controlled)</span>
              <span className="text-[11px] text-slate-500">Amlodipine 5mg</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Family DR History</span>
              <span className="text-sm text-slate-900 mt-1 font-bold">Negative</span>
              <span className="text-[11px] text-slate-500">No maternal/paternal DR</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Preferred Lang</span>
              <span className="text-sm text-slate-900 mt-1 font-bold">Kannada</span>
              <span className="text-[11px] text-slate-500">ಕನ್ನಡ (Audio Enabled)</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Last Screened</span>
              <span className="text-sm text-slate-900 mt-1 font-bold">14 Jan 2025</span>
              <span className="text-[11px] text-slate-500">PHC Hosakote</span>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Screenings */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Screenings</span>
              <div className="w-8 h-8 rounded-lg bg-[#285943]/10 text-[#285943] flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-[#285943] font-heading">5</span>
              <p className="text-xs text-slate-500 mt-1">Over 3 years across PHC network</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-[#16866A] text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>100% Quality Pass Rate</span>
            </div>
          </div>

          {/* Card 2: Latest AI Grade */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Latest AI Grade</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div>
              <GradeBadge grade={2} />
              <p className="text-xs text-slate-500 mt-2">Salient microaneurysms detected</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-slate-600 text-xs font-medium">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>AI Confidence: 94%</span>
            </div>
          </div>

          {/* Card 3: Longitudinal Trend */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Longitudinal Trend</span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-900 font-bold text-xs">
                <span>Progressive ↑</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Shifted from Grade 1 (Mild) in 2024</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-orange-700 text-xs font-semibold">
              <Activity className="w-4 h-4" />
              <span>Interval: Shortened to 6 mo</span>
            </div>
          </div>

          {/* Card 4: Referral Status */}
          <div
            onClick={() => navigate('/referrals')}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 cursor-pointer hover:border-[#285943] hover:ring-2 hover:ring-[#285943]/20 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Referral Status</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Active • Pending Review</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Dispatched to Dr. Arjun Sharma</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1 text-slate-700 truncate">
                <Building className="w-3.5 h-3.5 text-[#16866A] shrink-0" />
                <span className="truncate">Apex Eye Hospital, Bangalore</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#285943] shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* SECTION A: DR Grade Over Time Progression */}
        <section aria-labelledby="section-progression-heading" className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 id="section-progression-heading" className="text-lg font-bold text-[#20312A] font-heading">
                DR Grade Over Time
              </h2>
              <p className="text-xs sm:text-sm text-[#66756D]">AI-assisted screening grades across 5 longitudinal visits</p>
            </div>
            <span className="font-mono text-xs text-[#285943] bg-[#285943]/10 border border-[#285943]/20 px-2.5 py-1 rounded shadow-xs font-semibold self-start sm:self-auto">
              Baseline: Grade 0 (Jan 2024) → Current: Grade 2 (Jan 2025)
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] space-y-5">
            {/* Interactive SVG Line Chart */}
            <div className="relative w-full overflow-x-auto p-4 sm:p-6 bg-[#F8FAF7]/40 rounded-xl border border-[#E2E7E3]">
              <div className="min-w-[620px]">
                <svg
                  aria-label="Longitudinal DR Grade Over Time chart across 5 visits from Jan 2024 to Jan 2025"
                  className="w-full h-64 overflow-visible"
                  fill="none"
                  viewBox="0 0 760 220"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Danger-aware gradient fill: emerald at Grade 0, warming to amber/orange at Grade 2+ */}
                    <linearGradient id="chartAreaGradDanger" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#EA580C" stopOpacity="0.18" />
                      <stop offset="40%" stopColor="#D97706" stopOpacity="0.10" />
                      <stop offset="100%" stopColor="#047857" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Y-Axis Title Label */}
                  <text x="148" y="14" textAnchor="end" className="text-xs font-bold" fill="#64748B">
                    DR SEVERITY SCALE
                  </text>

                  {/* Uniform Horizontal Gridlines (domain [0, 4], mathematically equal 40px spacing) */}
                  <line stroke="#E2E7E3" strokeDasharray="3 3" strokeWidth="1" x1="160" x2="720" y1="28" y2="28" />
                  <line stroke="#E2E7E3" strokeDasharray="3 3" strokeWidth="1" x1="160" x2="720" y1="68" y2="68" />
                  <line stroke="#E2E7E3" strokeDasharray="3 3" strokeWidth="1" x1="160" x2="720" y1="108" y2="108" />
                  <line stroke="#E2E7E3" strokeDasharray="3 3" strokeWidth="1" x1="160" x2="720" y1="148" y2="148" />
                  <line stroke="#E2E7E3" strokeDasharray="3 3" strokeWidth="1" x1="160" x2="720" y1="188" y2="188" />

                  {/* Y-Axis Labels with 6px Colored Prefix Dots and 12px Right-Padding */}
                  {/* Grade 4 · Proliferative (y=28) */}
                  <foreignObject x="0" y="18" width="148" height="20">
                    <div xmlns="http://www.w3.org/1999/xhtml" className="w-full h-full flex items-center justify-end gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#991B1B]" />
                      <span className="text-[11px] font-medium text-[#475569]">Grade 4 · Proliferative</span>
                    </div>
                  </foreignObject>

                  {/* Grade 3 · Severe (y=68) */}
                  <foreignObject x="0" y="58" width="148" height="20">
                    <div xmlns="http://www.w3.org/1999/xhtml" className="w-full h-full flex items-center justify-end gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#DC2626]" />
                      <span className="text-[11px] font-medium text-[#475569]">Grade 3 · Severe</span>
                    </div>
                  </foreignObject>

                  {/* Grade 2 · Moderate (y=108 — ACTIVE HIGHLIGHT) */}
                  <foreignObject x="0" y="98" width="148" height="20">
                    <div xmlns="http://www.w3.org/1999/xhtml" className="w-full h-full flex items-center justify-end gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#EA580C]" />
                      <span className="text-[11px] font-extrabold text-[#20312A]">Grade 2 · Moderate</span>
                    </div>
                  </foreignObject>

                  {/* Grade 1 · Mild (y=148) */}
                  <foreignObject x="0" y="138" width="148" height="20">
                    <div xmlns="http://www.w3.org/1999/xhtml" className="w-full h-full flex items-center justify-end gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#D97706]" />
                      <span className="text-[11px] font-medium text-[#475569]">Grade 1 · Mild</span>
                    </div>
                  </foreignObject>

                  {/* Grade 0 · No DR (y=188 — Checkmark removed) */}
                  <foreignObject x="0" y="178" width="148" height="20">
                    <div xmlns="http://www.w3.org/1999/xhtml" className="w-full h-full flex items-center justify-end gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#059669]" />
                      <span className="text-[11px] font-medium text-[#475569]">Grade 0 · No DR</span>
                    </div>
                  </foreignObject>

                  {/* Danger-aware area fill */}
                  <path d="M 200 188 L 320 148 L 440 148 L 560 108 L 680 108 L 680 188 L 200 188 Z" fill="url(#chartAreaGradDanger)" />

                  {/* Segmented stroke lines color-coded by severity transitions */}
                  {/* Gr0 → Gr1: emerald to gold */}
                  <path d="M 200 188 L 320 148" stroke="#047857" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  {/* Gr1 → Gr1: gold maintained */}
                  <path d="M 320 148 L 440 148" stroke="#B45309" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  {/* Gr1 → Gr2: gold to orange */}
                  <path d="M 440 148 L 560 108" stroke="#D97706" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  {/* Gr2 → Gr2: orange maintained */}
                  <path d="M 560 108 L 680 108" stroke="#EA580C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />

                  {/* Point 1: Jan 2024 (Grade 0) — emerald */}
                  <g className="cursor-pointer">
                    <line stroke="#E2E7E3" strokeWidth="1" x1="200" x2="200" y1="188" y2="200" />
                    <circle cx="200" cy="188" fill="#047857" r="6" stroke="#FFFFFF" strokeWidth="2.5" />
                  </g>

                  {/* Point 2: Apr 2024 (Grade 1) — gold */}
                  <g className="cursor-pointer">
                    <line stroke="#E2E7E3" strokeDasharray="2 2" strokeWidth="1" x1="320" x2="320" y1="148" y2="200" />
                    <circle cx="320" cy="148" fill="#B45309" r="6" stroke="#FFFFFF" strokeWidth="2.5" />
                  </g>

                  {/* Point 3: Jul 2024 (Grade 1) — gold */}
                  <g className="cursor-pointer">
                    <line stroke="#E2E7E3" strokeDasharray="2 2" strokeWidth="1" x1="440" x2="440" y1="148" y2="200" />
                    <circle cx="440" cy="148" fill="#B45309" r="6" stroke="#FFFFFF" strokeWidth="2.5" />
                  </g>

                  {/* Point 4: Oct 2024 (Grade 2 AI / Grade 1 Doc) — orange */}
                  <g className="cursor-pointer">
                    <line stroke="#E2E7E3" strokeDasharray="2 2" strokeWidth="1" x1="560" x2="560" y1="108" y2="200" />
                    <circle cx="560" cy="108" fill="#EA580C" r="6" stroke="#FFFFFF" strokeWidth="2.5" />
                  </g>

                  {/* Point 5: Jan 2025 (Latest, Grade 2) — orange with pulse ring */}
                  <g className="cursor-pointer">
                    <line stroke="#EA580C" strokeDasharray="2 2" strokeWidth="1.5" x1="680" x2="680" y1="108" y2="200" />
                    <circle cx="680" cy="108" fill="none" r="14" stroke="#EA580C" strokeOpacity="0.20" strokeWidth="3" />
                    <circle cx="680" cy="108" fill="#EA580C" fillOpacity="0.10" r="10" />
                    <circle cx="680" cy="108" fill="#EA580C" r="6.5" stroke="#FFFFFF" strokeWidth="2.5" />

                    {/* Light-themed tooltip */}
                    <g className="pointer-events-none">
                      <rect fill="#FFFFFF" stroke="#E2E7E3" strokeWidth="1" filter="drop-shadow(0 2px 8px rgba(32,49,42,0.12))" height="48" rx="8" width="160" x="600" y="44" />
                      <text fill="#20312A" fontSize="11px" fontWeight="bold" textAnchor="middle" x="680" y="62">Jan 2025 (Latest)</text>
                      <text fill="#EA580C" fontSize="10px" fontWeight="600" textAnchor="middle" x="680" y="80">Grade 2 · Moderate · 94%</text>
                    </g>
                  </g>

                  {/* X-Axis Labels */}
                  <text className="text-[12px] font-medium" fill="#66756D" textAnchor="middle" x="200" y="214">Jan 2024</text>
                  <text className="text-[12px] font-medium" fill="#66756D" textAnchor="middle" x="320" y="214">Apr 2024</text>
                  <text className="text-[12px] font-medium" fill="#66756D" textAnchor="middle" x="440" y="214">Jul 2024</text>
                  <text className="text-[12px] font-medium" fill="#66756D" textAnchor="middle" x="560" y="214">Oct 2024</text>
                  <text className="text-[12px] font-bold" fill="#EA580C" textAnchor="middle" x="680" y="214">Jan 2025</text>
                </svg>
              </div>
            </div>

            {/* Risk Trend Callout Strip + Protocol Footnote (integrated) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FFF7ED] border border-[#EA580C]/20">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EA580C] text-white text-xs font-bold shadow-xs">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Risk Trend: Increasing ↑
                </span>
                <span className="text-xs sm:text-sm text-[#20312A] font-medium">
                  Grade progressed from 0 to 2 over 5 visits · Specialist referral active
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#66756D] text-[11px]">
                <Info className="w-3.5 h-3.5 text-[#66756D] shrink-0" />
                <span>ETDRS Standard grading protocol</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION B: Screening History */}
        <section aria-labelledby="section-history-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 id="section-history-heading" className="text-lg font-bold text-slate-900 font-heading">
                Screening History
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Most recent first · Click any visit to inspect fundus, AI triage, and doctor clinical audit
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-[#285943] text-xs font-semibold shadow-xs self-start sm:self-auto">
              5 records · Last updated Jan 2025
            </span>
          </div>

          {/* Longitudinal Visits Timeline (Single Vertical Stroke, De-boxed) */}
          <div className="relative border-l-2 border-[#E2E7E3] ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-6 sm:space-y-8 my-3">
            {/* VISIT 1: 14 Jan 2025 (OD) */}
            <div className="relative group">
              {/* Timeline Stroke Node Marker */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full border-2 border-white bg-[#285943] ring-4 ring-[#285943]/15 shadow-xs" />

              {/* Clickable Header Row */}
              <div
                onClick={() => toggleVisit('2025-01')}
                className="py-2.5 px-3 -mx-3 rounded-xl hover:bg-slate-100/60 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#285943] text-white flex flex-col items-center justify-center font-bold text-center shrink-0 shadow-xs">
                    <span className="text-[10px] uppercase opacity-75 leading-none">JAN</span>
                    <span className="text-base font-extrabold leading-tight">14</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-slate-900">14 Jan 2025</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-semibold">
                        OD (Right Eye)
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#285943]/10 text-[#285943] text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#285943]"></span> Latest Visit
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Operator: HW Kavya N. • Zeiss Visucam 500 • PHC Hosakote
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      Grade 2 · Moderate DR
                    </span>
                    <span className="font-mono text-xs text-slate-500 font-medium">(94% conf)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold">
                      Doctor Accepted AI
                    </span>
                    <div className={`p-1 text-slate-400 transition-transform ${expandedVisits['2025-01'] ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Inspection Panel */}
              {expandedVisits['2025-01'] && (
                <div className="pt-3 pb-2 space-y-4">
                  {/* Quality & Assurance Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xs font-semibold text-slate-800">Fundus Acquisition Quality:</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 92% · Good Quality
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Grade 2 · Moderate NPDR
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                        Risk Level: HIGH
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Layers className="w-3.5 h-3.5 text-teal-600" />
                      <span>Ensemble: ResNet-50 + ViT</span>
                    </div>
                  </div>

                  {/* Dual Column Layout: Retinal Viewer (7 cols) + AI & Doctor Blocks (5 cols) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left: Retinal Viewer (Enlarged 50% for high clinical utility) */}
                    <div className="lg:col-span-7 flex flex-col space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Multimodal Fundus Inspection (OD)
                        </span>
                        {/* Layer Switcher Tabs (Segmented Controls) */}
                        <div className="bg-[#F1F5F9] p-1 rounded-lg inline-flex items-center gap-1 text-xs">
                          <button
                            type="button"
                            onClick={() => setActiveLayer('original')}
                            className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer font-medium ${
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
                            className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer font-medium ${
                              activeLayer === 'gradcam'
                                ? 'bg-white shadow-sm rounded-md text-[#20312A] font-semibold'
                                : 'text-[#66756D] hover:text-[#20312A]'
                            }`}
                          >
                            Grad-CAM Heatmap
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveLayer('vessels')}
                            className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer font-medium ${
                              activeLayer === 'vessels'
                                ? 'bg-white shadow-sm rounded-md text-[#20312A] font-semibold'
                                : 'text-[#66756D] hover:text-[#20312A]'
                            }`}
                          >
                            Vessel Segmentation
                          </button>
                        </div>
                      </div>

                      {/* SVG Canvas Container (Enlarged 50% for clinical reference) */}
                      <div className="relative w-full min-h-[420px] sm:min-h-[460px] aspect-[4/3] rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center shadow-lg">
                        {/* Layer 1: Original Fundus */}
                        <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${activeLayer === 'original' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                          <svg aria-label="Retinal fundus photo OD" className="w-full h-full object-cover" fill="none" viewBox="0 0 600 450">
                            <rect fill="#1A0B08" height="450" width="600" />
                            <circle cx="300" cy="225" fill="#8B2500" opacity="0.9" r="185" />
                            <circle cx="300" cy="225" fill="#A83200" r="170" />
                            <circle cx="195" cy="222" fill="#FFC266" r="38" />
                            <circle cx="195" cy="222" fill="#FFE8B3" r="26" />
                            <circle cx="375" cy="232" fill="#5A1800" opacity="0.6" r="28" />
                            <path d="M195 222 Q270 120 405 98" fill="none" stroke="#400A04" strokeWidth="6" />
                            <path d="M195 222 Q300 330 435 352" fill="none" stroke="#400A04" strokeWidth="6" />
                            <path d="M195 222 Q130 150 70 130" fill="none" stroke="#400A04" strokeWidth="5" />
                            <path d="M195 222 Q125 295 65 318" fill="none" stroke="#400A04" strokeWidth="5" />
                            <circle cx="338" cy="188" fill="#FF1A1A" r="6" />
                            <circle cx="368" cy="278" fill="#FF1A1A" r="5.5" />
                            <circle cx="315" cy="300" fill="#FF1A1A" r="5.5" />
                          </svg>
                          <span className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-black/80 text-white text-xs font-semibold backdrop-blur-xs border border-white/10">
                            45° Macula-Centered (OD) • ISO 100 • 50% Enlarged Clinical View
                          </span>
                        </div>

                        {/* Layer 2: Grad-CAM */}
                        <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${activeLayer === 'gradcam' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                          <svg aria-label="Grad-CAM heatmap" className="w-full h-full object-cover" fill="none" viewBox="0 0 600 450">
                            <rect fill="#0F172A" height="450" width="600" />
                            <circle cx="300" cy="225" fill="#1E293B" r="175" />
                            <ellipse cx="345" cy="210" fill="#EF4444" filter="blur(20px)" opacity="0.75" rx="68" ry="54" />
                            <ellipse cx="345" cy="210" fill="#FBBF24" filter="blur(12px)" opacity="0.85" rx="38" ry="30" />
                            <ellipse cx="345" cy="210" fill="#FFFFFF" filter="blur(4px)" opacity="0.95" rx="16" ry="14" />
                            <ellipse cx="322" cy="292" fill="#EF4444" filter="blur(15px)" opacity="0.6" rx="48" ry="36" />
                            <circle cx="195" cy="222" fill="none" r="24" stroke="#38BDF8" strokeDasharray="4 4" strokeWidth="3" />
                          </svg>
                          <span className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-black/80 text-teal-300 text-xs font-semibold backdrop-blur-xs border border-teal-500/20">
                            Grad-CAM Salience: Inferior-Temporal Microaneurysms
                          </span>
                        </div>

                        {/* Layer 3: Vessel Segmentation */}
                        <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${activeLayer === 'vessels' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                          <svg aria-label="Retinal vessel segmentation map" className="w-full h-full object-cover" fill="none" viewBox="0 0 600 450">
                            <rect fill="#020617" height="450" width="600" />
                            <circle cx="300" cy="225" fill="none" r="175" stroke="#1E293B" strokeWidth="2" />
                            <path d="M195 222 Q270 120 405 98" fill="none" stroke="#FFFFFF" strokeWidth="6" />
                            <path d="M270 120 Q322 82 375 60" fill="none" stroke="#CBD5E1" strokeWidth="3.5" />
                            <path d="M195 222 Q300 330 435 352" fill="none" stroke="#FFFFFF" strokeWidth="6" />
                            <path d="M300 330 Q352 382 412 405" fill="none" stroke="#CBD5E1" strokeWidth="3.5" />
                            <circle cx="339" cy="195" fill="none" r="14" stroke="#EA580C" strokeWidth="3" />
                            <circle cx="369" cy="279" fill="none" r="12" stroke="#EA580C" strokeWidth="3" />
                            <text fill="#EA580C" fontFamily="sans-serif" fontSize="13" fontWeight="bold" x="360" y="190">HE-01</text>
                          </svg>
                          <span className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-black/80 text-white text-xs font-semibold backdrop-blur-xs border border-white/10">
                            U-Net Segmenter: Vascular Tree + Lesion Ring
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: AI Screening Result vs Doctor Clinical Assessment */}
                    <div className="lg:col-span-5 flex flex-col space-y-3.5">
                      {/* BLOCK 1: AI Screening Result (Read-Only) */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-[#285943]" />
                            <span className="text-xs font-bold text-[#20312A] uppercase tracking-tight">AI Screening Result</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[#475569] text-[11px] font-semibold border border-slate-200">
                            AI Output · Read-Only
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                            <span>Grade 2 · Moderate NPDR</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Confidence:</span>
                            <span className="font-mono font-bold text-amber-700 text-lg leading-none">94%</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                            <span>Model Attention (ViT + ResNet)</span>
                            <span className="font-mono font-semibold text-[#285943]">94% Match</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '94%' }} />
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed pt-1">
                          Model attention concentrated on microaneurysms and early exudate clusters in inferior-temporal region of OD. Verified against ETDRS standard benchmarks.
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500">
                          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                          <span>AI screening supports clinical review and does not replace professional diagnosis.</span>
                        </div>
                      </div>

                      {/* BLOCK 2: Doctor Clinical Assessment (Authoritative Block) */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200 border-l-4 border-l-[#0D9488] shadow-sm space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-teal-700" />
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">Doctor Clinical Assessment</span>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-semibold">
                            <Check className="w-3 h-3 mr-1 text-teal-700" /> Doctor Accepted AI Result
                          </span>
                        </div>

                        {/* Clinician Confirmed Grade */}
                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Clinician Confirmed Grade:</span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                            <span>Grade 2 · Moderate NPDR</span>
                          </span>
                        </div>

                        {/* Clinician Observations */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Clinician Observations:</span>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            Reviewed fundus image and Grad-CAM attention. Microaneurysm cluster confirmed. Referral dispatched to Dr. Arjun Sharma.
                          </p>
                        </div>

                        {/* Care Plan */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Care Plan (Doctor-Confirmed):</span>
                          <div className="flex items-start gap-1.5 text-amber-800 font-semibold text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                            <span>Specialist ophthalmic evaluation recommended within 4 weeks.</span>
                          </div>
                        </div>

                        {/* Signoff */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-medium">Signed off by Dr. Arjun Sharma (Ophthalmologist)</span>
                          </div>
                        </div>
                      </div>

                      {/* Track Referral Button */}
                      <Link
                        to="/referrals"
                        className="w-full min-h-[44px] px-4 rounded-xl bg-gradient-to-r from-[#D9F99D] via-[#DCFCE7] to-[#CCFBF1] text-[#14532D] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 border border-[#A7F3D0] shadow-xs hover:brightness-105 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4 text-[#14532D]" />
                        <span>Track Referral on Board →</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* VISIT 2: 10 Oct 2024 (OS) - Clinically Adjusted */}
            <div className="relative group">
              {/* Timeline Stroke Node Marker */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full border-2 border-white bg-[#94A3B8] group-hover:bg-[#16866A] ring-4 ring-slate-100 shadow-xs transition-colors" />

              {/* Clickable Header Row */}
              <div
                onClick={() => toggleVisit('2024-10')}
                className="py-2.5 px-3 -mx-3 rounded-xl hover:bg-slate-100/60 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-200/80 text-slate-700 flex flex-col items-center justify-center font-bold text-center shrink-0">
                    <span className="text-[10px] uppercase opacity-75 leading-none">OCT</span>
                    <span className="text-base font-extrabold leading-tight">10</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-slate-900">10 Oct 2024</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-semibold">
                        OS (Left Eye)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold">
                        Clinician Adjusted
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Operator: HW Kavya N. • Forus 3nethra Classic • PHC Hosakote
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-2">
                    <span className="line-through text-slate-400 text-xs">AI: Gr.2</span>
                    <span className="text-slate-400 text-xs">→</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Doctor: Grade 1 (Mild)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
                      Override Confirmed
                    </span>
                    <div className={`p-1 text-slate-400 transition-transform ${expandedVisits['2024-10'] ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              {expandedVisits['2024-10'] && (
                <div className="pt-3 pb-2 space-y-4">
                  <div className="flex flex-col lg:flex-row gap-5 items-start">
                    {/* 50% Enlarged Clinical Retinal Thumbnail */}
                    <div className="w-full lg:w-48 h-48 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 shrink-0 relative shadow-sm group">
                      <svg className="w-full h-full object-cover select-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <rect fill="#0f0705" height="200" width="200" />
                        <circle cx="100" cy="100" fill="#9A3412" r="80" />
                        <circle cx="100" cy="100" fill="#B45309" r="68" />
                        <circle cx="135" cy="98" fill="#FED7AA" r="16" />
                        <circle cx="75" cy="104" fill="#451A03" opacity="0.65" r="13" />
                        <path d="M135 98 Q100 50 45 40" fill="none" stroke="#380904" strokeWidth="2.5" />
                        <path d="M135 98 Q105 145 50 155" fill="none" stroke="#380904" strokeWidth="2.5" />
                        <circle cx="85" cy="85" fill="#EF4444" r="2.5" />
                      </svg>
                      <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                        OS · 10 Oct 2024
                      </span>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      {/* Overruled AI Suggestion */}
                      <div className="p-4 rounded-xl bg-white border border-dashed border-slate-300 opacity-80 space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-700">AI Screening Suggestion</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium">Overridden by Doctor</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold line-through">
                          Grade 2 · Moderate NPDR (90% conf)
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Grad-CAM flagged high intensity near inferior nasal arcade as microaneurysm cluster.
                        </p>
                        <span className="text-[11px] text-slate-400 block pt-1">
                          AI supports screening; overruled upon expert fundus audit.
                        </span>
                      </div>

                      {/* Dominant Doctor Assessment */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200 border-l-4 border-l-amber-500 shadow-sm space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-amber-600" />
                            Doctor Clinical Assessment (Dominant)
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
                            Grade 1 · Mild DR Confirmed
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          <strong>Observation:</strong> "Artifact in inferior nasal quadrant misinterpreted by Grad-CAM as microaneurysm cluster. Real lesion count consistent with Mild NPDR only. No immediate hospital referral required; maintain 6-month PHC follow-up."
                        </p>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-teal-700">Care Plan: PHC Routine Monitoring in 6 months.</span>
                          <span>Dr. Arjun Sharma</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* VISIT 3: 02 Jul 2024 (OD) */}
            <div className="relative group">
              {/* Timeline Stroke Node Marker */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full border-2 border-white bg-[#94A3B8] group-hover:bg-[#16866A] ring-4 ring-slate-100 shadow-xs transition-colors" />

              {/* Clickable Header Row */}
              <div
                onClick={() => toggleVisit('2024-07')}
                className="py-2.5 px-3 -mx-3 rounded-xl hover:bg-slate-100/60 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-200/80 text-slate-700 flex flex-col items-center justify-center font-bold text-center shrink-0">
                    <span className="text-[10px] uppercase opacity-75 leading-none">JUL</span>
                    <span className="text-base font-extrabold leading-tight">02</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-slate-900">02 Jul 2024</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-semibold">
                        OD (Right Eye)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Operator: HW Ramesh B. • Zeiss Visucam 500 • PHC Hosakote
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Grade 1 · Mild DR
                    </span>
                    <span className="font-mono text-xs text-slate-500 font-medium">(92% conf)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                      Doctor Confirmed
                    </span>
                    <div className={`p-1 text-slate-400 transition-transform ${expandedVisits['2024-07'] ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              {expandedVisits['2024-07'] && (
                <div className="pt-3 pb-2 space-y-4">
                  <div className="flex flex-col lg:flex-row gap-5 items-start">
                    {/* 50% Enlarged Clinical Retinal Thumbnail */}
                    <div className="w-full lg:w-48 h-48 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 shrink-0 relative shadow-sm group">
                      <svg className="w-full h-full object-cover select-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <rect fill="#0f0705" height="200" width="200" />
                        <circle cx="100" cy="100" fill="#9A3412" r="80" />
                        <circle cx="100" cy="100" fill="#B45309" r="68" />
                        <circle cx="65" cy="98" fill="#FED7AA" r="16" />
                        <circle cx="125" cy="104" fill="#451A03" opacity="0.65" r="13" />
                        <path d="M65 98 Q100 50 155 40" fill="none" stroke="#380904" strokeWidth="2.5" />
                        <path d="M65 98 Q95 145 150 155" fill="none" stroke="#380904" strokeWidth="2.5" />
                        <circle cx="115" cy="85" fill="#EF4444" r="2" />
                      </svg>
                      <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                        OD · 02 Jul 2024
                      </span>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Clinical Recommendation</span>
                        <p className="text-xs font-bold text-slate-900">Follow-up in 6 months</p>
                        <p className="text-xs text-slate-600">Single isolated microaneurysm; HbA1c counselled by PHC medical officer.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">AI Model Confidence</span>
                          <span className="font-mono font-bold text-amber-700">92.0%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: '92%' }} />
                        </div>
                        <span className="text-[11px] text-slate-500">Quality Check: Clear optic disc and foveal view</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* VISIT 4: 18 Apr 2024 (OD) */}
            <div className="relative group">
              {/* Timeline Stroke Node Marker */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full border-2 border-white bg-[#94A3B8] group-hover:bg-[#16866A] ring-4 ring-slate-100 shadow-xs transition-colors" />

              {/* Clickable Header Row */}
              <div
                onClick={() => toggleVisit('2024-04')}
                className="py-2.5 px-3 -mx-3 rounded-xl hover:bg-slate-100/60 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-200/80 text-slate-700 flex flex-col items-center justify-center font-bold text-center shrink-0">
                    <span className="text-[10px] uppercase opacity-75 leading-none">APR</span>
                    <span className="text-base font-extrabold leading-tight">18</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-slate-900">18 Apr 2024</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-semibold">
                        OD (Right Eye)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Operator: HW Ramesh B. • Zeiss Visucam 500 • PHC Hosakote
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Grade 1 · Mild DR
                    </span>
                    <span className="font-mono text-xs text-slate-500 font-medium">(89% conf)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                      Screening Complete
                    </span>
                    <div className={`p-1 text-slate-400 transition-transform ${expandedVisits['2024-04'] ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              {expandedVisits['2024-04'] && (
                <div className="pt-3 pb-2 space-y-4">
                  <div className="flex flex-col lg:flex-row gap-5 items-start">
                    {/* 50% Enlarged Clinical Retinal Thumbnail */}
                    <div className="w-full lg:w-48 h-48 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 shrink-0 relative shadow-sm group">
                      <svg className="w-full h-full object-cover select-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <rect fill="#0f0705" height="200" width="200" />
                        <circle cx="100" cy="100" fill="#9A3412" r="80" />
                        <circle cx="100" cy="100" fill="#B45309" r="68" />
                        <circle cx="65" cy="98" fill="#FED7AA" r="16" />
                        <circle cx="125" cy="104" fill="#451A03" opacity="0.65" r="13" />
                        <path d="M65 98 Q100 50 155 40" fill="none" stroke="#380904" strokeWidth="2.5" />
                        <path d="M65 98 Q95 145 150 155" fill="none" stroke="#380904" strokeWidth="2.5" />
                        <circle cx="118" cy="120" fill="#EF4444" r="1.8" />
                      </svg>
                      <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                        OD · 18 Apr 2024
                      </span>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Clinical Recommendation</span>
                        <p className="text-xs font-bold text-slate-900">Routine monitoring</p>
                        <p className="text-xs text-slate-600">Initial transition detected from baseline Grade 0. Glycemic control review scheduled.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">AI Model Confidence</span>
                          <span className="font-mono font-bold text-amber-700">89.0%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: '89%' }} />
                        </div>
                        <span className="text-[11px] text-slate-500">Quality score: 98% pass on clarity criteria</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* VISIT 5: 12 Jan 2024 (OS) - Baseline */}
            <div className="relative group">
              {/* Timeline Stroke Node Marker */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full border-2 border-white bg-[#047857] ring-4 ring-emerald-100 shadow-xs" />

              {/* Clickable Header Row */}
              <div
                onClick={() => toggleVisit('2024-01')}
                className="py-2.5 px-3 -mx-3 rounded-xl hover:bg-slate-100/60 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-700 text-white flex flex-col items-center justify-center font-bold text-center shrink-0 shadow-xs">
                    <span className="text-[10px] uppercase opacity-75 leading-none">JAN</span>
                    <span className="text-base font-extrabold leading-tight">12</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-slate-900">12 Jan 2024</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-semibold">
                        OS (Left Eye)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-xs font-semibold border border-emerald-200">
                        Baseline Visit
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Operator: HW Ramesh B. • Forus 3nethra Classic • PHC Hosakote
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      Grade 0 · No DR
                    </span>
                    <span className="font-mono text-xs text-slate-500 font-medium">(96% conf)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                      Screening Complete
                    </span>
                    <div className={`p-1 text-slate-400 transition-transform ${expandedVisits['2024-01'] ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              {expandedVisits['2024-01'] && (
                <div className="pt-3 pb-2 space-y-4">
                  <div className="flex flex-col lg:flex-row gap-5 items-start">
                    {/* 50% Enlarged Clinical Retinal Thumbnail */}
                    <div className="w-full lg:w-48 h-48 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 shrink-0 relative shadow-sm group">
                      <svg className="w-full h-full object-cover select-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <rect fill="#0f0705" height="200" width="200" />
                        <circle cx="100" cy="100" fill="#9A3412" r="80" />
                        <circle cx="100" cy="100" fill="#B45309" r="68" />
                        <circle cx="135" cy="98" fill="#FED7AA" r="16" />
                        <circle cx="75" cy="104" fill="#451A03" opacity="0.65" r="13" />
                        <path d="M135 98 Q100 50 45 40" fill="none" stroke="#380904" strokeWidth="2.5" />
                        <path d="M135 98 Q105 145 50 155" fill="none" stroke="#380904" strokeWidth="2.5" />
                        {/* Normal fundus - no microaneurysms */}
                      </svg>
                      <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-emerald-400 font-semibold">
                        OS · Baseline Normal
                      </span>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Clinical Recommendation</span>
                        <p className="text-xs font-bold text-slate-900">Annual screening</p>
                        <p className="text-xs text-slate-600">Normal baseline screening. No microaneurysms, hemorrhages, or exudates observed.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">AI Model Confidence</span>
                          <span className="font-mono font-bold text-emerald-700">96.4%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: '96.4%' }} />
                        </div>
                        <span className="text-[11px] text-slate-500">Verified by PHC Medical Officer</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Clinical A4 Printable Report Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#FFFFFF] rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-[#E2E7E3] shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 text-[#20312A] max-h-[92vh] overflow-y-auto">
            {/* Modal Top Chrome: DRISHTI Logo & Header */}
            <div className="flex items-start justify-between border-b border-[#E2E7E3] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full p-2 bg-gradient-to-br from-[#E6F4EA] to-[#CCFBF1] text-[#047857] flex items-center justify-center shadow-xs shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold tracking-tight text-[#20312A] font-heading">DRISHTI</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#047857]">
                      Clinical Tele-Retina
                    </span>
                  </div>
                  <p className="text-xs text-[#66756D]">
                    National Tele-Ophthalmology Network · Longitudinal Patient Assessment Report
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Demographics Grid */}
            <div className="bg-[#F8FAF7] rounded-xl border border-[#E2E7E3] p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#66756D] block">Patient Name</span>
                <span className="font-bold text-[#20312A] text-sm">Anitha R.</span>
                <span className="text-[11px] text-[#66756D] block">52 Y · Female</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#66756D] block">Patient ID / ABHA</span>
                <span className="font-mono font-semibold text-[#20312A]">{activePatientId}</span>
                <span className="text-[10px] font-mono text-[#66756D] block">91-4829-1049-2210</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#66756D] block">Care History</span>
                <span className="font-medium text-[#20312A]">Type II DM (8 yrs)</span>
                <span className="text-[11px] text-[#66756D] block">HbA1c: 8.2% · Medicated</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#66756D] block">Primary Facility</span>
                <span className="font-medium text-[#20312A]">PHC Hosakote</span>
                <span className="text-[11px] text-[#66756D] block">Bangalore Rural Network</span>
              </div>
            </div>

            {/* 5-Visit Trend Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#20312A] font-heading">
                  5-Visit Longitudinal DR Progression
                </h4>
                <span className="text-[11px] text-[#66756D] font-medium">Jan 2024 – Jan 2025</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#E2E7E3]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8FAF7] text-[#66756D] text-[10px] font-semibold uppercase border-b border-[#E2E7E3]">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-2">Eye</th>
                      <th className="py-2 px-3">AI Grade</th>
                      <th className="py-2 px-3">Doctor Assessment</th>
                      <th className="py-2 px-3 text-right">Care Plan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E7E3] text-xs">
                    <tr>
                      <td className="py-2 px-3 font-medium text-[#20312A]">15 Jan 2025</td>
                      <td className="py-2 px-2 font-mono text-[#66756D]">OD</td>
                      <td className="py-2 px-3"><GradeBadge grade={2} /></td>
                      <td className="py-2 px-3 font-semibold text-[#0D9488]">Accepted Gr.2</td>
                      <td className="py-2 px-3 text-right text-red-700 font-bold">Referral to Apex</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-[#20312A]">10 Oct 2024</td>
                      <td className="py-2 px-2 font-mono text-[#66756D]">OS</td>
                      <td className="py-2 px-3"><GradeBadge grade={1} /></td>
                      <td className="py-2 px-3 text-[#66756D]">Doctor Overrule (Gr.1)</td>
                      <td className="py-2 px-3 text-right text-[#66756D]">Routine 6-mo follow-up</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-[#20312A]">02 Jul 2024</td>
                      <td className="py-2 px-2 font-mono text-[#66756D]">OD</td>
                      <td className="py-2 px-3"><GradeBadge grade={1} /></td>
                      <td className="py-2 px-3 text-[#66756D]">Accepted Gr.1</td>
                      <td className="py-2 px-3 text-right text-[#66756D]">Routine monitoring</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-[#20312A]">18 Apr 2024</td>
                      <td className="py-2 px-2 font-mono text-[#66756D]">OS</td>
                      <td className="py-2 px-3"><GradeBadge grade={1} /></td>
                      <td className="py-2 px-3 text-[#66756D]">Accepted Gr.1</td>
                      <td className="py-2 px-3 text-right text-[#66756D]">Routine monitoring</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-[#20312A]">12 Jan 2024</td>
                      <td className="py-2 px-2 font-mono text-[#66756D]">OD</td>
                      <td className="py-2 px-3"><GradeBadge grade={0} /></td>
                      <td className="py-2 px-3 text-[#047857] font-semibold">Baseline Verified</td>
                      <td className="py-2 px-3 text-right text-[#66756D]">Annual re-screen</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fundus Thumbnail Preview & Findings */}
            <div className="p-3.5 rounded-xl bg-[#F8FAF7] border border-[#E2E7E3] flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-24 h-24 rounded-lg bg-slate-950 overflow-hidden border border-slate-800 shrink-0 relative shadow-xs">
                <svg className="w-full h-full object-cover select-none" viewBox="0 0 200 200">
                  <rect fill="#1A0B08" height="200" width="200" />
                  <circle cx="100" cy="100" fill="#8B2500" opacity="0.9" r="80" />
                  <circle cx="100" cy="100" fill="#A83200" r="72" />
                  <circle cx="65" cy="98" fill="#FFC266" r="16" />
                  <circle cx="130" cy="102" fill="#5A1800" opacity="0.6" r="12" />
                  <path d="M65 98 Q95 50 145 42" fill="none" stroke="#400A04" strokeWidth="2.5" />
                  <path d="M65 98 Q105 145 150 152" fill="none" stroke="#400A04" strokeWidth="2.5" />
                  <circle cx="118" cy="85" fill="#FF1A1A" r="3" />
                  <circle cx="128" cy="120" fill="#FF1A1A" r="2.5" />
                </svg>
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono text-white">
                  OD · 15 Jan
                </span>
              </div>
              <div className="space-y-1 text-xs text-[#20312A] flex-1">
                <div className="font-bold flex items-center gap-2">
                  <span>Latest Fundus Inspection (15 Jan 2025)</span>
                  <span className="text-[10px] font-mono text-[#0D9488] bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded font-semibold">
                    94% Model Confidence
                  </span>
                </div>
                <p className="text-[#66756D] leading-relaxed">
                  Inferotemporal microaneurysms and early hard exudates confirmed. Grad-CAM salience concordant with ETDRS Grade 2 Moderate NPDR criteria.
                </p>
                <div className="text-[11px] text-[#20312A] font-semibold pt-0.5">
                  Attending Clinician: Dr. Arjun Sharma (KMC-44819) · Confirmed &amp; Signed
                </div>
              </div>
            </div>

            {/* Care Instructions */}
            <div className="p-3.5 rounded-xl bg-teal-50/70 border border-[#0D9488]/30 space-y-1 text-xs">
              <div className="font-bold text-[#0D9488] uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Care Instructions &amp; Referral Action Plan</span>
              </div>
              <p className="text-[#20312A] leading-relaxed">
                Referred to <strong>Apex Eye Hospital (Dr. Arjun Sharma)</strong> for dilated fundus examination and optical coherence tomography within 4 weeks. Patient advised to maintain glycemic target (HbA1c &lt; 7.0%) and monitor blood pressure bi-weekly at PHC.
              </p>
            </div>

            {/* Medical Disclaimer */}
            <div className="flex items-start gap-2 text-[10px] text-[#66756D] leading-relaxed border-t border-[#E2E7E3] pt-3">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p>
                <strong>Medical Disclaimer:</strong> This clinical document is produced under the National Tele-Ophthalmology Screening Protocol. AI outputs serve as clinical decision support for licensed medical practitioners and do not substitute for definitive ophthalmic examination.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2E7E3]">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-[#F8FAF7] border border-[#E2E7E3] text-[#20312A] text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExportModalOpen(false)
                  window.print()
                  showToast(`Clinical summary sent to print for ${activePatientId}`)
                }}
                className="btn-gradient-pill min-h-[44px] px-6 py-2.5 text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-xs hover:brightness-105 hover:shadow-md transition-all cursor-pointer"
              >
                <span>🖨️ Print Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
