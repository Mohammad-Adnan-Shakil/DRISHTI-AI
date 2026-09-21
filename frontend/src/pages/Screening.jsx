import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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
  Sliders,
  ImageOff
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { useTranslation } from 'react-i18next'
import GradeBadge from '../components/GradeBadge'
import ScreeningReportPDF from '../components/ScreeningReportPDF'
import { handleZoomIn, handleZoomOut, handleZoomReset } from '../lib/zoomHandlers'
import { exportNodeToPdf, sanitizeFilenameSegment } from '../lib/pdfExport'
import {
  qualityCheck,
  classify,
  explain,
  recommend,
  saveScreening,
  createReferral,
  getPatient,
  apiAssetUrl
} from '../lib/api'
import { getPendingQueue, queueScreening } from '../lib/db'

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

// Maps a backend PatientResponse (integer id, snake_case fields) onto the
// display shape the rest of this page expects.
function mapApiPatientToDisplay(patient) {
  const initials = (patient.name || '?')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return {
    realId: patient.id,
    id: String(patient.id),
    name: patient.name,
    initials,
    ageGender: patient.age != null && patient.gender
      ? `${patient.age}${patient.gender[0].toUpperCase()} (${patient.age} yrs • ${patient.gender})`
      : 'Not recorded',
    phc: patient.phc_id || 'PHC Hosakote',
    diabetesDuration: patient.diabetes_duration_years != null ? `${patient.diabetes_duration_years} Years` : 'Not recorded',
    hba1c: patient.hba1c_level != null ? `${patient.hba1c_level}%` : 'Not recorded',
    hypertension: patient.hypertension ? 'Yes' : 'No',
    language: patient.preferred_language || 'English',
    audioGuidance: true,
    lastScreened: 'No prior screening on file',
    priorGrade: 0,
    priorGradeLabel: 'No prior grade on file',
    abhaId: '—'
  }
}

const STEPS_IDS = [
  { id: 'select-patient', number: 1 },
  { id: 'capture', number: 2 },
  { id: 'quality-check', number: 3 },
  { id: 'processing', number: 4 },
  { id: 'results', number: 5 }
]

