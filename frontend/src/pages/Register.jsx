import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, User, FileText, Globe, AlertCircle, ArrowRight, Loader2, ShieldAlert } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useTranslation } from 'react-i18next'
import { createPatient } from '../lib/api'
import { cn, RISK_TIER_STYLES, getRiskTierFromScore } from '../lib/utils'

// Registration-time Risk Score — 7 weighted clinical factors, max 18 points,
// captured before any AI screening exists so PHC staff can triage on sight.
// Diabetes duration and HbA1c points are derived from the numeric inputs
// above (Section B) rather than asked twice — see scoreDiabetesDuration /
// scoreHba1c below.
function scoreDiabetesDuration(years) {
  const y = Number(years)
  if (years === '' || years == null || !isFinite(y)) return 0
  if (y >= 15) return 3
  if (y >= 10) return 2
  if (y >= 5) return 1
  return 0
}

function scoreHba1c(value) {
  const v = Number(value)
  if (value === '' || value == null || !isFinite(v)) return 0
  if (v >= 10) return 3
  if (v >= 8.5) return 2
  if (v >= 7) return 1
  return 0
}

// Labels are translation keys (under "register.") resolved at render time —
// this array is built once at module scope, before any t() is available.
const RISK_SCORE_FIELDS = [
  {
    key: 'bpStatusScore',
    labelKey: 'bpStatus',
    options: [
      { labelKey: 'bpControlledNoHtn', score: 0 },
      { labelKey: 'bpDiagnosedControlled', score: 1 },
      { labelKey: 'bpUncontrolled', score: 2 }
    ]
  },
  {
    key: 'renalMarkerScore',
    labelKey: 'renalMarker',
    options: [
      { labelKey: 'renalNormal', score: 0 },
      { labelKey: 'renalMicroalbuminuria', score: 2 },
      { labelKey: 'renalOvertProteinuria', score: 3 }
    ]
  },
  {
    key: 'priorDrHistoryScore',
    labelKey: 'priorDrHistory',
    options: [
      { labelKey: 'priorDrNone', score: 0 },
      { labelKey: 'priorDrMildNpdr', score: 2 },
      { labelKey: 'priorDrModSevere', score: 4 }
    ]
  },
  {
    key: 'smokingStatusScore',
    labelKey: 'smokingStatus',
    options: [
      { labelKey: 'smokingNeverFormer', score: 0 },
      { labelKey: 'smokingCurrent', score: 1 }
    ]
  }
]

const INSULIN_USE_OPTIONS = [
  { labelKey: 'no', score: 0 },
  { labelKey: 'yes', score: 2 }
]

