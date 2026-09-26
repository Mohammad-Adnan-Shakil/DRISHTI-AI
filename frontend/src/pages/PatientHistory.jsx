import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
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
  Activity,
  Layers,
  Award,
  AlertCircle,
  Loader2,
  Printer,
  ShieldCheck
} from 'lucide-react'
import Navbar from '../components/Navbar'
import GradeBadge from '../components/GradeBadge'
import Skeleton from '../components/Skeleton'
import PatientHistoryPDF from '../components/PatientHistoryPDF'
import { apiAssetUrl, getPatient, getPatientHistory } from '../lib/api'
import { cn, RISK_TIER_STYLES } from '../lib/utils'
import { exportNodeToPdf, sanitizeFilenameSegment } from '../lib/pdfExport'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const GRADE_LABELS = { 0: 'No DR', 1: 'Mild NPDR', 2: 'Moderate NPDR', 3: 'Severe NPDR', 4: 'Proliferative DR' }
const GRADE_LINE_COLORS = { 0: '#047857', 1: '#B45309', 2: '#EA580C', 3: '#DC2626', 4: '#991B1B' }

const formatVisitDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
const formatMonthYear = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

const formatAuditTimestamp = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const day = d.getDate()
  const month = d.toLocaleDateString('en-GB', { month: 'short' })
  const year = d.getFullYear()
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${day} ${month} ${year}, ${time}`
}

function SystemAuditTrail({ drGrade, doctorGrade, doctorNotes, doctorName, reviewedAt, reviewed }) {
  const isReviewed = Boolean(reviewed || (doctorGrade != null))
  const isOverridden = isReviewed && doctorGrade != null && Number(doctorGrade) !== Number(drGrade)
  const rawName = doctorName || 'Dr. Arjun Sharma'
  const formattedDoctor = rawName.startsWith('Dr.') ? rawName : `Dr. ${rawName}`
  const formattedTime = formatAuditTimestamp(reviewedAt)

  return (
    <div className="p-3.5 rounded-xl bg-[#F8FAF7] border border-[#E2E7E3] space-y-2 text-[#475569]">
      <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E7E3]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#20312A] uppercase tracking-tight">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16866A]" />
          <span>System Audit Trail</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 text-[#475569] font-semibold">
          SECURE LOG · READ-ONLY
        </span>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="font-semibold text-slate-800">
            {isOverridden
              ? `Clinical Override Applied by ${formattedDoctor}`
              : isReviewed
              ? `No override — AI grade confirmed by ${formattedDoctor}`
              : 'Pending Doctor Review — AI screening recorded'}
          </span>
          {formattedTime && (
            <span className="font-mono text-[11px] text-[#475569]">{formattedTime}</span>
          )}
        </div>
        {isOverridden && (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-slate-700">Detail:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#E2E7E3] text-slate-800 font-bold">
              AI Grade: {drGrade} → Doctor Grade: {doctorGrade}
            </span>
          </div>
        )}
        {Boolean(doctorNotes && String(doctorNotes).trim()) && (
          <div className="text-[11px] leading-relaxed text-[#475569] bg-white/80 p-2.5 rounded-lg border border-[#E2E7E3]">
            <span className="font-semibold text-slate-700">Notes: </span>
            "{doctorNotes}"
          </div>
        )}
      </div>
    </div>
  )
}

const getImageUrl = apiAssetUrl

export default function PatientHistory() {
  const navigate = useNavigate()
  const { patientId } = useParams()
  const activePatientId = patientId || 'DRI-2026-00421'

  // Risk Score tier is only available for real, API-backed patients
  // (numeric IDs from POST /api/patient) — demo/mock patient IDs have none.
  const [apiPatient, setApiPatient] = useState(null)
  const [apiScreeningHistory, setApiScreeningHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState(null)
  const [retryToken, setRetryToken] = useState(0)

  const isDemoPatient = !/^\d+$/.test(activePatientId)

  useEffect(() => {
    if (isDemoPatient) {
      setLoadingHistory(false)
      setHistoryError(null)
      return
    }
    setLoadingHistory(true)
    setHistoryError(null)
    setApiPatient(null)
    setApiScreeningHistory([])
    let cancelled = false
    Promise.all([getPatient(activePatientId), getPatientHistory(activePatientId)])
      .then(([patient, history]) => {
        if (cancelled) return
        setApiPatient(patient)
        setApiScreeningHistory(Array.isArray(history) ? history : [])
        setLoadingHistory(false)
      })
      .catch(err => {
        if (cancelled) return
        console.error('Patient history fetch failed:', err)
        setHistoryError('Could not load patient history. Please retry.')
        setLoadingHistory(false)
      })
    return () => { cancelled = true }
  }, [activePatientId, retryToken, isDemoPatient])

  // Most recent screening (server already orders history by created_at desc)
  // — drives the real fundus/Grad-CAM images in VISIT 1's viewer below.
  const latestScreening = apiScreeningHistory[0] || null
  const hasRealHistory = apiScreeningHistory.length > 0

  // Chronological (oldest-first) order for the DR Grade Over Time chart.
  const CHART_X_START = 200
  const CHART_X_END = 680
  const CHART_Y_ZERO = 188
  const CHART_Y_STEP = 40
  const chartPoints = hasRealHistory
    ? [...apiScreeningHistory].reverse().map((s, i, arr) => ({
        x: arr.length > 1 ? CHART_X_START + (i * (CHART_X_END - CHART_X_START)) / (arr.length - 1) : (CHART_X_START + CHART_X_END) / 2,
        y: CHART_Y_ZERO - (s.dr_grade ?? 0) * CHART_Y_STEP,
        grade: s.dr_grade ?? 0,
        confidence: s.dr_confidence,
        dateIso: s.date,
        monthYear: formatMonthYear(s.date),
        color: GRADE_LINE_COLORS[s.dr_grade] ?? '#047857',
      }))
    : []
  const chartAreaPath = chartPoints.length > 1
    ? `M ${chartPoints[0].x} ${CHART_Y_ZERO} L ${chartPoints.map(p => `${p.x} ${p.y}`).join(' L ')} L ${chartPoints[chartPoints.length - 1].x} ${CHART_Y_ZERO} Z`
    : ''

  const [activeLayer, setActiveLayer] = useState('original') // 'original' | 'gradcam' | 'vessels'
  const [expandedVisits, setExpandedVisits] = useState({
    '2025-01': true,
    '2024-10': false,
    '2024-07': false,
    '2024-04': false,
    '2024-01': false,
  })
  const [toastMessage, setToastMessage] = useState(null)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [showPrintReportModal, setShowPrintReportModal] = useState(false)
  const pdfRef = useRef(null)
  const modalPdfRef = useRef(null)

  // Demographics — real for API-backed patients (numeric IDs), the page's
  // demo values otherwise. The visit timeline and DR Grade chart below use
  // real screening history (getPatientHistory) when available; the summary
  // stat cards above them stay demo content either way.
  const displayPatient = {
    name: apiPatient?.name || 'Anitha R.',
    initials: apiPatient?.name
      ? apiPatient.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : 'AR',
    ageGender: apiPatient?.age != null && apiPatient?.gender
      ? `${apiPatient.age} yrs • ${apiPatient.gender}`
      : '52 yrs • Female',
    phc: apiPatient?.phc_id || 'PHC Hosakote',
    abhaId: apiPatient ? '—' : '91-4829-1049-2210',
    diabetesDuration: apiPatient?.diabetes_duration_years != null ? `${apiPatient.diabetes_duration_years} Years` : '8 Years',
    hba1c: apiPatient?.hba1c_level != null ? `${apiPatient.hba1c_level}%` : '7.8%',
    hba1cElevated: apiPatient?.hba1c_level != null ? apiPatient.hba1c_level > 7 : true,
    hypertension: apiPatient ? (apiPatient.hypertension ? 'Yes' : 'No') : 'Yes',
    familyHistory: apiPatient ? (apiPatient.family_history_dr ? 'Positive' : 'Negative') : 'Negative',
    preferredLanguage: apiPatient?.preferred_language || 'Kannada',
  }

  // Display name — kept as a separate binding for the PDF filename/toast.
  const patientDisplayName = displayPatient.name

  const patientForPdf = {
    id: activePatientId,
    name: displayPatient.name,
    ageGender: displayPatient.ageGender,
    phc: displayPatient.phc
  }

  // Dynamic history data for PDF export
  const historyDataForPdf = hasRealHistory
    ? apiScreeningHistory.map(s => ({
        date: formatVisitDate(s.date),
        eye: 'OD',
        grade: s.dr_grade,
        doctorAssessment: !s.reviewed
          ? `AI Screened (Gr.${s.dr_grade})`
          : (s.ophthalmologist_grade != null && s.ophthalmologist_grade !== s.dr_grade)
          ? `Doctor Overruled (Gr.${s.ophthalmologist_grade})`
          : `Doctor Accepted AI (Gr.${s.ophthalmologist_grade ?? s.dr_grade})`,
        carePlan: s.referral_recommended ? 'Referral Recommended' : 'Routine monitoring'
      }))
    : [
        { date: '14 Jan 2025', eye: 'OD', grade: 2, doctorAssessment: 'Doctor Accepted AI (Gr.2)', carePlan: 'Referral to Apex Eye Hospital' },
        { date: '10 Oct 2024', eye: 'OS', grade: 1, doctorAssessment: 'Doctor Overrule (Gr.1)', carePlan: 'Routine 6-month follow-up' },
        { date: '02 Jul 2024', eye: 'OD', grade: 1, doctorAssessment: 'Doctor Accepted AI (Gr.1)', carePlan: 'Routine monitoring' },
        { date: '18 Apr 2024', eye: 'OD', grade: 1, doctorAssessment: 'Doctor Accepted AI (Gr.1)', carePlan: 'Routine monitoring' },
        { date: '12 Jan 2024', eye: 'OS', grade: 0, doctorAssessment: 'Baseline Verified', carePlan: 'Annual re-screen' },
      ]

  const chartDataForPdf = hasRealHistory
    ? chartPoints.map(p => ({ date: p.monthYear, grade: p.grade }))
    : [
        { date: 'Jan 2024', grade: 0 },
        { date: 'Apr 2024', grade: 1 },
        { date: 'Jul 2024', grade: 1 },
        { date: 'Oct 2024', grade: 1 },
        { date: 'Jan 2025', grade: 2 },
      ]

  const latestAssessmentForPdf = hasRealHistory && latestScreening
    ? {
        eye: 'OD',
        date: formatVisitDate(latestScreening.date),
        confidence: latestScreening.dr_confidence != null ? Math.round(latestScreening.dr_confidence) : 90,
        findings: `Grade ${latestScreening.dr_grade} (${GRADE_LABELS[latestScreening.dr_grade] || 'DR'}). Referral ${latestScreening.referral_recommended ? 'recommended' : 'not required'}.`,
        carePlan: latestScreening.referral_recommended ? 'Referred to specialist evaluation.' : 'Annual routine follow-up recommended.'
      }
    : {
        eye: 'OD',
        date: '14 Jan 2025',
        confidence: 94,
        findings: 'Inferotemporal microaneurysms and early hard exudates confirmed. Grad-CAM salience concordant with ETDRS Grade 2 Moderate NPDR criteria.',
        carePlan: 'Referred to Apex Eye Hospital (Dr. Arjun Sharma) for dilated fundus examination and optical coherence tomography within 4 weeks. Patient advised to maintain glycemic target (HbA1c < 7.0%) and monitor blood pressure bi-weekly at PHC.'
      }

  const handleExportSummaryPdf = async () => {
    if (isExportingPdf) return
    setIsExportingPdf(true)
    try {
      const filenameSafeName = sanitizeFilenameSegment(patientDisplayName)
      const targetNode = modalPdfRef.current || pdfRef.current
      await exportNodeToPdf(targetNode, `DRISHTI_History_${filenameSafeName}.pdf`)
      showToast(`Patient summary exported as clinical PDF (${activePatientId}.pdf)`)
    } catch (err) {
      console.error('Export patient history PDF failed:', err)
      showToast('PDF export failed — please try again.')
    } finally {
      setIsExportingPdf(false)
    }
  }

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

  if (loadingHistory) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A]">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(item => <Skeleton key={item} className="h-20 w-full" />)}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    )
  }

  if (historyError) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A]">
        <Navbar />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div role="alert" className="bg-white rounded-xl border border-amber-200 p-8 text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-amber-600 mb-3" />
            <h1 className="text-lg font-bold text-[#20312A]">Patient history unavailable</h1>
            <p className="text-sm text-[#66756D] mt-2">{historyError}</p>
            <button type="button" onClick={() => setRetryToken(value => value + 1)} className="btn-secondary mt-5 text-sm">
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (!isDemoPatient && apiScreeningHistory.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A]">
        <Navbar />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <FileCheck className="w-10 h-10 mx-auto text-[#66756D] mb-3" />
            <h1 className="text-lg font-bold text-[#20312A]">No screening history</h1>
            <p className="text-sm text-[#66756D] mt-2">No screening records are available for this patient.</p>
            <Link to="/screening" className="btn-gradient-pill mt-5 text-sm">Start New Screening</Link>
          </div>
        </main>
      </div>
    )
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
              <span className="text-slate-900 font-semibold">{displayPatient.name} ({activePatientId})</span>
            </nav>
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
                {displayPatient.initials}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                    {displayPatient.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded bg-[#285943]/10 border border-[#285943]/20 text-[#285943] font-mono text-xs font-semibold">
                    {activePatientId}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Active Cohort
                  </span>
                  {apiPatient?.risk_tier && (
                    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-bold', RISK_TIER_STYLES[apiPatient.risk_tier])}>
                      {apiPatient.risk_tier}
                      {apiPatient.risk_score_total != null && (
                        <span className="font-mono font-semibold opacity-80">({apiPatient.risk_score_total}/18)</span>
                      )}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  {displayPatient.ageGender} • {displayPatient.phc} • Primary ABHA ID: <span className="font-mono text-slate-700 font-medium">{displayPatient.abhaId}</span>
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowPrintReportModal(true)}
                className="h-10 px-4 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-[#285943] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors border border-slate-200 shadow-2xs cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#285943]" />
                <span>Print Report</span>
              </button>
              <button
                type="button"
                onClick={handleExportSummaryPdf}
                disabled={isExportingPdf}
                className="h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#285943] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{isExportingPdf ? 'Exporting...' : 'Export Summary'}</span>
              </button>
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
              <span className="text-sm text-slate-900 mt-1 font-bold">{displayPatient.diabetesDuration}</span>
            </div>
            <div className={cn('p-3 rounded-lg border flex flex-col', displayPatient.hba1cElevated ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200')}>
              <span className={cn('text-[10px] uppercase tracking-wider font-semibold', displayPatient.hba1cElevated ? 'text-amber-800' : 'text-slate-500')}>Latest HbA1c</span>
              <div className="flex items-center gap-1 mt-1">
                <span className={cn('text-sm font-bold', displayPatient.hba1cElevated ? 'text-amber-900' : 'text-slate-900')}>{displayPatient.hba1c}</span>
                {displayPatient.hba1cElevated && <span className="text-xs font-bold text-amber-700">↑</span>}
              </div>
              <span className={cn('text-[11px] font-medium', displayPatient.hba1cElevated ? 'text-amber-800' : 'text-slate-500')}>{displayPatient.hba1cElevated ? 'Elevated Glycemic' : 'Controlled'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Hypertension</span>
              <span className="text-sm text-slate-900 mt-1 font-bold">{displayPatient.hypertension}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Family DR History</span>
              <span className="text-sm text-slate-900 mt-1 font-bold">{displayPatient.familyHistory}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Preferred Lang</span>
              <span className="text-sm text-slate-900 mt-1 font-bold">{displayPatient.preferredLanguage}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Last Screened</span>
              <span className="text-sm text-slate-900 mt-1 font-bold">
                {hasRealHistory && latestScreening ? formatVisitDate(latestScreening.date) : '14 Jan 2025'}
              </span>
              <span className="text-[11px] text-slate-500">{displayPatient.phc}</span>
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
              <span className="text-3xl font-extrabold text-[#285943] font-heading">
                {hasRealHistory ? apiScreeningHistory.length : 5}
              </span>
              <p className="text-xs text-slate-500 mt-1">Across PHC network</p>
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
              <GradeBadge grade={hasRealHistory && latestScreening ? latestScreening.dr_grade : 2} />
              <p className="text-xs text-slate-500 mt-2">
                {hasRealHistory && latestScreening
                  ? `Grade ${latestScreening.dr_grade} · ${GRADE_LABELS[latestScreening.dr_grade] ?? 'DR'}`
                  : 'Salient microaneurysms detected'}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-slate-600 text-xs font-medium">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>
                AI Confidence: {hasRealHistory && latestScreening?.dr_confidence != null ? `${Math.round(latestScreening.dr_confidence)}%` : '94%'}
              </span>
            </div>
          </div>

          {/* Card 3: Longitudinal Trend */}
          {(() => {
            const first = hasRealHistory && chartPoints.length > 0 ? chartPoints[0].grade : 0
            const last = hasRealHistory && latestScreening ? latestScreening.dr_grade : 2
            const isProg = last > first
            const isImp = last < first
            const trendLabel = isProg ? 'Progressive ↑' : isImp ? 'Improving ↓' : 'Stable →'
            return (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Longitudinal Trend</span>
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs', isProg ? 'bg-orange-100 text-orange-900' : isImp ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-800')}>
                    <span>{trendLabel}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {hasRealHistory
                      ? `Grade ${first} → Grade ${last} (${apiScreeningHistory.length} visit${apiScreeningHistory.length !== 1 ? 's' : ''})`
                      : 'Shifted from Grade 1 (Mild) in 2024'}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-orange-700 text-xs font-semibold">
                  <Activity className="w-4 h-4" />
                  <span>Interval: {isProg ? 'Shortened to 6 mo' : 'Standard 12 mo'}</span>
                </div>
              </div>
            )
          })()}

          {/* Card 4: Referral Status */}
          {(() => {
            const isRefRec = hasRealHistory && latestScreening ? latestScreening.referral_recommended : true
            const isRev = hasRealHistory && latestScreening ? latestScreening.reviewed : false
            const statusLabel = !isRefRec ? 'No Referral Needed' : isRev ? 'Reviewed by Doctor' : 'Active • Pending Review'
            const statusBg = !isRefRec ? 'bg-emerald-100 text-emerald-900' : isRev ? 'bg-teal-100 text-teal-900' : 'bg-amber-100 text-amber-900'
            const statusDot = !isRefRec ? 'bg-emerald-500' : isRev ? 'bg-teal-500' : 'bg-amber-500'
            return (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Referral Status</span>
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs ${statusBg}`}>
                    <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
                    <span>{statusLabel}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {isRefRec ? 'Dispatched to Specialist Network' : 'Routine monitoring at PHC'}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-600 font-medium">
                  <Building className="w-3.5 h-3.5 text-[#16866A] shrink-0" />
                  <span className="truncate">Apex Eye Hospital, Bangalore</span>
                </div>
              </div>
            )
          })()}
        </div>

        {/* SECTION A: DR Grade Over Time Progression */}
        <section aria-labelledby="section-progression-heading" className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 id="section-progression-heading" className="text-lg font-bold text-[#20312A] font-heading">
                DR Grade Over Time
              </h2>
              <p className="text-xs sm:text-sm text-[#66756D]">
                {hasRealHistory
                  ? `AI-assisted screening grades across ${chartPoints.length} longitudinal visit${chartPoints.length !== 1 ? 's' : ''}`
                  : 'AI-assisted screening grades across 5 longitudinal visits'}
              </p>
            </div>
            <span className="font-mono text-xs text-[#285943] bg-[#285943]/10 border border-[#285943]/20 px-2.5 py-1 rounded shadow-xs font-semibold self-start sm:self-auto">
              {hasRealHistory && chartPoints.length > 0
                ? `Baseline: Grade ${chartPoints[0].grade} (${chartPoints[0].monthYear}) → Current: Grade ${chartPoints[chartPoints.length - 1].grade} (${chartPoints[chartPoints.length - 1].monthYear})`
                : 'Baseline: Grade 0 (Jan 2024) → Current: Grade 2 (Jan 2025)'}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] space-y-5">
            {/* Interactive SVG Line Chart */}
            <div className="relative w-full overflow-x-auto p-4 sm:p-6 bg-[#F8FAF7]/40 rounded-xl border border-[#E2E7E3]">
              <div className="min-w-full sm:min-w-[620px]">
                <svg
                  aria-label={hasRealHistory
                    ? `Longitudinal DR Grade Over Time chart across ${chartPoints.length} visits`
                    : 'Longitudinal DR Grade Over Time chart across 5 visits from Jan 2024 to Jan 2025'}
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

                  {hasRealHistory && chartPoints.length > 0 ? (
                    <>
                      {/* Danger-aware area fill */}
                      {chartAreaPath && <path d={chartAreaPath} fill="url(#chartAreaGradDanger)" />}

                      {/* Segmented stroke lines, colored by the arriving grade */}
                      {chartPoints.slice(1).map((p, i) => (
                        <path
                          key={`seg-${i}`}
                          d={`M ${chartPoints[i].x} ${chartPoints[i].y} L ${p.x} ${p.y}`}
                          stroke={p.color}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                        />
                      ))}

                      {/* Points */}
                      {chartPoints.map((p, i) => {
                        const isLast = i === chartPoints.length - 1
                        const tooltipX = Math.min(Math.max(p.x - 80, 165), 555)
                        return (
                          <g key={`pt-${i}`} className="cursor-pointer">
                            <line
                              stroke={isLast ? p.color : '#E2E7E3'}
                              strokeDasharray={isLast ? '2 2' : i === 0 ? undefined : '2 2'}
                              strokeWidth={isLast ? '1.5' : '1'}
                              x1={p.x} x2={p.x} y1={p.y} y2="200"
                            />
                            {isLast && (
                              <>
                                <circle cx={p.x} cy={p.y} fill="none" r="14" stroke={p.color} strokeOpacity="0.20" strokeWidth="3" />
                                <circle cx={p.x} cy={p.y} fill={p.color} fillOpacity="0.10" r="10" />
                              </>
                            )}
                            <circle cx={p.x} cy={p.y} fill={p.color} r={isLast ? 6.5 : 6} stroke="#FFFFFF" strokeWidth="2.5" />
                            {isLast && (
                              <g className="pointer-events-none">
                                <rect fill="#FFFFFF" stroke="#E2E7E3" strokeWidth="1" filter="drop-shadow(0 2px 8px rgba(32,49,42,0.12))" height="48" rx="8" width="160" x={tooltipX} y="44" />
                                <text fill="#20312A" fontSize="11px" fontWeight="bold" textAnchor="middle" x={p.x} y="62">{formatVisitDate(p.dateIso)} (Latest)</text>
                                <text fill={p.color} fontSize="10px" fontWeight="600" textAnchor="middle" x={p.x} y="80">
                                  Grade {p.grade} · {GRADE_LABELS[p.grade] ?? 'Unknown'}{p.confidence != null ? ` · ${Math.round(p.confidence)}%` : ''}
                                </text>
                              </g>
                            )}
                          </g>
                        )
                      })}

                      {/* X-Axis Labels */}
                      {chartPoints.map((p, i) => {
                        const isLast = i === chartPoints.length - 1
                        return (
                          <text
                            key={`lbl-${i}`}
                            className={isLast ? 'text-[12px] font-bold' : 'text-[12px] font-medium'}
                            fill={isLast ? p.color : '#66756D'}
                            textAnchor="middle"
                            x={p.x}
                            y="214"
                          >
                            {p.monthYear}
                          </text>
                        )
                      })}
                    </>
                  ) : (
                    <>
                      {/* Danger-aware area fill */}
                      <path d="M 200 188 L 320 148 L 440 148 L 560 108 L 680 108 L 680 188 L 200 188 Z" fill="url(#chartAreaGradDanger)" />

                      {/* Segmented stroke lines color-coded by severity transitions */}
                      <path d="M 200 188 L 320 148" stroke="#047857" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                      <path d="M 320 148 L 440 148" stroke="#B45309" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                      <path d="M 440 148 L 560 108" stroke="#D97706" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
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
                    </>
                  )}
                </svg>
              </div>
            </div>

            {/* Risk Trend Callout Strip + Protocol Footnote (integrated) */}
            {(() => {
              const first = hasRealHistory && chartPoints.length > 0 ? chartPoints[0].grade : 0
              const last = hasRealHistory && chartPoints.length > 0 ? chartPoints[chartPoints.length - 1].grade : 2
              const trendDir = !hasRealHistory ? 'up' : last > first ? 'up' : last < first ? 'down' : 'flat'
              const trendLabel = trendDir === 'up' ? 'Increasing ↑' : trendDir === 'down' ? 'Decreasing ↓' : 'Stable →'
              const trendBg = trendDir === 'up' ? 'bg-[#EA580C]' : trendDir === 'down' ? 'bg-[#047857]' : 'bg-slate-500'
              const visitCount = hasRealHistory ? chartPoints.length : 5
              const referralActive = hasRealHistory ? Boolean(latestScreening?.referral_recommended) : true
              return (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FFF7ED] border border-[#EA580C]/20">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${trendBg} text-white text-xs font-bold shadow-xs`}>
                      <TrendingUp className="w-3.5 h-3.5" />
                      Risk Trend: {trendLabel}
                    </span>
                    <span className="text-xs sm:text-sm text-[#20312A] font-medium">
                      Grade progressed from {first} to {last} over {visitCount} visit{visitCount !== 1 ? 's' : ''} · Specialist referral {referralActive ? 'active' : 'not required'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#66756D] text-[11px]">
                    <Info className="w-3.5 h-3.5 text-[#66756D] shrink-0" />
                    <span>ETDRS Standard grading protocol</span>
                  </div>
                </div>
              )
            })()}
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
              {hasRealHistory
                ? `${apiScreeningHistory.length} record${apiScreeningHistory.length !== 1 ? 's' : ''} · Last updated ${formatMonthYear(latestScreening?.date)}`
                : '5 records · Last updated Jan 2025'}
            </span>
          </div>

          {/* Longitudinal Visits Timeline (Single Vertical Stroke, De-boxed) */}
          <div className="relative border-l-2 border-[#E2E7E3] ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-6 sm:space-y-8 my-3">
            {hasRealHistory ? apiScreeningHistory.map((s, idx) => {
              const key = String(s.screening_id)
              const isFirst = idx === 0
              const isExpanded = expandedVisits[key] ?? isFirst
              const dateObj = s.date ? new Date(s.date) : null
              const monthShort = dateObj ? dateObj.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase() : '—'
              const dayNum = dateObj ? dateObj.getDate() : '—'
              const fullDate = formatVisitDate(s.date)
              const fundusUrl = apiAssetUrl(s.fundus_image_url)
              const heatmapUrl = apiAssetUrl(s.heatmap_url)
              const vesselUrl = apiAssetUrl(s.vessel_map_url)
              return (
                <div className="relative group" key={key}>
                  {/* Timeline Stroke Node Marker */}
                  <div className={`absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-xs transition-colors ${isFirst ? 'bg-[#285943] ring-4 ring-[#285943]/15' : 'bg-[#94A3B8] group-hover:bg-[#16866A] ring-4 ring-slate-100'}`} />

                  {/* Clickable Header Row */}
                  <div
                    onClick={() => toggleVisit(key)}
                    className="py-2.5 px-3 -mx-3 rounded-xl hover:bg-slate-100/60 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      {fundusUrl ? (
                        <img src={fundusUrl} alt={`Fundus thumbnail ${fullDate}`} className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200 shadow-xs" />
                      ) : (
                        <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold text-center shrink-0 ${isFirst ? 'bg-[#285943] text-white shadow-xs' : 'bg-slate-200/80 text-slate-700'}`}>
                          <span className="text-[10px] uppercase opacity-75 leading-none">{monthShort}</span>
                          <span className="text-base font-extrabold leading-tight">{dayNum}</span>
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-slate-900">{fullDate}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-semibold">
                            Screening #{s.screening_id}
                          </span>
                          {isFirst && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#285943]/10 text-[#285943] text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#285943]"></span> Latest Visit
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {s.reviewed ? 'Reviewed by doctor' : s.referral_recommended ? 'Referral recommended · pending review' : 'Screening recorded'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                      <GradeBadge grade={s.dr_grade} confidence={s.dr_confidence != null ? Math.round(s.dr_confidence) : null} />
                      <div className="flex items-center gap-2">
                        {s.referral_recommended && (
                          <span className={cn('px-2.5 py-1 rounded text-xs font-semibold border', s.reviewed ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-amber-100 text-amber-900 border-amber-200')}>
                            {s.reviewed ? 'Reviewed' : 'Pending Review'}
                          </span>
                        )}
                        <div className={`p-1 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Inspection Panel */}
                  {isExpanded && (
                    <div className="pt-3 pb-2 space-y-4">
                      <div className="flex flex-col lg:flex-row gap-5 items-start">
                        {/* Retinal Thumbnails / Viewer */}
                        <div className="w-full lg:w-48 flex flex-col gap-2 shrink-0">
                          <div className="w-full h-44 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 relative shadow-sm group">
                            {heatmapUrl ? (
                              <img src={heatmapUrl} alt="Grad-CAM heatmap" className="w-full h-full object-cover" />
                            ) : fundusUrl ? (
                              <img src={fundusUrl} alt="Fundus photo" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs text-center px-3">No image on record</div>
                            )}
                            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                              {heatmapUrl ? 'Grad-CAM' : 'Fundus'} · {fullDate}
                            </span>
                          </div>
                          {vesselUrl && (
                            <div className="w-full h-24 rounded-lg bg-slate-950 overflow-hidden border border-slate-800 relative shadow-sm">
                              <img src={vesselUrl} alt="Vessel map" className="w-full h-full object-cover" />
                              <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-teal-300">
                                Frangi Vessels
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-3 w-full">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">AI Screening Result</span>
                              <p className="text-xs font-bold text-slate-900">Grade {s.dr_grade} · {GRADE_LABELS[s.dr_grade] ?? 'Unknown'}</p>
                              <p className="text-xs text-slate-600">Confidence: {s.dr_confidence != null ? `${Math.round(s.dr_confidence)}%` : 'N/A'}</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Referral Status</span>
                              <p className="text-xs font-bold text-slate-900">{s.referral_recommended ? 'Referral Recommended' : 'No Referral Needed'}</p>
                              <p className="text-xs text-slate-600">{s.referral_recommended ? (s.reviewed ? 'Reviewed by doctor' : 'Awaiting doctor review') : '—'}</p>
                            </div>
                          </div>

                          {/* Detected Lesion Biomarkers */}
                          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-[#285943]" />
                                <span className="text-xs font-bold text-[#20312A] uppercase tracking-tight">Detected Lesion Biomarkers</span>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-[#E6F4EA] text-[#047857] text-[10px] font-semibold border border-[#A7F3D0]">
                                ML Pipeline Data
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {/* Microaneurysms */}
                              <div className="p-2 rounded-lg bg-[#F8FAF7] border border-[#E2E7E3] flex flex-col justify-between">
                                <span className="text-[10px] text-[#66756D] uppercase tracking-wider font-semibold">Microaneurysms</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                  <span className={`text-sm font-bold font-mono ${(s.microaneurysm_count ?? 0) > 0 ? 'text-rose-700' : 'text-[#20312A]'}`}>
                                    {s.microaneurysm_count != null ? s.microaneurysm_count : 0}
                                  </span>
                                  <span className="text-[10px] text-[#66756D]">
                                    {(s.microaneurysm_count ?? 0) === 0 ? 'none' : 'detected'}
                                  </span>
                                </div>
                              </div>

                              {/* Hemorrhages */}
                              <div className="p-2 rounded-lg bg-[#F8FAF7] border border-[#E2E7E3] flex flex-col justify-between">
                                <span className="text-[10px] text-[#66756D] uppercase tracking-wider font-semibold">Hemorrhages</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                  <span className={`text-sm font-bold font-mono ${(s.hemorrhage_count ?? 0) > 0 ? 'text-red-700' : 'text-[#20312A]'}`}>
                                    {s.hemorrhage_count != null ? s.hemorrhage_count : 0}
                                  </span>
                                  <span className="text-[10px] text-[#66756D]">
                                    {(s.hemorrhage_count ?? 0) === 0 ? 'none' : 'detected'}
                                  </span>
                                </div>
                              </div>

                              {/* Exudates */}
                              <div className="p-2 rounded-lg bg-[#F8FAF7] border border-[#E2E7E3] flex flex-col justify-between">
                                <span className="text-[10px] text-[#66756D] uppercase tracking-wider font-semibold">Exudate Area</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                  <span className={`text-xs font-bold font-mono ${(s.exudate_area_percent ?? 0) > 0 ? 'text-amber-800' : 'text-[#20312A]'}`}>
                                    {s.exudate_area_percent != null && s.exudate_area_percent > 0 ? `${s.exudate_area_percent}%` : '0%'}
                                  </span>
                                  <span className="text-[10px] text-[#66756D]">
                                    {(s.exudate_area_percent ?? 0) > 0 ? 'coverage' : 'none'}
                                  </span>
                                </div>
                              </div>

                              {/* Optic Disc */}
                              <div className="p-2 rounded-lg bg-[#F8FAF7] border border-[#E2E7E3] flex flex-col justify-between">
                                <span className="text-[10px] text-[#66756D] uppercase tracking-wider font-semibold">Optic Disc</span>
                                <div className="mt-1 truncate">
                                  <span className={`text-xs font-bold font-mono ${s.optic_disc_center ? 'text-teal-800' : 'text-[#20312A]'}`}>
                                    {s.optic_disc_center
                                      ? `[${Array.isArray(s.optic_disc_center) ? s.optic_disc_center.join(', ') : s.optic_disc_center}]`
                                      : 'None'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Doctor Clinical Assessment */}
                          {(s.reviewed || s.ophthalmologist_grade != null) && (
                            <div className="p-3.5 rounded-xl bg-white border border-slate-200 border-l-4 border-l-[#0D9488] shadow-xs space-y-2">
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                                <div className="flex items-center gap-1.5">
                                  <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                                  <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">Doctor Clinical Assessment</span>
                                </div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-semibold">
                                  <Check className="w-3 h-3 mr-1 text-teal-700" />
                                  {s.ophthalmologist_grade != null && Number(s.ophthalmologist_grade) !== Number(s.dr_grade)
                                    ? 'Doctor Overrode AI'
                                    : 'Doctor Accepted AI Result'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Confirmed Grade:</span>
                                <span className="font-bold text-slate-800">
                                  Grade {s.ophthalmologist_grade ?? s.dr_grade} · {GRADE_LABELS[s.ophthalmologist_grade ?? s.dr_grade] ?? 'NPDR'}
                                </span>
                              </div>
                              {Boolean(s.doctor_notes && String(s.doctor_notes).trim()) && (
                                <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 italic">
                                  "{s.doctor_notes}"
                                </p>
                              )}
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Signed off by {s.doctor_name || 'Dr. Arjun Sharma'} (Ophthalmologist)</span>
                              </div>
                            </div>
                          )}

                          {/* TASK 1: System Audit Trail (Real Data) */}
                          <SystemAuditTrail
                            drGrade={s.dr_grade}
                            doctorGrade={s.ophthalmologist_grade}
                            doctorNotes={s.doctor_notes}
                            doctorName={s.doctor_name}
                            reviewedAt={s.reviewed_at || s.date}
                            reviewed={s.reviewed}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            }) : (
            <>
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
                          {latestScreening?.fundus_image_url ? (
                            <img
                              src={getImageUrl(latestScreening.fundus_image_url)}
                              alt="Retinal fundus photo OD"
                              className="w-full h-full object-cover"
                            />
                          ) : (
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
                          )}
                          <span className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-black/80 text-white text-xs font-semibold backdrop-blur-xs border border-white/10">
                            45° Macula-Centered (OD) • ISO 100 • 50% Enlarged Clinical View
                          </span>
                        </div>

                        {/* Layer 2: Grad-CAM */}
                        <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${activeLayer === 'gradcam' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                          {latestScreening?.heatmap_url ? (
                            <img
                              src={getImageUrl(latestScreening.heatmap_url)}
                              alt="Grad-CAM heatmap"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                          <svg aria-label="Grad-CAM heatmap" className="w-full h-full object-cover" fill="none" viewBox="0 0 600 450">
                            <rect fill="#0F172A" height="450" width="600" />
                            <circle cx="300" cy="225" fill="#1E293B" r="175" />
                            <ellipse cx="345" cy="210" fill="#EF4444" filter="blur(20px)" opacity="0.75" rx="68" ry="54" />
                            <ellipse cx="345" cy="210" fill="#FBBF24" filter="blur(12px)" opacity="0.85" rx="38" ry="30" />
                            <ellipse cx="345" cy="210" fill="#FFFFFF" filter="blur(4px)" opacity="0.95" rx="16" ry="14" />
                            <ellipse cx="322" cy="292" fill="#EF4444" filter="blur(15px)" opacity="0.6" rx="48" ry="36" />
                            <circle cx="195" cy="222" fill="none" r="24" stroke="#38BDF8" strokeDasharray="4 4" strokeWidth="3" />
                          </svg>
                          )}
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

                      {/* BLOCK 1.5: Lesion Biomarkers (Real API Fields: microaneurysm_count, exudate_area_percent, hemorrhage_count, optic_disc_center) */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-[#285943]" />
                            <span className="text-xs font-bold text-[#20312A] uppercase tracking-tight">Detected Lesion Biomarkers</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-[#E6F4EA] text-[#047857] text-[11px] font-semibold border border-[#A7F3D0]">
                            ML Pipeline Data
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          {/* Microaneurysms */}
                          <div className="p-2.5 rounded-lg bg-[#F8FAF7] border border-[#E2E7E3] flex flex-col justify-between">
                            <span className="text-[10px] text-[#66756D] uppercase tracking-wider font-semibold">Microaneurysms</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className={`text-base font-bold font-mono ${(latestScreening?.microaneurysm_count ?? 0) > 0 ? 'text-rose-700' : 'text-[#20312A]'}`}>
                                {latestScreening?.microaneurysm_count != null ? latestScreening.microaneurysm_count : 0}
                              </span>
                              <span className="text-[11px] text-[#66756D]">
                                {(latestScreening?.microaneurysm_count ?? 0) === 0 ? 'none detected' : 'detected'}
                              </span>
                            </div>
                          </div>

                          {/* Hemorrhages */}
                          <div className="p-2.5 rounded-lg bg-[#F8FAF7] border border-[#E2E7E3] flex flex-col justify-between">
                            <span className="text-[10px] text-[#66756D] uppercase tracking-wider font-semibold">Hemorrhages</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className={`text-base font-bold font-mono ${(latestScreening?.hemorrhage_count ?? 0) > 0 ? 'text-red-700' : 'text-[#20312A]'}`}>
                                {latestScreening?.hemorrhage_count != null ? latestScreening.hemorrhage_count : 0}
                              </span>
                              <span className="text-[11px] text-[#66756D]">
                                {(latestScreening?.hemorrhage_count ?? 0) === 0 ? 'none detected' : 'detected'}
                              </span>
                            </div>
                          </div>

                          {/* Exudates */}
                          <div className="p-2.5 rounded-lg bg-[#F8FAF7] border border-[#E2E7E3] flex flex-col justify-between">
                            <span className="text-[10px] text-[#66756D] uppercase tracking-wider font-semibold">Exudate Area</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className={`text-sm font-bold font-mono ${(latestScreening?.exudate_area_percent ?? 0) > 0 ? 'text-amber-800' : 'text-[#20312A]'}`}>
                                {latestScreening?.exudate_area_percent != null && latestScreening.exudate_area_percent > 0
                                  ? `${latestScreening.exudate_area_percent}%`
                                  : '0%'}
                              </span>
                              <span className="text-[11px] text-[#66756D]">
                                {(latestScreening?.exudate_area_percent ?? 0) > 0 ? 'coverage' : 'none detected'}
                              </span>
                            </div>
                          </div>

                          {/* Optic Disc */}
                          <div className="p-2.5 rounded-lg bg-[#F8FAF7] border border-[#E2E7E3] flex flex-col justify-between">
                            <span className="text-[10px] text-[#66756D] uppercase tracking-wider font-semibold">Optic Disc</span>
                            <div className="mt-1 truncate">
                              <span className={`text-xs font-bold font-mono ${latestScreening?.optic_disc_center ? 'text-teal-800' : 'text-[#20312A]'}`}>
                                {latestScreening?.optic_disc_center
                                  ? `[${Array.isArray(latestScreening.optic_disc_center) ? latestScreening.optic_disc_center.join(', ') : latestScreening.optic_disc_center}]`
                                  : 'None detected'}
                              </span>
                            </div>
                          </div>
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

                      {/* TASK 1: System Audit Trail (Secure Read-Only Log) */}
                      <SystemAuditTrail
                        drGrade={latestScreening?.dr_grade ?? 2}
                        doctorGrade={latestScreening?.ophthalmologist_grade ?? (latestScreening?.reviewed ? latestScreening.dr_grade : 2)}
                        doctorNotes={latestScreening?.doctor_notes ?? null}
                        doctorName={latestScreening?.doctor_name ?? 'Dr. Arjun Sharma'}
                        reviewedAt={latestScreening?.reviewed_at ?? (latestScreening?.date || '2025-01-14T11:45:00')}
                        reviewed={latestScreening?.reviewed ?? true}
                      />
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
            </>
            )}
          </div>
        </section>
      </main>

      {/* TASK 2: Formal Hospital Print Report Modal */}
      {showPrintReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Control Header */}
            <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#16866A]" />
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Print Report Preview (Longitudinal Patient Record)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportSummaryPdf}
                  disabled={isExportingPdf}
                  className="h-8 px-3 rounded-lg bg-[#285943] hover:bg-[#1f4534] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{isExportingPdf ? 'Exporting PDF...' : 'Download PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintReportModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body / A4 Sheet View */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex justify-center bg-slate-100">
              <div
                ref={modalPdfRef}
                style={{ width: '794px', minHeight: '1050px', aspectRatio: '1 / 1.414' }}
                className="bg-white text-[#20312A] p-8 sm:p-10 rounded-xl shadow-md border border-slate-200 text-xs flex flex-col justify-between print:shadow-none print:border-none print:m-0 print:exact-colors print-color-adjust-exact"
              >
                <div>
                  {/* 1. LETTERHEAD */}
                  <div className="flex items-start justify-between border-b-4 border-[#285943] pb-4 mb-6">
                    <div className="flex items-center">
                      <img src="/drishti-logo.png" alt="DRISHTI Logo" className="w-8 h-8 object-contain" />
                      <span className="ml-2.5 text-xl font-extrabold tracking-tight text-[#20312A] font-heading">
                        DRISHTI
                      </span>
                      <span className="bg-[#E6F4EA] text-[#047857] text-[10px] font-bold px-2 py-0.5 rounded-md ml-2 border border-[#047857]/20">
                        CLINICAL AI
                      </span>
                    </div>

                    <div className="text-right">
                      <h2 className="text-base font-extrabold tracking-wide text-[#285943] uppercase font-heading">
                        LONGITUDINAL PATIENT RECORD
                      </h2>
                      <div className="text-xs text-[#66756D] mt-0.5 space-y-0.5">
                        <div>
                          Generated: <span className="font-semibold text-[#20312A]">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div>
                          Report ID:{' '}
                          <span className="font-mono font-semibold text-[#20312A]">
                            DRISHTI-HX-{activePatientId}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. PATIENT DEMOGRAPHICS BOX */}
                  <div className="bg-[#F8FAF7] border border-[#E2E7E3] rounded-lg p-4 grid grid-cols-4 gap-4 text-sm mb-6">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-[#66756D]">
                        Patient Name
                      </span>
                      <span className="text-[#20312A] font-semibold">
                        {displayPatient.name}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-[#66756D]">
                        Patient ID / ABHA
                      </span>
                      <span className="text-[#20312A] font-semibold font-mono">
                        {activePatientId}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-[#66756D]">
                        Age / Gender
                      </span>
                      <span className="text-[#20312A] font-semibold">
                        {displayPatient.ageGender}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-[#66756D]">
                        Facility / PHC
                      </span>
                      <span className="text-[#20312A] font-semibold">
                        {displayPatient.phc}
                      </span>
                    </div>
                  </div>

                  {/* 3. LATEST INSPECTION & RETINAL IMAGING */}
                  <section className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#285943] font-heading">
                        Latest Inspection &amp; Retinal Imaging
                      </h3>
                      <span className="text-[11px] font-mono text-[#66756D]">
                        Visit: {latestAssessmentForPdf?.date || '14 Jan 2025'} &middot; Eye: {latestAssessmentForPdf?.eye || 'OD'}
                      </span>
                    </div>
                    <div className="border border-[#E2E7E3] rounded-lg p-3.5 bg-white grid grid-cols-3 gap-3 items-center">
                      {/* Fundus Thumbnail - Fixed: never a broken black square */}
                      <div className="aspect-4/3 bg-slate-950 rounded-lg overflow-hidden border border-slate-200 flex flex-col items-center justify-between p-1.5 relative">
                        <div className="w-full h-full flex items-center justify-center">
                          {latestScreening?.fundus_image_url ? (
                            <img
                              src={apiAssetUrl(latestScreening.fundus_image_url)}
                              alt="Latest Fundus Image"
                              className="w-full h-full object-cover rounded"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <svg className="w-20 h-20 select-none" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="42" fill="#9A3412" />
                              <circle cx="42" cy="46" r="8" fill="#FED7AA" />
                              <circle cx="62" cy="50" r="10" fill="#431407" opacity="0.8" />
                              <path d="M42,46 Q45,30 55,22 T75,16" stroke="#7F1D1D" strokeWidth="1.5" fill="none" />
                              <path d="M42,46 Q47,60 60,70 T80,80" stroke="#7F1D1D" strokeWidth="1.6" fill="none" />
                              <path d="M42,46 Q35,32 25,23 T12,17" stroke="#7F1D1D" strokeWidth="1.2" fill="none" />
                              <path d="M42,46 Q34,58 24,71 T9,81" stroke="#7F1D1D" strokeWidth="1.3" fill="none" />
                            </svg>
                          )}
                        </div>
                        <span className="absolute bottom-1 left-1.5 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                          Fundus ({latestAssessmentForPdf?.eye || 'OD'})
                        </span>
                      </div>

                      {/* Grad-CAM Salience */}
                      <div className="aspect-4/3 bg-slate-950 rounded-lg overflow-hidden border border-slate-200 flex flex-col items-center justify-between p-1.5 relative">
                        <div className="w-full h-full flex items-center justify-center">
                          {latestScreening?.heatmap_url ? (
                            <img
                              src={apiAssetUrl(latestScreening.heatmap_url)}
                              alt="Grad-CAM Salience"
                              className="w-full h-full object-cover rounded"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <svg className="w-20 h-20 select-none" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="42" fill="#9A3412" />
                              <circle cx="48" cy="48" r="26" fill="#EF4444" opacity="0.8" filter="blur(3px)" />
                              <circle cx="48" cy="48" r="16" fill="#FBBF24" opacity="0.7" filter="blur(2px)" />
                            </svg>
                          )}
                        </div>
                        <span className="absolute bottom-1 left-1.5 bg-black/75 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-mono">
                          Grad-CAM Salience
                        </span>
                      </div>

                      {/* Clinical Findings & Care Action */}
                      <div className="text-xs space-y-1 p-1">
                        <span className="text-[10px] uppercase font-bold text-[#66756D] block">
                          Latest Clinical Assessment
                        </span>
                        <div className="text-xs font-bold text-[#20312A]">
                          {latestAssessmentForPdf?.findings ? latestAssessmentForPdf.findings.split('.')[0] : 'ETDRS Grade 2 Moderate NPDR'}
                        </div>
                        <p className="text-[10.5px] text-[#66756D] leading-relaxed line-clamp-2">
                          {latestAssessmentForPdf?.findings || 'Microaneurysms and early hard exudates confirmed with concordant Grad-CAM salience.'}
                        </p>
                        <div className="pt-1 flex items-center gap-2">
                          <span className="text-[9.5px] font-bold text-[#047857] bg-[#E6F4EA] border border-[#047857]/20 rounded px-1.5 py-0.5">
                            Confidence: {latestAssessmentForPdf?.confidence || 94}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 4. DR GRADE PROGRESSION CHART */}
                  <section className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#285943] font-heading">
                        DR Grade Progression
                      </h3>
                      <span className="text-[10px] text-[#66756D] font-mono">
                        0: No DR · 1: Mild · 2: Moderate · 3: Severe · 4: Proliferative
                      </span>
                    </div>
                    <div className="border border-[#E2E7E3] rounded-lg p-4 mb-6 bg-white" style={{ height: 170 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartDataForPdf} margin={{ top: 8, right: 20, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E7E3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#66756D' }} />
                          <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 10, fill: '#66756D' }} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="grade"
                            stroke="#285943"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#285943' }}
                            activeDot={{ r: 6, fill: '#16866A' }}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  {/* 5. SCREENING HISTORY TABLE */}
                  <section className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#285943] mb-2 font-heading">
                      Screening History (5 Most Recent Visits)
                    </h3>
                    <div className="w-full overflow-hidden rounded-lg border border-[#E2E7E3]">
                      <table className="border-collapse w-full text-sm">
                        <thead>
                          <tr className="bg-[#F8FAF7] text-[#66756D] text-xs uppercase font-bold border-b-2 border-[#285943]">
                            <th className="py-2 px-3 text-left">Date</th>
                            <th className="py-2 px-3 text-left">Eye</th>
                            <th className="py-2 px-3 text-left">AI Grade</th>
                            <th className="py-2 px-3 text-left">Doctor Assessment</th>
                            <th className="py-2 px-3 text-right">Care Plan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyDataForPdf.slice(0, 5).map((v, i) => (
                            <tr key={i} className="border-b border-[#E2E7E3] py-2 last:border-0 hover:bg-[#F8FAF7]/50">
                              <td className="py-2 px-3 font-semibold text-[#20312A]">{v.date}</td>
                              <td className="py-2 px-3 font-mono font-medium text-[#66756D]">{v.eye}</td>
                              <td className="py-2 px-3 font-bold">
                                <span className={v.grade >= 3 ? 'text-[#B91C1C]' : v.grade >= 1 ? 'text-[#D97706]' : 'text-[#059669]'}>
                                  Grade {v.grade} {GRADE_LABELS[v.grade] ? `· ${GRADE_LABELS[v.grade]}` : ''}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#20312A]">{v.doctorAssessment}</td>
                              <td className="py-2 px-3 text-right text-[#66756D] font-medium">{v.carePlan}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>

                {/* 6. DOCTOR SIGNATURE LINE & DISCLAIMER */}
                <div>
                  <div className="flex justify-between mt-12 pt-8 border-t border-[#E2E7E3] text-xs text-[#20312A] font-semibold">
                    <div>Reviewing Physician: ____________________</div>
                    <div>Signature &amp; Date: ____________________</div>
                  </div>

                  <div className="text-[9.5px] text-[#66756D] mt-6 pt-3 border-t border-[#E2E7E3] leading-relaxed">
                    <strong>Medical Disclaimer:</strong> Longitudinal tele-ophthalmology record compiled under National Health Mission protocols. Historical AI triage results serve as clinical decision support. Final diagnostic responsibility remains with the reviewing physician.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offscreen A4 report captured by handleExportSummaryPdf via html2canvas + jsPDF */}
      <div style={{ position: 'fixed', top: 0, left: '-10000px', zIndex: -1 }} aria-hidden="true">
        <PatientHistoryPDF
          ref={pdfRef}
          patient={patientForPdf}
          historyData={historyDataForPdf}
          latestAssessment={latestAssessmentForPdf}
          chartData={chartDataForPdf}
          latestScreening={latestScreening}
        />
      </div>
    </div>
  )
}