export default function Screening() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  // GRADE_CONFIG is inside the component so t() is available
  const GRADE_CONFIG = {
    0: {
      title: t('grade.0.title'),
      risk: t('grade.0.risk'),
      riskColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      findings: t('grade.0.findings'),
      recommendationTitle: t('grade.0.recommendationTitle'),
      recommendation: t('grade.0.recommendation'),
      timeframe: t('grade.0.timeframe'),
      primaryActionLabel: t('grade.0.urgencyText'),
      primaryActionRoute: '/dashboard',
      urgencyText: t('grade.0.urgencyText')
    },
    1: {
      title: t('grade.1.title'),
      risk: t('grade.1.risk'),
      riskColor: 'bg-amber-100 text-amber-800 border-amber-300',
      findings: t('grade.1.findings'),
      recommendationTitle: t('grade.1.recommendationTitle'),
      recommendation: t('grade.1.recommendation'),
      timeframe: t('grade.1.timeframe'),
      primaryActionLabel: t('screening.saveAndDischarge'),
      primaryActionRoute: '/dashboard',
      urgencyText: t('grade.1.urgencyText')
    },
    2: {
      title: t('grade.2.title'),
      risk: t('grade.2.risk'),
      riskColor: 'bg-orange-100 text-orange-800 border-orange-200',
      findings: t('grade.2.findings'),
      recommendationTitle: t('grade.2.recommendationTitle'),
      recommendation: t('grade.2.recommendation'),
      timeframe: t('grade.2.timeframe'),
      primaryActionLabel: t('screening.saveAndCreateReferral'),
      primaryActionRoute: '/dashboard',
      urgencyText: t('grade.2.urgencyText')
    },
    3: {
      title: t('grade.3.title'),
      risk: t('grade.3.risk'),
      riskColor: 'bg-rose-100 text-rose-800 border-rose-200',
      findings: t('grade.3.findings'),
      recommendationTitle: t('grade.3.recommendationTitle'),
      recommendation: t('grade.3.recommendation'),
      timeframe: t('grade.3.timeframe'),
      primaryActionLabel: t('screening.saveAndCreateReferral'),
      primaryActionRoute: '/dashboard',
      urgencyText: t('grade.3.urgencyText')
    },
    4: {
      title: t('grade.4.title'),
      risk: t('grade.4.risk'),
      riskColor: 'bg-red-100 text-red-900 border-red-300',
      findings: t('grade.4.findings'),
      recommendationTitle: t('grade.4.recommendationTitle'),
      recommendation: t('grade.4.recommendation'),
      timeframe: t('grade.4.timeframe'),
      primaryActionLabel: t('screening.saveAndCreateReferral'),
      primaryActionRoute: '/dashboard',
      urgencyText: t('grade.4.urgencyText')
    }
  }

  const STEPS = [
    { id: 'select-patient', number: 1, label: t('screening.selectPatientStep') },
    { id: 'capture', number: 2, label: t('screening.captureStep') },
    { id: 'quality-check', number: 3, label: t('screening.qualityCheckStep') },
    { id: 'processing', number: 4, label: t('screening.processingStep') },
    { id: 'results', number: 5, label: t('screening.resultsStep') }
  ]

  const [screeningStep, setScreeningStep] = useState('capture')
  const [selectedPatientId, setSelectedPatientId] = useState('DRI-2026-00421')
  const [searchQuery, setSearchQuery] = useState('')
  const [apiPatients, setApiPatients] = useState({})
  const [patientLookupLoading, setPatientLookupLoading] = useState(false)
  const [patientLookupError, setPatientLookupError] = useState(null)
  const [activeEye, setActiveEye] = useState('OD')
  const [activeLayer, setActiveLayer] = useState('original')
  const [zoomLevel, setZoomLevel] = useState(1.0)
  const [hasImage, setHasImage] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)

  // Quality check state
  const [isQualityRejected, setIsQualityRejected] = useState(false)
  const [qualityScore, setQualityScore] = useState(92)
  const [qualityLoading, setQualityLoading] = useState(false)
  const [qualityError, setQualityError] = useState(null)

  // AI Pipeline state
  const [pipelineStage, setPipelineStage] = useState(5)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(100)

  // Real AI results
  const [aiResult, setAiResult] = useState(null)
  const [heatmapUrl, setHeatmapUrl] = useState(null)
  const [fundusImageUrl, setFundusImageUrl] = useState(null)
  const [recommendationText, setRecommendationText] = useState(null)
  // Kannada-only: Groq-generated translation of the Salient Clinical
  // Findings text (English stays as the GRADE_CONFIG default otherwise).
  const [findingsText, setFindingsText] = useState(null)
  const [apiError, setApiError] = useState(null)

  // Simulated Grade (for demo override)
  const [simulatedGrade, setSimulatedGrade] = useState(2)

  // Save/referral submission state — guards against double-submit
  const [isSaving, setIsSaving] = useState(false)
  const [savedScreeningId, setSavedScreeningId] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(null)
  const [offlineQueueKey, setOfflineQueueKey] = useState(null)

  // Screening report PDF export
  const [isExportingReport, setIsExportingReport] = useState(false)
  const reportPdfRef = useRef(null)

  // Auto-select the patient just registered on the Register page (passed via
  // navigate('/screening', { state: { patientId, patientName } })).
  useEffect(() => {
    const { patientId, patientName } = location.state || {}
    if (patientId == null) return

    const idStr = String(patientId)
    let cancelled = false
    let retryTimer = null

    const fallbackToRouteState = () => {
      if (cancelled) return
      // Fall back to the minimal info passed via route state
      const mapped = mapApiPatientToDisplay({ id: Number(patientId), name: patientName || `Patient ${idStr}` })
      setApiPatients(prev => ({ ...prev, [mapped.id]: mapped }))
      setSelectedPatientId(mapped.id)
    }

    const fetchPatient = async (isRetry = false) => {
      try {
        const patient = await getPatient(idStr)
        if (cancelled) return
        if (!patient) {
          if (!isRetry) {
            retryTimer = setTimeout(() => fetchPatient(true), 800)
          } else {
            fallbackToRouteState()
          }
          return
        }
        const mapped = mapApiPatientToDisplay(patient)
        setApiPatients(prev => ({ ...prev, [mapped.id]: mapped }))
        setSelectedPatientId(mapped.id)
      } catch (err) {
        console.error('Failed to load registered patient:', err)
        if (!isRetry) {
          retryTimer = setTimeout(() => fetchPatient(true), 800)
        } else {
          fallbackToRouteState()
        }
      }
    }

    fetchPatient()

    return () => { cancelled = true; if (retryTimer) clearTimeout(retryTimer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  useEffect(() => {
    const handleSyncStatus = (event) => {
      const { status, offlineKey } = event.detail || {}
      if (!offlineQueueKey || offlineKey !== offlineQueueKey) return
      if (status === 'syncing') setSaveSuccess(t('screening.syncingOfflineScreening'))
      if (status === 'synced') setSaveSuccess(t('screening.offlineScreeningSynced'))
      if (status === 'failed') setSaveSuccess(t('screening.offlineScreeningWaiting'))
    }
    window.addEventListener('drishti:offline-sync', handleSyncStatus)
    return () => window.removeEventListener('drishti:offline-sync', handleSyncStatus)
  }, [offlineQueueKey, t])

  const selectedPatient = apiPatients[selectedPatientId] || PATIENTS[selectedPatientId] || PATIENTS['DRI-2026-00421']

  // Use real grade if available, else simulated
  const activeGrade = aiResult ? aiResult.grade : simulatedGrade
  const activeConfidence = aiResult ? aiResult.confidence : GRADE_CONFIG[simulatedGrade].confidence ?? 94
  const gradeInfo = GRADE_CONFIG[activeGrade] || GRADE_CONFIG[2]
  // True once the image has been handed off to the offline queue for later
  // classification — the grade shown is only the Demo Simulator placeholder,
  // so saving/creating a referral now would duplicate what sync.js will do.
  const isPendingOfflineClassification = Boolean(offlineQueueKey) && !aiResult

  // Zoom handlers
  const zoomIn = () => handleZoomIn(setZoomLevel)
  const zoomOut = () => handleZoomOut(setZoomLevel)
  const zoomReset = () => handleZoomReset(setZoomLevel)

  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    const query = searchQuery.trim()
    setPatientLookupError(null)

    // Real patient IDs from the backend are integers (see POST /api/patient).
    // Only hit the API when the query looks like one — otherwise fall through
    // to the local demo patients below.
    if (/^\d+$/.test(query)) {
      setPatientLookupLoading(true)
      try {
        const patient = await getPatient(query)
        const mapped = mapApiPatientToDisplay(patient)
        setApiPatients(prev => ({ ...prev, [mapped.id]: mapped }))
        setSelectedPatientId(mapped.id)
        return
      } catch (err) {
        console.error('Patient lookup failed:', err)
        setPatientLookupError(t('screening.noPatientFound', { query }))
      } finally {
        setPatientLookupLoading(false)
      }
      return
    }

    if (query.toLowerCase().includes('00418') || query.toLowerCase().includes('ramesh')) {
      setSelectedPatientId('DRI-2026-00418')
    } else if (query) {
      setPatientLookupError(t('screening.noPatientMatching', { query }))
    } else {
      setSelectedPatientId('DRI-2026-00421')
    }
  }

  // File upload handler — calls quality check API
  const handleUploadImage = async (file) => {
    const imageFile = file || uploadedFile
    if (!imageFile) {
      // trigger file picker
      fileInputRef.current?.click()
      return
    }

    setUploadedFile(imageFile)
    setHasImage(true)
    setQualityLoading(true)
    setQualityError(null)
    setScreeningStep('quality-check')

    try {
      const result = await qualityCheck(imageFile)
      setQualityScore(result.quality_score ?? null)
      if (result.quality_score == null) {
        setQualityError(t('screening.qualityCheckUnavailable'))
      }
      if (result.passed === false) {
        setIsQualityRejected(true)
      } else {
        setIsQualityRejected(false)
      }
      setQualityLoading(false)
    } catch (err) {
      // Quality-check is a nice-to-have, not a gate — if it times out (e.g.
      // slow mobile networks) or errors, skip straight to AI analysis
      // instead of stranding the user on a "quality check unavailable"
      // screen they'd have to manually click past.
      console.error('Quality check failed or timed out — skipping to AI analysis:', err)
      setQualityLoading(false)
      setIsQualityRejected(false)
      startAIAnalysis(imageFile)
    }
  }

  // File input change
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleUploadImage(file)
  }

  // Offline (or a first-attempt network failure) — skip the whole
  // classify/explain/recommend pipeline, which all require the backend, and
  // queue the raw image + patient + a provisional Demo Simulator grade for
  // classification once connectivity returns. This removes the AI-result
  // dependency from the offline path entirely: previously a screening could
  // only be queued *after* a successful classify (see handleSaveScreening).
  const queueForOfflineClassification = async (file) => {
    if (!selectedPatient.realId) {
      setApiError(t('screening.selectRegisteredPatient'))
      setIsAnalyzing(false)
      return
    }
    const offlineKey = [selectedPatient.realId, file?.name || 'screening', Date.now()].join(':')
    try {
      await queueScreening({
        type: 'pending_classification',
        image: file,
        patient_id: selectedPatient.realId,
        demo_grade: simulatedGrade,
        offline_key: offlineKey,
      })
      setOfflineQueueKey(offlineKey)
      setApiError(null)
      setSaveSuccess(t('screening.screeningQueuedOffline'))
    } catch (err) {
      console.error('Offline classification queue failed:', err)
      setApiError(t('screening.couldNotQueueOffline'))
    } finally {
      setIsAnalyzing(false)
      setPipelineStage(5); setAnalysisProgress(100)
      setScreeningStep('results')
    }
  }

  // AI Pipeline — real API calls
  // fileOverride lets the quality-check failure path hand off the just-picked
  // file directly, since uploadedFile's state update may not have flushed
  // yet. Button onClick handlers call this with no args (or a click event,
  // which isn't a File and is ignored), so they still fall back to state.
  const startAIAnalysis = async (fileOverride) => {
    const activeFile = fileOverride instanceof File ? fileOverride : uploadedFile

    if (activeFile && !navigator.onLine) {
      setScreeningStep('processing')
      setIsAnalyzing(true)
      await queueForOfflineClassification(activeFile)
      return
    }

    setScreeningStep('processing')
    setIsAnalyzing(true)
    setPipelineStage(1)
    setAnalysisProgress(15)
    setApiError(null)

    try {
      // Stage 2: enhancement (visual only)
      await new Promise(r => setTimeout(r, 400))
      setPipelineStage(2); setAnalysisProgress(35)

      // Stage 3: classify
      let gradeResult = null
      if (activeFile) {
        gradeResult = await classify(activeFile)
        setAiResult(gradeResult)
        setSimulatedGrade(gradeResult.grade)
        setFundusImageUrl(gradeResult.fundus_image_url)
      }
      setPipelineStage(3); setAnalysisProgress(60)

      // Stage 4: Grad-CAM explain
      if (activeFile) {
        try {
          const explainResult = await explain(activeFile, gradeResult?.grade ?? null)
          setHeatmapUrl(explainResult.heatmap_url)
        } catch (err) {
          console.error('Explanation failed:', err)
          setApiError(t('screening.aiExplanationUnavailable'))
          setIsAnalyzing(false)
          return
        }
      }
      setPipelineStage(4); setAnalysisProgress(82)

      // Stage 5: multilingual recommendation
      const language = selectedPatient.language?.includes('Kannada') ? 'Kannada'
        : selectedPatient.language?.includes('Hindi') ? 'Hindi'
        : 'English'

      try {
        const rec = await recommend({
          dr_grade: gradeResult?.grade ?? simulatedGrade,
          dme_present: false,
          risk_stratification: gradeResult?.risk ?? 'medium',
          language,
          patient_context: {
            age: selectedPatient.ageGender,
            diabetes_duration: selectedPatient.diabetesDuration,
            hba1c: selectedPatient.hba1c,
            hypertension: selectedPatient.hypertension
          }
        })
        setRecommendationText(rec.recommendation)
        // Kannada patients also see the Salient Clinical Findings text
        // translated via this same Groq recommendation — English keeps the
        // static GRADE_CONFIG findings copy (findingsText stays null).
        setFindingsText(language === 'Kannada' ? rec.recommendation : null)
      } catch (err) {
        console.error('Recommendation failed:', err)
        setApiError(t('screening.recommendationUnavailable'))
        setIsAnalyzing(false)
        return
      }

      setPipelineStage(5); setAnalysisProgress(100)
      setIsAnalyzing(false)

      setTimeout(() => setScreeningStep('results'), 800)

    } catch (err) {
      console.error('AI analysis failed:', err)
      // A network-level failure (TypeError: "Failed to fetch") even though
      // navigator.onLine reported true — flaky connection, DNS hiccup, etc.
      // Treat it the same as being offline rather than dead-ending the user.
      if (activeFile && err instanceof TypeError) {
        await queueForOfflineClassification(activeFile)
        return
      }
      setApiError(t('screening.aiAnalysisFailed'))
      setIsAnalyzing(false)
      setPipelineStage(3); setAnalysisProgress(60)
    }
  }

  // Save screening result
  const handleSaveScreening = async () => {
    if (isSaving) return // already submitting — ignore repeat clicks
    if (isPendingOfflineClassification) return // already queued — sync.js will save + refer once classified
    setIsSaving(true)
    setApiError(null)
    setSaveSuccess(null)

    if (!selectedPatient.realId) {
      // Demo patient (not backed by a real DB row) — nothing valid to save against.
      console.warn('Skipping saveScreening: no real patient_id for demo patient', selectedPatientId)
      if (activeGrade < 2) {
        navigate(gradeInfo.primaryActionRoute)
        return
      }
      setApiError(t('screening.selectRegisteredPatient'))
      setIsSaving(false)
      return
    }

    let screeningId = savedScreeningId
    const screeningPayload = {
      patient_id: selectedPatient.realId,
      dr_grade: activeGrade,
      dr_confidence: activeConfidence,
      quality_score: qualityScore,
      fundus_image_url: fundusImageUrl ?? '',
      heatmap_url: heatmapUrl ?? '',
      risk_stratification: gradeInfo.risk,
      referral_recommended: activeGrade >= 2,
      recommendation_text: recommendationText ?? gradeInfo.recommendation,
      recommendation_language: 'English'
    }
    const offlineKey = [
      selectedPatient.realId,
      activeEye,
      fundusImageUrl || uploadedFile?.name || 'screening',
      activeGrade,
    ].join(':')

    const queueOffline = async () => {
      const pending = await getPendingQueue()
      const existing = pending.find(item => item.offline_key === offlineKey)
      if (existing) {
        setOfflineQueueKey(offlineKey)
        setSaveSuccess(t('screening.screeningSavedOffline'))
        setIsSaving(false)
        return
      }
      await queueScreening({
        ...screeningPayload,
        offline_key: offlineKey,
        remote_screening_id: screeningId,
        referral_intent: activeGrade >= 2,
        referral_patient_id: selectedPatient.realId,
      })
      setOfflineQueueKey(offlineKey)
      setSaveSuccess(t('screening.screeningSavedOffline'))
      setIsSaving(false)
    }

    if (!navigator.onLine) {
      try {
        await queueOffline()
      } catch (err) {
        console.error('Offline screening queue failed:', err)
        setApiError(t('screening.couldNotSaveOffline'))
        setIsSaving(false)
      }
      return
    }

    try {
      if (!screeningId) {
        const screening = await saveScreening(screeningPayload)
        screeningId = screening?.id
        if (activeGrade >= 2 && !screeningId) {
          throw new Error('Screening saved without an ID')
        }
        setSavedScreeningId(screeningId)
      }

      if (activeGrade >= 2) {
        await createReferral({
          screening_id: screeningId,
          patient_id: selectedPatient.realId
        })
        setSaveSuccess(`Screening ${screeningId} and referral saved successfully.`)
        setTimeout(() => navigate(gradeInfo.primaryActionRoute), 800)
        return
      }

      navigate(gradeInfo.primaryActionRoute)
    } catch (err) {
      console.error('Save screening/referral failed:', err)
      if (err instanceof TypeError) {
        try {
          await queueOffline()
        } catch (queueError) {
          console.error('Offline screening queue failed:', queueError)
          setApiError(t('screening.connectionFailed'))
          setIsSaving(false)
        }
        return
      }
      setApiError(screeningId
        ? t('screening.screeningSavedReferralFailed', { id: screeningId })
        : t('screening.couldNotSaveScreening'))
      setIsSaving(false)
    }
  }

  // Export the current screening result as a single-visit A4 PDF report
  const handleExportScreeningReport = async () => {
    if (isExportingReport) return
    setIsExportingReport(true)
    try {
      const dateStr = new Date().toISOString().slice(0, 10)
      const filenameSafeId = sanitizeFilenameSegment(String(selectedPatient.id))
      await exportNodeToPdf(reportPdfRef.current, `DRISHTI_Screening_${filenameSafeId}_${dateStr}.pdf`)
    } catch (err) {
      console.error('Export screening report PDF failed:', err)
    } finally {
      setIsExportingReport(false)
    }
  }

  const getStepIndex = (stepId) => STEPS.findIndex(s => s.id === stepId)
  const currentStepIndex = getStepIndex(screeningStep)

  const LAYER_OPTIONS = [
    { id: 'original', label: t('screening.original') },
    { id: 'gradcam', label: t('screening.gradcamHeatmap') },
    { id: 'vessel', label: t('screening.vesselMap') },
    { id: 'compare', label: t('screening.compare') }
  ]

  const PIPELINE_STAGES = [
    t('screening.stage1'),
    t('screening.stage2'),
    t('screening.stage3'),
    t('screening.stage4'),
    t('screening.stage5')
  ]

  const QUALITY_LABELS = [
    t('screening.illumination'),
    t('screening.retinaCentered'),
    t('screening.minimalBlur'),
    t('screening.fieldOfView')
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A] pb-16 md:pb-12">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <Navbar />

      {selectedPatient && (
        <aside aria-label={t('screening.activePatientRecord')} className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E7E3] px-4 sm:px-6 lg:px-8 py-2.5 shadow-xs transition-all">
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
                {activeEye === 'OD' ? t('dashboard.rightEye') : t('dashboard.leftEye')}
              </span>
              {screeningStep === 'results' && <GradeBadge grade={activeGrade} />}
            </div>
          </div>
        </aside>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">

        {/* API Error Banner */}
        {apiError && (
          <div role="alert" className="warning-banner p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="flex-1">{apiError}</span>
            {uploadedFile && !isSaving && (
              <button type="button" onClick={startAIAnalysis} className="font-semibold underline">{t('common.retry')}</button>
            )}
          </div>
        )}
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* 5-STEP STEPPER */}
        <section aria-label={t('screening.screeningProgress')} className="bg-white rounded-2xl border border-[#E2E7E3] p-3.5 sm:p-4 shadow-sm">
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
                      <span className="w-4 h-4 rounded-full bg-[#047857] text-white flex items-center justify-center font-bold text-[10px]">✓</span>
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-[#14532D] animate-pulse" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-mono">{step.number}</span>
                    )}
                    <span>{step.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className="flex-1 h-[2px] bg-[#E2E7E3] mx-1 rounded-full relative overflow-hidden">
                      {isCompleted && <div className="absolute inset-0 bg-[#047857]" />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="sm:hidden flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full font-bold bg-[#E6F4EA] text-[#047857] border border-[#047857]/20">
                {t('screening.stepOf', { current: currentStepIndex + 1, total: 5 })}
              </span>
              <span className="font-bold text-[#20312A]">{STEPS[currentStepIndex].label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {currentStepIndex > 0 && (
                <button type="button" onClick={() => setScreeningStep(STEPS[currentStepIndex - 1].id)}
                  className="px-2 py-1 bg-[#F8FAF7] border border-[#E2E7E3] rounded text-[11px] font-medium text-[#20312A]">{t('common.previous')}</button>
              )}
              {currentStepIndex < STEPS.length - 1 && (
                <button type="button" onClick={() => setScreeningStep(STEPS[currentStepIndex + 1].id)}
                  className="px-2 py-1 bg-gradient-to-r from-[#D9F99D] via-[#DCFCE7] to-[#CCFBF1] text-[#14532D] border border-[#A7F3D0] rounded text-[11px] font-bold">{t('common.next')}</button>
              )}
            </div>
          </div>
        </section>

        {/* 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN */}
          <section className="lg:col-span-5 space-y-5">

            {/* SELECT PATIENT */}
            <div className="bg-white rounded-2xl border border-[#E2E7E3] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#66756D]">{t('screening.selectPatient')}</span>
                <span className="text-[11px] text-[#16866A] font-semibold bg-[#E6F4EA] px-2 py-0.5 rounded-full">PHC Hosakote</span>
              </div>
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('screening.searchByPatientID')}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E2E7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16866A] text-[#20312A]" />
                </div>
                <button type="submit" disabled={patientLookupLoading} className="px-4 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-[#E6F4EA] text-[#20312A] border border-[#E2E7E3] shadow-2xs transition-colors cursor-pointer disabled:opacity-60">
                  {patientLookupLoading ? t('screening.searching') : t('common.search')}
                </button>
              </form>
              {patientLookupError && (
                <p className="mt-2 text-[11px] text-rose-600 font-medium">{patientLookupError}</p>
              )}
              <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[#66756D] text-[11px]">{t('screening.recent')}</span>
                {['DRI-2026-00421', 'DRI-2026-00418'].map(pid => (
                  <button key={pid} type="button" onClick={() => setSelectedPatientId(pid)}
                    className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                      selectedPatientId === pid
                        ? 'bg-[#E6F4EA] text-[#047857] border-[#047857]/30 font-bold'
                        : 'bg-[#F8FAF7] text-[#20312A] border-[#E2E7E3] hover:bg-slate-100'
                    }`}>
                    {PATIENTS[pid].name} ({pid.slice(-5)})
                  </button>
                ))}
              </div>
            </div>

            {/* ACTIVE PATIENT RECORD */}
            <div className="bg-white rounded-2xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] overflow-hidden">
              <div className="bg-[#285943]/5 px-5 py-3.5 border-b border-[#E2E7E3] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#047857]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#20312A]">{t('screening.activePatientRecord')}</span>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between pb-4 border-b border-[#E2E7E3]">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-[#20312A] font-heading leading-tight">{selectedPatient.name}</h2>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">{selectedPatient.id}</span>
                      <span className="text-xs text-[#475569] font-medium">{selectedPatient.phc}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#285943] to-[#16866A] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                    {selectedPatient.initials}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-[#F8FAF7] border border-[#E2E7E3] p-3 rounded-xl">
                    <span className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider block">{t('screening.ageGender')}</span>
                    <span className="font-bold text-[#20312A] mt-0.5 block">{selectedPatient.ageGender}</span>
                  </div>
                  <div className="bg-[#F8FAF7] border border-[#E2E7E3] p-3 rounded-xl">
                    <span className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider block">{t('screening.diabetesDuration')}</span>
                    <span className="font-bold text-[#20312A] mt-0.5 block">{selectedPatient.diabetesDuration}</span>
                  </div>
                  <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider block">{t('screening.latestHba1c')}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">{t('screening.elevated')}</span>
                    </div>
                    <span className="font-bold text-amber-900 mt-0.5 block">{selectedPatient.hba1c}</span>
                  </div>
                  <div className="bg-[#F8FAF7] border border-[#E2E7E3] p-3 rounded-xl">
                    <span className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider block">{t('screening.hypertension')}</span>
                    <span className="font-bold text-[#20312A] mt-0.5 block">{selectedPatient.hypertension}</span>
                  </div>
                </div>
                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F8FAF7] border border-[#E2E7E3]">
                    <span className="text-[#475569]">{t('screening.preferredLanguage')}:</span>
                    <span className="font-semibold text-[#20312A]">{selectedPatient.language} • {t('common.audioGuidance')}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F8FAF7] border border-[#E2E7E3]">
                    <span className="text-[#475569]">{t('screening.priorDRStatus')}:</span>
                    <GradeBadge grade={selectedPatient.priorGrade} />
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F8FAF7] border border-[#E2E7E3]">
                    <span className="text-[#475569]">{t('screening.primaryABHAID')}:</span>
                    <span className="font-mono font-medium text-[#20312A]">{selectedPatient.abhaId}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link to={`/history/${selectedPatient.id}`}
                    className="w-full py-2.5 bg-white hover:bg-[#E6F4EA] border border-[#E2E7E3] text-[#20312A] text-xs font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs">
                    <span>{t('screening.viewLongitudinalHistory')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#285943]" />
                  </Link>
                </div>
              </div>
            </div>

            {/* PROTOCOL */}
            <div className="bg-[#F8FAF7] rounded-2xl border border-[#E2E7E3]/70 p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#16866A]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569]">{t('screening.phcClinicalScreeningProtocol')}</h3>
              </div>
              <ul className="text-xs text-[#66756D] space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>{t('screening.protocol1')}</li>
                <li>{t('screening.protocol2')}</li>
                <li>{t('screening.protocol3')}</li>
                <li>{t('screening.protocol4')}</li>
              </ul>
              <div className="pt-2 border-t border-[#E2E7E3]/60 flex items-center justify-between text-[11px] text-[#66756D]">
                <span>{t('screening.edgeAIModel')}: <strong>{t('screening.efficientNet')}</strong></span>
                <span className="text-[#047857] font-semibold">{t('screening.sensitivity')}</span>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN */}
          <section className="lg:col-span-7 space-y-6">

            {/* FUNDUS VIEWER CARD */}
            <div className="bg-white rounded-2xl border border-[#E2E7E3] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E7E3]">
                <div>
                  <span className="text-xs font-bold text-[#66756D] uppercase tracking-wider block mb-1">{t('screening.targetEyeSelection')}</span>
                  <div className="inline-flex rounded-full p-1 bg-[#F8FAF7] border border-[#E2E7E3]">
                    {['OD', 'OS'].map(eye => (
                      <button key={eye} type="button" onClick={() => setActiveEye(eye)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeEye === eye
                            ? 'bg-gradient-to-r from-[#D9F99D] via-[#DCFCE7] to-[#CCFBF1] text-[#14532D] border border-[#A7F3D0] shadow-xs'
                            : 'text-[#66756D] hover:text-[#20312A] hover:bg-white/80'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${activeEye === eye ? 'bg-[#14532D]' : 'bg-slate-400'}`} />
                        <span>{eye === 'OD' ? t('dashboard.rightEye') : t('dashboard.leftEye')}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E6F4EA] text-[#047857] border border-[#047857]/20 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" />
                    <span>{qualityScore}% {t('screening.good')}</span>
                  </span>
                  <span className="text-[11px] text-[#66756D] font-medium">{t('screening.readyForAI')}</span>
                </div>
              </div>

              {/* LAYER TOGGLES */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-[#66756D] uppercase tracking-wider shrink-0">{t('screening.layer')}:</span>
                  <div className="bg-[#F1F5F9] p-1 rounded-lg flex items-center gap-1 text-xs overflow-x-auto max-w-full">
                    {LAYER_OPTIONS.map(layer => (
                      <button key={layer.id} type="button" onClick={() => setActiveLayer(layer.id)}
                        className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer font-medium whitespace-nowrap shrink-0 ${
                          activeLayer === layer.id ? 'bg-white shadow-sm text-[#20312A] font-semibold' : 'text-[#66756D] hover:text-[#20312A]'
                        }`}>
                        {layer.label}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-[11px] text-[#475569] font-medium">
                  {activeEye} · 45° {t('screening.field')} · {activeLayer.toUpperCase()}
                </span>
              </div>

              {/* FUNDUS DISPLAY */}
              <div className="relative w-full aspect-square max-h-[380px] sm:max-h-[440px] mx-auto bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center group">
                {!hasImage ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-center px-6">
                    <ImageOff className="w-12 h-12 text-slate-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-300">{t('screening.noFundusImage')}</p>
                      <p className="text-xs text-slate-500 mt-1">{t('screening.useCaptureOrUpload')}</p>
                    </div>
                  </div>
                ) : (
                <>
                <div className="w-full h-full flex items-center justify-center transition-transform duration-200" style={{ transform: `scale(${zoomLevel})` }}>
                  {/* Show real heatmap if available and gradcam layer selected */}
                  {activeLayer === 'gradcam' && heatmapUrl ? (
                    <img
                      src={apiAssetUrl(heatmapUrl)}
                      alt={t('screening.gradcamHeatmap')}
                      className="w-full h-full object-contain"
                    />
                  ) : (activeLayer === 'original' || activeLayer === 'vessel' || activeLayer === 'compare') && fundusImageUrl ? (
                    <img
                      src={apiAssetUrl(fundusImageUrl)}
                      alt={t('screening.fundusPhoto')}
                      className="w-full h-full object-contain"
                    />
                  ) : (
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
                        <radialGradient cx="45%" cy="46%" id="screeningGradCam" r="48%">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.88" />
                          <stop offset="35%" stopColor="#F97316" stopOpacity="0.75" />
                          <stop offset="65%" stopColor="#EAB308" stopOpacity="0.45" />
                          <stop offset="85%" stopColor="#22C55E" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                        </radialGradient>
                        <filter id="screeningBlur"><feGaussianBlur stdDeviation="10" /></filter>
                      </defs>
                      <circle cx="250" cy="250" fill="url(#fundusBg)" r="240" />
                      <g fill="none" opacity="0.88" stroke="#7F1D1D" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M210,230 Q220,170 270,120 T360,90" strokeWidth="3.2" />
                        <path d="M210,230 Q190,160 140,110 T70,80" strokeWidth="2.8" />
                        <path d="M210,230 Q230,290 290,340 T390,390" strokeWidth="3.4" />
                        <path d="M210,230 Q180,300 130,360 T50,400" strokeWidth="2.6" />
                      </g>
                      <circle cx="210" cy="230" fill="url(#opticDisc)" opacity="0.95" r="38" />
                      <circle cx="206" cy="227" fill="#FFF7ED" opacity="0.65" r="16" />
                      <circle cx="310" cy="245" fill="url(#macula)" r="45" />
                      <circle cx="310" cy="245" fill="#2E0A02" opacity="0.9" r="6" />
                      {(activeLayer === 'gradcam' || activeLayer === 'compare') && (
                        <g filter="url(#screeningBlur)" opacity="0.82">
                          <circle cx="230" cy="235" fill="url(#screeningGradCam)" r="130" />
                        </g>
                      )}
                      {(activeLayer === 'vessel' || activeLayer === 'compare') && (
                        <g fill="none" opacity="0.92" stroke="#22D3EE" strokeLinecap="round">
                          <path d="M210,230 Q220,170 270,120 T360,90" strokeWidth="2.8" />
                          <path d="M210,230 Q190,160 140,110 T70,80" strokeWidth="2.4" />
                          <path d="M210,230 Q230,290 290,340 T390,390" strokeWidth="3" />
                        </g>
                      )}
                      {activeLayer === 'compare' && (
                        <line stroke="#FFFFFF" strokeDasharray="5 5" strokeWidth="2" x1="250" x2="250" y1="10" y2="490" />
                      )}
                    </svg>
                  )}
                </div>

                {/* Overlay label */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span>{activeEye} • 45° {t('screening.field')} • {activeLayer.toUpperCase()}</span>
                </div>

                {/* Zoom Controls */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-sm text-white p-1.5 rounded-xl border border-slate-700/60 shadow-md">
                  <button type="button" onClick={zoomIn} className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
                  <button type="button" onClick={zoomOut} className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
                  <button type="button" onClick={zoomReset} className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"><Maximize2 className="w-4 h-4" /></button>
                </div>

                {/* Retake */}
                <div className="absolute bottom-3 right-3">
                  <button type="button" onClick={() => { setHasImage(false); setUploadedFile(null); setAiResult(null); setScreeningStep('capture'); setZoomLevel(1.0) }}
                    className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('screening.retake')}</span>
                  </button>
                </div>
                </>
                )}
              </div>

              {/* ACTION BUTTONS */}
              {!hasImage ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button type="button" onClick={() => cameraInputRef.current?.click()}
                    className="btn-gradient-pill min-h-[44px] h-12 px-5 text-sm font-bold shadow-xs hover:brightness-105 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer focus:outline-none">
                    <Camera className="w-5 h-5 text-[#14532D]" />
                    <span>{t('screening.captureImage')}</span>
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px] h-12 px-5 bg-white hover:bg-[#E6F4EA] text-[#20312A] font-semibold text-sm rounded-xl border border-[#E2E7E3] shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer">
                    <Upload className="w-5 h-5 text-slate-500" />
                    <span>{t('screening.uploadFromDevice')}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button type="button" onClick={() => { setHasImage(false); setUploadedFile(null); setAiResult(null); setScreeningStep('capture'); setZoomLevel(1.0) }}
                    className="min-h-[44px] h-12 px-5 bg-white hover:bg-[#E6F4EA] text-[#20312A] font-semibold text-sm rounded-xl border border-[#E2E7E3] shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer">
                    <RotateCcw className="w-4 h-4 text-slate-600" />
                    <span>{t('screening.retakeImage')}</span>
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px] h-12 px-5 bg-white hover:bg-[#E6F4EA] text-[#475569] hover:text-[#20312A] font-semibold text-sm rounded-xl border border-[#E2E7E3] shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>{t('screening.uploadReplacement')}</span>
                  </button>
                </div>
              )}

              {activeLayer === 'gradcam' && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span><strong>{t('screening.gradcamExplanationTitle')}:</strong> {t('screening.gradcamExplanationBody')}</span>
                </div>
              )}
            </div>

            {/* QUALITY CHECK CARD */}
            {(screeningStep === 'quality-check' || (screeningStep === 'capture' && hasImage)) && (
              <div className="bg-white rounded-2xl border border-[#E2E7E3] p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E7E3]">
                  <div>
                    <h3 className="text-sm font-bold text-[#20312A] font-heading">{t('screening.imageQualityCheck')}</h3>
                    <p className="text-xs text-[#66756D] mt-0.5">{t('screening.automatedQualityAssessment')}</p>
                  </div>
                  <button type="button" onClick={() => setIsQualityRejected(!isQualityRejected)}
                    className="text-[11px] font-semibold text-[#66756D] hover:text-[#20312A] underline cursor-pointer">
                    {isQualityRejected ? t('screening.simulatePass') : t('screening.simulateLowQuality')}
                  </button>
                </div>

                {qualityLoading ? (
                  <div className="flex items-center justify-center py-6 gap-3 text-[#66756D] text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#16866A]" />
                    <span>{t('screening.runningQualityCheck')}</span>
                  </div>
                ) : qualityError ? (
                  <>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">{qualityError}</div>
                    <div className="pt-2">
                      <button type="button" onClick={startAIAnalysis}
                        className="btn-gradient-pill w-full min-h-[44px] h-12 text-base font-bold shadow-md hover:shadow transition-all flex items-center justify-center gap-2.5 cursor-pointer">
                        <Sparkles className="w-5 h-5 text-[#14532D]" />
                        <span>{t('screening.runAIAnalysis')}</span>
                      </button>
                    </div>
                  </>
                ) : isQualityRejected ? (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      <div>
                        <h4 className="font-bold text-xs">{t('screening.imageQualityInsufficient', { score: qualityScore })}</h4>
                        <p className="text-[11px] text-rose-700 mt-0.5">{t('screening.cannotProceedToAI')}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setIsQualityRejected(false); setHasImage(false); setUploadedFile(null); setScreeningStep('capture') }}
                      className="min-h-[44px] h-11 w-full bg-white hover:bg-[#E6F4EA] border border-[#E2E7E3] text-[#20312A] font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer">
                      <RotateCcw className="w-4 h-4 text-slate-600" />
                      <span>{t('screening.retakeFundusImage')}</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      {QUALITY_LABELS.map(label => (
                        <div key={label} className="bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl p-2.5 flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-[11px]">✓</span>
                          <span className="text-[#20312A] font-medium">{label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <button type="button" onClick={startAIAnalysis}
                        className="btn-gradient-pill w-full min-h-[44px] h-12 text-base font-bold shadow-md hover:shadow transition-all flex items-center justify-center gap-2.5 cursor-pointer">
                        <Sparkles className="w-5 h-5 text-[#14532D]" />
                        <span>{t('screening.runAIAnalysis')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* AI PROCESSING PIPELINE */}
            {screeningStep === 'processing' && (
              <div className="bg-white rounded-2xl border border-[#E2E7E3] p-5 sm:p-6 shadow-md space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E7E3]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#285943] text-white flex items-center justify-center shadow-xs">
                      <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''} text-[#A7F3D0]`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#20312A] font-heading">{t('screening.aiAnalysisPipeline')}</h3>
                      <p className="text-xs text-[#66756D]">{t('screening.executing5StageInference')}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setScreeningStep('results')} className="text-xs font-semibold text-[#285943] hover:underline cursor-pointer">
                    {t('screening.skipToResults')} →
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#66756D]">{t('screening.inferenceProgress')}</span>
                    <span className="text-[#285943] font-mono font-bold">{analysisProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F8FAF7] border border-[#E2E7E3] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#D9F99D] via-[#16866A] to-[#285943] transition-all duration-300 rounded-full" style={{ width: `${analysisProgress}%` }} />
                  </div>
                </div>
                <div className="divide-y divide-slate-100 border border-[#E2E7E3] rounded-xl overflow-hidden text-xs">
                  {PIPELINE_STAGES.map((label, i) => (
                    <div key={i} className={`p-3 flex items-center justify-between ${pipelineStage > i ? 'bg-emerald-50/40' : 'bg-white opacity-70'}`}>
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                          {pipelineStage > i ? '✓' : '•'}
                        </span>
                        <span className="font-semibold text-[#20312A]">{label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RESULTS */}
            {screeningStep === 'results' && (
              <div className="space-y-5 animate-in fade-in duration-300">

                {/* Demo grade switcher — only show if no real result */}
                {!aiResult && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E2E7E3] text-xs">
                    <div className="flex items-center gap-2 text-[#66756D]">
                      <Sliders className="w-3.5 h-3.5 text-[#16866A]" />
                      <span className="font-semibold text-[#20312A]">{t('screening.demoSimulator')}:</span>
                      <span>{t('screening.switchGradeToReview')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3, 4].map(g => (
                        <button key={g} type="button" onClick={() => setSimulatedGrade(g)}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                            simulatedGrade === g ? 'bg-[#20312A] text-white shadow-xs' : 'bg-[#F8FAF7] text-[#66756D] border border-[#E2E7E3] hover:bg-slate-100'
                          }`}>G{g}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI RESULT CARD */}
                <div className="bg-white rounded-2xl border-2 border-[#E2E7E3] p-5 sm:p-6 shadow-[0_2px_12px_rgba(40,89,67,0.04)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E7E3]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#16866A]" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#20312A] font-heading">{t('screening.aiAssistedScreeningResult')}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#047857] bg-[#E6F4EA] px-2.5 py-0.5 rounded-full border border-[#047857]/20">
                      {aiResult ? `EfficientNet-B4 · ${t('screening.liveResult')}` : t('screening.demoMode')}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <GradeBadge grade={activeGrade} />
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#20312A] font-heading">{gradeInfo.title}</h2>
                      </div>
                      <p className="text-xs text-[#66756D] mt-1">
                        {t('screening.examinedEye')}: <strong className="text-[#20312A]">{activeEye === 'OD' ? t('dashboard.rightEye') : t('dashboard.leftEye')}</strong> · {t('screening.nonMydriatic')}
                      </p>
                    </div>
                    <span className={`whitespace-nowrap inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-extrabold border shrink-0 self-start sm:self-auto ${gradeInfo.riskColor}`}>
                      {gradeInfo.risk}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl text-xs text-[#20312A] leading-relaxed">
                    <strong>{t('screening.salientClinicalFindings')}:</strong> {findingsText ?? gradeInfo.findings}
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#66756D]">{t('screening.diagnosticAIConfidence')}</span>
                      <span className="text-[#20312A] font-bold font-mono">{activeConfidence}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#F8FAF7] border border-[#E2E7E3] rounded-full overflow-hidden">
                      <div className="h-full bg-[#16866A] rounded-full" style={{ width: `${activeConfidence}%` }} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#E2E7E3] text-[11px] text-[#66756D] leading-relaxed flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#16866A] shrink-0 mt-0.5" />
                    <span>{t('screening.aiScreeningSupports')}</span>
                  </div>
                </div>

                {/* RECOMMENDATION CARD */}
                <div className="bg-white rounded-2xl border border-[#E2E7E3] p-5 sm:p-6 shadow-[0_2px_12px_rgba(40,89,67,0.04)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#20312A] font-heading flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#16866A]" />
                      <span>{t('screening.clinicalRecommendation')}</span>
                    </h3>
                    <span className="text-xs font-bold text-[#285943] bg-[#E6F4EA] px-2.5 py-1 rounded-full border border-[#047857]/20">
                      {gradeInfo.timeframe}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-extrabold text-[#20312A] font-heading">{gradeInfo.recommendationTitle}</h4>
                    <p className="text-xs text-[#66756D] leading-relaxed">
                      {recommendationText ?? gradeInfo.recommendation}
                    </p>
                  </div>
                </div>

                {/* PRIMARY ACTION */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <button type="button" onClick={handleSaveScreening} disabled={isSaving || isPendingOfflineClassification}
                    className="flex-1 btn-gradient-pill min-h-[44px] h-12 px-6 text-sm font-bold shadow-sm hover:brightness-105 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100">
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t('screening.saving')}</span>
                      </>
                    ) : isPendingOfflineClassification ? (
                      <span>{t('screening.queuedForSync')}</span>
                    ) : (
                      <span>{gradeInfo.primaryActionLabel}</span>
                    )}
                  </button>
                  <button type="button" onClick={handleExportScreeningReport} disabled={isExportingReport}
                    className="min-h-[44px] h-12 px-4 bg-transparent text-[#66756D] hover:text-[#285943] hover:bg-[#F3F6F1] font-semibold text-xs rounded-xl border border-[#E2E7E3] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
                    {isExportingReport ? <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" /> : <Printer className="w-4 h-4 text-slate-500" />}
                    <span>{isExportingReport ? t('screening.exporting') : t('screening.printReport')}</span>
                  </button>
                </div>
              </div>
            )}

          </section>
        </div>
      </main>

      {/* Offscreen A4 report captured by handleExportScreeningReport via html2canvas + jsPDF */}
      <div style={{ position: 'fixed', top: 0, left: '-10000px', zIndex: -1 }} aria-hidden="true">
        <ScreeningReportPDF
          ref={reportPdfRef}
          patient={selectedPatient}
          activeGrade={activeGrade}
          activeConfidence={activeConfidence}
          activeEye={activeEye}
          gradeInfo={gradeInfo}
          gradcamUrl={apiAssetUrl(heatmapUrl)}
          recommendationText={recommendationText}
          qualityScore={qualityScore}
        />
      </div>
    </div>
  )
}