// getRiskTierFromScore() (lib/utils.js) returns a stable English identifier
// used as a RISK_TIER_STYLES lookup key — map it to a translation key only
// for display, never change the identifier itself.
const RISK_TIER_LABEL_KEYS = {
  'Low risk profile': 'lowRiskProfile',
  'Moderate risk profile': 'moderateRiskProfile',
  'Elevated risk profile': 'elevatedRiskProfile'
}

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: '',
    patientId: '',
    diabetesDuration: '',
    hba1c: '',
    hypertension: 'Yes',
    familyHistory: 'No',
    preferredLanguage: '',
    phcId: 'PHC-HOSAKOTE',
    // Risk Score section — values hold the selected option's score (number) or '' if unselected
    bpStatusScore: '',
    renalMarkerScore: '',
    insulinUseScore: 0,
    priorDrHistoryScore: '',
    smokingStatusScore: ''
  })

  const diabetesDurationScore = useMemo(() => scoreDiabetesDuration(formData.diabetesDuration), [formData.diabetesDuration])
  const hba1cScore = useMemo(() => scoreHba1c(formData.hba1c), [formData.hba1c])

  const riskScoreTotal = useMemo(() => {
    const dropdownSum = RISK_SCORE_FIELDS.reduce((sum, field) => {
      const val = formData[field.key]
      return sum + (val === '' || val == null ? 0 : Number(val))
    }, 0)
    return dropdownSum + diabetesDurationScore + hba1cScore + (Number(formData.insulinUseScore) || 0)
  }, [formData, diabetesDurationScore, hba1cScore])

  const riskTierLabel = useMemo(() => getRiskTierFromScore(riskScoreTotal), [riskScoreTotal])

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [registeredId, setRegisteredId] = useState(formData.patientId)
  const [registeredName, setRegisteredName] = useState('')

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const errs = {}
    if (!formData.fullName.trim()) errs.fullName = t('register.pleaseEnterPatientName')
    const ageNum = parseFloat(formData.age)
    if (!formData.age || isNaN(ageNum) || ageNum <= 0 || ageNum > 120) errs.age = t('register.enterValidAge')
    if (!formData.gender) errs.gender = t('register.pleaseSelectGender')
    const durNum = parseFloat(formData.diabetesDuration)
    if (formData.diabetesDuration === '' || isNaN(durNum) || durNum < 0) errs.diabetesDuration = t('register.enterDiabetesDuration')
    if (!formData.preferredLanguage) errs.preferredLanguage = t('register.pleaseSelectPreferredLanguage')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return // already submitting — ignore repeat clicks
    if (!validate()) return

    setIsSubmitting(true)
    setApiError(null)

    try {
      const result = await createPatient({
        name: formData.fullName,
        age: parseInt(formData.age),
        gender: formData.gender,
        phc_id: formData.phcId,
        diabetes_duration_years: parseFloat(formData.diabetesDuration),
        hba1c_level: formData.hba1c ? parseFloat(formData.hba1c) : null,
        hypertension: formData.hypertension === 'Yes',
        family_history_dr: formData.familyHistory === 'Yes',
        preferred_language: formData.preferredLanguage,
        diabetes_duration_score: diabetesDurationScore,
        hba1c_score: hba1cScore,
        bp_status_score: formData.bpStatusScore === '' ? null : Number(formData.bpStatusScore),
        renal_marker_score: formData.renalMarkerScore === '' ? null : Number(formData.renalMarkerScore),
        insulin_use_score: Number(formData.insulinUseScore) || 0,
        prior_dr_history_score: formData.priorDrHistoryScore === '' ? null : Number(formData.priorDrHistoryScore),
        smoking_status_score: formData.smokingStatusScore === '' ? null : Number(formData.smokingStatusScore),
        risk_score_total: riskScoreTotal,
        risk_tier: riskTierLabel
      })
      // Use returned ID if available
      if (result?.id) {
        setRegisteredId(result.id)
        setRegisteredName(result.name || formData.fullName)
      }
      setIsRegistered(true)
      // Not resetting isSubmitting here — isRegistered gates the form's render,
      // so the button unmounts along with it rather than re-appearing enabled.
    } catch (err) {
      console.error('Register patient failed:', err)
      setApiError(t('register.couldNotConnect'))
      setIsSubmitting(false) // allow the user to retry
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A] pb-10">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#20312A] tracking-tight">{t('register.title')}</h1>
            <p className="text-sm text-[#66756D] mt-1">{t('register.addPatientDetails')}</p>
          </div>
        </div>

        {/* STEPPER */}
        <div className="bg-white border border-[#E2E7E3] rounded-2xl p-3.5 sm:p-4 mb-6 shadow-[0_2px_12px_rgba(40,89,67,0.04)]">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${isRegistered ? 'bg-[#047857] text-white' : 'bg-[#285943] text-white ring-4 ring-[#E6F4EA]'}`}>
                {isRegistered ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-[#285943] leading-tight">{t('register.stepRegister')}</span>
                <span className="block text-[10px] text-[#66756D] font-medium">{isRegistered ? t('register.completed') : t('register.active')}</span>
              </div>
            </div>
            <div className={`flex-1 mx-3 h-0.5 rounded-full transition-all ${isRegistered ? 'bg-[#047857]' : 'bg-gradient-to-r from-[#A7F3D0] to-[#E2E7E3]'}`} />
            <div className={`flex items-center gap-2 transition-all ${isRegistered ? 'opacity-100' : 'opacity-60'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs ${isRegistered ? 'bg-[#285943] text-white ring-4 ring-[#E6F4EA]' : 'bg-[#F8FAF7] border border-[#E2E7E3] text-[#66756D]'}`}>2</div>
              <div className="text-left hidden sm:block">
                <span className="block text-xs font-medium text-[#20312A] leading-tight">{t('register.stepScreen')}</span>
                <span className="block text-[10px] text-[#66756D]">{t('register.fundusCapture')}</span>
              </div>
            </div>
            <div className="flex-1 mx-3 h-0.5 rounded-full bg-[#E2E7E3]" />
            <div className="flex items-center gap-2 opacity-60">
              <div className="w-7 h-7 rounded-full bg-[#F8FAF7] border border-[#E2E7E3] text-[#66756D] flex items-center justify-center font-semibold text-xs">3</div>
              <div className="text-left hidden sm:block">
                <span className="block text-xs font-medium text-[#66756D] leading-tight">{t('register.stepResult')}</span>
                <span className="block text-[10px] text-[#66756D]">{t('register.aiAndReferral')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E7E3] rounded-2xl shadow-[0_2px_12px_rgba(40,89,67,0.04)] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#285943] via-[#16866A] to-[#047857]" />

          {!isRegistered ? (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8" noValidate>

              {/* API Error */}
              {apiError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* SECTION A: Personal Details */}
              <div className="space-y-5 pb-6 border-b border-[#E2E7E3]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E6F4EA] text-[#047857] flex items-center justify-center shrink-0 shadow-2xs"><User className="w-4 h-4" /></div>
                  <div>
                    <h2 className="font-heading font-bold text-base text-[#20312A] tracking-tight">{t('register.sectionAPersonalDetails')}</h2>
                    <p className="text-xs text-[#66756D]">{t('register.corePatientIdentification')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5" htmlFor="fullName">{t('register.fullName')} <span className="text-rose-600 font-bold">*</span></label>
                    <input id="fullName" type="text" placeholder={t('register.fullNamePlaceholder')} value={formData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className={`touch-target w-full h-11 rounded-xl border px-3.5 text-sm text-[#20312A] placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] focus-visible:ring-offset-2 transition-all ${errors.fullName ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-[#E2E7E3] bg-white'}`} />
                    {errors.fullName && <div className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1 font-medium"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{errors.fullName}</span></div>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5" htmlFor="age">{t('register.ageYears')} <span className="text-rose-600 font-bold">*</span></label>
                    <input id="age" type="number" min="1" max="120" placeholder={t('register.agePlaceholder')} value={formData.age} onChange={(e) => handleInputChange('age', e.target.value)}
                      className={`touch-target w-full h-11 rounded-xl border px-3.5 text-sm text-[#20312A] placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] transition-all ${errors.age ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-[#E2E7E3] bg-white'}`} />
                    {errors.age && <div className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1 font-medium"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{errors.age}</span></div>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5" htmlFor="gender">{t('register.gender')} <span className="text-rose-600 font-bold">*</span></label>
                    <select id="gender" value={formData.gender} onChange={(e) => handleInputChange('gender', e.target.value)}
                      className={`touch-target w-full h-11 rounded-xl border px-3.5 pr-10 text-sm text-[#20312A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] appearance-none cursor-pointer transition-all ${errors.gender ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-[#E2E7E3] bg-white'}`}>
                      <option value="" disabled>{t('register.selectGender')}</option>
                      <option value="Female">{t('register.female')}</option>
                      <option value="Male">{t('register.male')}</option>
                      <option value="Other">{t('register.other')}</option>
                    </select>
                    {errors.gender && <div className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1 font-medium"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{errors.gender}</span></div>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5" htmlFor="patientId">{t('register.patientIdLabel')}</label>
                    <input id="patientId" type="text" readOnly value={formData.patientId} placeholder={t('register.autoGeneratedOnSave')}
                      className="touch-target w-full h-11 rounded-xl border border-[#E2E7E3] bg-[#F8FAF7] px-3.5 text-sm font-semibold text-[#20312A] placeholder:font-normal placeholder:text-[#66756D] tracking-wide cursor-not-allowed select-all" />
                    <p className="text-xs text-[#66756D] mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-slate-400" /><span>{t('register.generatedByDrishti')}</span></p>
                  </div>
                </div>
              </div>

              {/* SECTION B: Clinical Details */}
              <div className="space-y-5 pb-6 border-b border-[#E2E7E3]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E6F4EA] text-[#047857] flex items-center justify-center shrink-0 shadow-2xs"><FileText className="w-4 h-4" /></div>
                  <div>
                    <h2 className="font-heading font-bold text-base text-[#20312A] tracking-tight">{t('register.sectionBClinicalDetails')}</h2>
                    <p className="text-xs text-[#66756D]">{t('register.diabeticOcularRiskBaseline')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5" htmlFor="diabetesDuration">{t('register.diabetesDurationYears')} <span className="text-rose-600 font-bold">*</span></label>
                    <input id="diabetesDuration" type="number" min="0" step="0.5" placeholder={t('register.diabetesDurationPlaceholder')} value={formData.diabetesDuration} onChange={(e) => handleInputChange('diabetesDuration', e.target.value)}
                      className={`touch-target w-full h-11 rounded-xl border px-3.5 text-sm text-[#20312A] placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] transition-all ${errors.diabetesDuration ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-[#E2E7E3] bg-white'}`} />
                    {errors.diabetesDuration && <div className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1 font-medium"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{errors.diabetesDuration}</span></div>}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-800" htmlFor="hba1c">{t('register.hba1cPercent')}</label>
                      <span className="text-[11px] text-[#66756D]">{t('register.optional')}</span>
                    </div>
                    <input id="hba1c" type="number" min="3.0" max="20.0" step="0.1" placeholder={t('register.hba1cPlaceholder')} value={formData.hba1c} onChange={(e) => handleInputChange('hba1c', e.target.value)}
                      className="touch-target w-full h-11 rounded-xl border border-[#E2E7E3] bg-white px-3.5 text-sm text-[#20312A] placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-2">{t('register.hypertension')} <span className="text-rose-600 font-bold">*</span></label>
                    <div className="grid grid-cols-2 gap-2" role="group">
                      {['Yes', 'No'].map(v => (
                        <button key={v} type="button" onClick={() => handleInputChange('hypertension', v)}
                          className={`touch-target h-11 flex items-center justify-center rounded-xl text-sm transition-all cursor-pointer ${formData.hypertension === v ? 'bg-[#E6F4EA] text-[#14532D] font-bold border border-[#A7F3D0] shadow-xs' : 'bg-white border border-[#E2E7E3] text-[#66756D] hover:bg-slate-50 font-medium'}`}>
                          {v === 'Yes' ? t('register.yes') : t('register.no')}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#66756D] mt-1">{t('register.diagnosedHighBP')}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-2">{t('register.familyHistoryDR')} <span className="text-rose-600 font-bold">*</span></label>
                    <div className="grid grid-cols-2 gap-2" role="group">
                      {['Yes', 'No'].map(v => (
                        <button key={v} type="button" onClick={() => handleInputChange('familyHistory', v)}
                          className={`touch-target h-11 flex items-center justify-center rounded-xl text-sm transition-all cursor-pointer ${formData.familyHistory === v ? 'bg-[#E6F4EA] text-[#14532D] font-bold border border-[#A7F3D0] shadow-xs' : 'bg-white border border-[#E2E7E3] text-[#66756D] hover:bg-slate-50 font-medium'}`}>
                          {v === 'Yes' ? t('register.yes') : t('register.no')}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#66756D] mt-1">{t('register.firstDegreeRelatives')}</p>
                  </div>

                  {/* Risk Score fields — weighted clinical risk profile (max 18 points) */}
                  {RISK_SCORE_FIELDS.map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-semibold text-slate-800 mb-1.5" htmlFor={field.key}>{t(`register.${field.labelKey}`)}</label>
                      <select id={field.key} value={formData[field.key]} onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className="touch-target w-full h-11 rounded-xl border border-[#E2E7E3] bg-white px-3.5 pr-10 text-sm text-[#20312A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] appearance-none cursor-pointer transition-all">
                        <option value="">{t('register.notAssessed')}</option>
                        {field.options.map(opt => (
                          <option key={opt.labelKey} value={opt.score}>{t(`register.${opt.labelKey}`)} ({opt.score} {t('register.pts')})</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-2">{t('register.insulinUse')}</label>
                    <div className="grid grid-cols-2 gap-2" role="group">
                      {INSULIN_USE_OPTIONS.map(opt => (
                        <button key={opt.labelKey} type="button" onClick={() => handleInputChange('insulinUseScore', opt.score)}
                          className={`touch-target h-11 flex items-center justify-center rounded-xl text-sm transition-all cursor-pointer ${Number(formData.insulinUseScore) === opt.score ? 'bg-[#E6F4EA] text-[#14532D] font-bold border border-[#A7F3D0] shadow-xs' : 'bg-white border border-[#E2E7E3] text-[#66756D] hover:bg-slate-50 font-medium'}`}>
                          {t(`register.${opt.labelKey}`)} ({opt.score} {t('register.pts')})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Auto-calculated total + tier */}
                <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4', RISK_TIER_STYLES[riskTierLabel])}>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-semibold">{t('register.totalRiskScore')}: <span className="font-mono font-extrabold">{riskScoreTotal}</span> / 18</span>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-white/60">
                    {t(`register.${RISK_TIER_LABEL_KEYS[riskTierLabel]}`)}
                  </span>
                </div>
              </div>

              {/* SECTION C: Care Context */}
              <div className="space-y-5 pb-6 border-b border-[#E2E7E3]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E6F4EA] text-[#047857] flex items-center justify-center shrink-0 shadow-2xs"><Globe className="w-4 h-4" /></div>
                  <div>
                    <h2 className="font-heading font-bold text-base text-[#20312A] tracking-tight">{t('register.sectionCCareContext')}</h2>
                    <p className="text-xs text-[#66756D]">{t('register.languageAndScreeningUnit')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5" htmlFor="preferredLanguage">{t('register.preferredLanguage')} <span className="text-rose-600 font-bold">*</span></label>
                    <select id="preferredLanguage" value={formData.preferredLanguage} onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
                      className={`touch-target w-full h-11 rounded-xl border px-3.5 pr-10 text-sm text-[#20312A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] appearance-none cursor-pointer transition-all ${errors.preferredLanguage ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-[#E2E7E3] bg-white'}`}>
                      <option value="" disabled>{t('register.selectLanguage')}</option>
                      <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                      <option value="Hindi">हिंदी (Hindi)</option>
                      <option value="Tamil">தமிழ் (Tamil)</option>
                      <option value="Telugu">తెలుగు (Telugu)</option>
                      <option value="Marathi">मराठी (MR)</option>
                      <option value="English">English</option>
                    </select>
                    {errors.preferredLanguage && <div className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1 font-medium"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{errors.preferredLanguage}</span></div>}
                    <p className="text-[11px] text-[#66756D] mt-1">{t('register.usedForPrintedReports')}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5" htmlFor="phcId">{t('register.primaryHealthCentre')}</label>
                    <input id="phcId" type="text" readOnly value={formData.phcId}
                      className="touch-target w-full h-11 rounded-xl border border-[#E2E7E3] bg-[#F8FAF7] px-3.5 text-sm font-semibold text-[#20312A] cursor-not-allowed select-all" />
                    <p className="text-[11px] text-[#66756D] mt-1">{t('register.lockedToScreeningUnit')}</p>
                  </div>
                </div>
              </div>
                            {/* CONSENT */}
              <div className="pt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="consent"
                    required
                    className="mt-1 w-4 h-4 rounded border-[#E2E7E3] text-[#16866A] cursor-pointer"
                    onChange={(e) => setConsentGiven(e.target.checked)}
                  />
                  <span className="text-xs text-[#475569] leading-relaxed">
                    I consent to AI-assisted screening of my health data for Diabetic Retinopathy detection purposes under the Digital Personal Data Protection (DPDP) Act 2023. I understand that this screening supports clinical decision-making and does not replace professional medical diagnosis.
                  </span>
                </label>
              </div>

              {/* ACTIONS */}

              {/* ACTIONS */}
              <div className="pt-6 border-t border-[#E2E7E3] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
                <Link to="/dashboard" className="min-h-[44px] h-11 w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-[#E2E7E3] rounded-xl text-sm font-semibold text-[#20312A] bg-white hover:bg-[#E6F4EA] shadow-xs transition-colors">
                  {t('common.cancel')}
                </Link>
                  <button type="submit" disabled={isSubmitting || !consentGiven}
                  className="min-h-[44px] h-11 w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl btn-gradient-pill text-[#14532D] font-bold shadow-xs hover:brightness-105 hover:shadow-md active:scale-[0.98] disabled:opacity-75 focus:outline-none transition-all cursor-pointer">
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#14532D]" /><span>{t('register.registering')}</span></>
                  ) : (
                    <><Check className="w-4 h-4 mr-2 text-[#14532D]" /><span>{t('register.registerButton')}</span></>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 sm:p-12 text-center animate-in fade-in duration-300">
              <div className="w-14 h-14 bg-[#E6F4EA] border border-[#047857]/20 text-[#047857] rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Check className="w-7 h-7" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-[#20312A] tracking-tight">{t('register.registrationSuccess')}</h2>
              <p className="text-sm text-[#66756D] mt-1">{t('register.youCanNowStart')}</p>
              <div className="max-w-xs mx-auto bg-[#E6F4EA] border border-[#047857]/20 rounded-xl p-3 text-center my-5 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#047857]">{t('register.patientIdLabel')}</div>
                <div className="text-xl font-heading font-extrabold text-[#20312A] tracking-wide mt-0.5">{registeredId}</div>
              </div>
              <p className="text-xs text-[#66756D] mb-8 flex items-center justify-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#047857]" />
                {t('register.phcRegisteredJustNow')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/dashboard" className="min-h-[44px] h-11 w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-[#E2E7E3] rounded-xl text-sm font-semibold text-[#20312A] bg-white hover:bg-[#E6F4EA] shadow-xs transition-colors">
                  {t('register.backToDashboard')}
                </Link>
                <button type="button" onClick={() => navigate('/screening', typeof registeredId === 'number'
                  ? { state: { patientId: registeredId, patientName: registeredName } }
                  : undefined)}
                  className="min-h-[44px] h-11 w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-bold text-[#14532D] btn-gradient-pill shadow-xs hover:brightness-105 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer">
                  <span>{t('register.startScreening')}</span>
                  <ArrowRight className="w-4 h-4 ml-2 text-[#14532D]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}