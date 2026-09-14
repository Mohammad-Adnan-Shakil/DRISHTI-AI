import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, X, User, FileText, Globe, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import Navbar from '../components/Navbar'

export default function Register() {
  const navigate = useNavigate()
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: '',
    patientId: 'DRI-2026-00422',
    diabetesDuration: '',
    hba1c: '',
    hypertension: 'Yes',
    familyHistory: 'No',
    preferredLanguage: '',
    phcId: 'PHC-HOSAKOTE'
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!formData.fullName.trim()) {
      errs.fullName = 'Please enter the patient name'
    }
    const ageNum = parseFloat(formData.age)
    if (!formData.age || isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      errs.age = 'Enter a valid age (1 - 120)'
    }
    if (!formData.gender) {
      errs.gender = 'Please select gender'
    }
    const durNum = parseFloat(formData.diabetesDuration)
    if (formData.diabetesDuration === '' || isNaN(durNum) || durNum < 0) {
      errs.diabetesDuration = 'Enter diabetes duration in years'
    }
    if (!formData.preferredLanguage) {
      errs.preferredLanguage = 'Please select preferred language'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsRegistered(true)
    }, 600)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A] pb-10">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* PAGE HEADER WITH BREADCRUMB & CANCEL */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#20312A] tracking-tight">
              Register a new patient
            </h1>
            <p className="text-sm text-[#66756D] mt-1">
              Add patient details before starting retinal screening.
            </p>
          </div>
          <div className="hidden sm:block">
           
          </div>
        </div>

        {/* PROGRESS CONTEXT: COMPACT 3-STEP STEPPER */}
        <div className="bg-white border border-[#E2E7E3] rounded-2xl p-3.5 sm:p-4 mb-6 shadow-[0_2px_12px_rgba(40,89,67,0.04)]">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            {/* Step 1: Register (Active / Completed) */}
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                  isRegistered
                    ? 'bg-[#047857] text-white'
                    : 'bg-[#285943] text-white ring-4 ring-[#E6F4EA]'
                }`}
              >
                {isRegistered ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-[#285943] leading-tight">1. Register</span>
                <span className="block text-[10px] text-[#66756D] font-medium">
                  {isRegistered ? 'Completed' : 'Active'}
                </span>
              </div>
            </div>

            {/* Connector Line 1 (Subtle mint gradient) */}
            <div
              className={`flex-1 mx-3 h-0.5 rounded-full transition-all ${
                isRegistered
                  ? 'bg-[#047857]'
                  : 'bg-gradient-to-r from-[#A7F3D0] to-[#E2E7E3]'
              }`}
            />

            {/* Step 2: Screen (Next) */}
            <div className={`flex items-center gap-2 transition-all ${isRegistered ? 'opacity-100' : 'opacity-60'}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs ${
                  isRegistered
                    ? 'bg-[#285943] text-white ring-4 ring-[#E6F4EA]'
                    : 'bg-[#F8FAF7] border border-[#E2E7E3] text-[#66756D]'
                }`}
              >
                2
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-xs font-medium text-[#20312A] leading-tight">2. Screen</span>
                <span className="block text-[10px] text-[#66756D]">Fundus Capture</span>
              </div>
              <span className="sm:hidden text-xs font-medium text-[#66756D]">Screen</span>
            </div>

            {/* Connector Line 2 */}
            <div className="flex-1 mx-3 h-0.5 rounded-full bg-[#E2E7E3]" />

            {/* Step 3: Result */}
            <div className="flex items-center gap-2 opacity-60">
              <div className="w-7 h-7 rounded-full bg-[#F8FAF7] border border-[#E2E7E3] text-[#66756D] flex items-center justify-center font-semibold text-xs">
                3
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-xs font-medium text-[#66756D] leading-tight">3. Result</span>
                <span className="block text-[10px] text-[#66756D]">AI & Referral</span>
              </div>
              <span className="sm:hidden text-xs font-medium text-[#66756D]">Result</span>
            </div>
          </div>
        </div>

        {/* REGISTRATION FORM / SUCCESS CONTAINER CARD */}
        <div className="bg-white border border-[#E2E7E3] rounded-2xl shadow-[0_2px_12px_rgba(40,89,67,0.04)] overflow-hidden">
          {/* Card Top Accent Bar */}
          <div className="h-1 bg-gradient-to-r from-[#285943] via-[#16866A] to-[#047857]" />

          {!isRegistered ? (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8" noValidate>
              {/* SECTION A: Personal Details */}
              <div className="space-y-5 pb-6 border-b border-[#E2E7E3]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E6F4EA] text-[#047857] flex items-center justify-center shrink-0 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-base text-[#20312A] tracking-tight">
                      A. Personal Details
                    </h2>
                    <p className="text-xs text-[#66756D]">Core patient identification</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5" htmlFor="fullName">
                      Full Name <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="e.g. Sita Devi, Anand Sharma"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className={`touch-target w-full h-11 rounded-xl border px-3.5 text-sm text-[#20312A] placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] focus-visible:ring-offset-2 transition-all ${
                        errors.fullName
                          ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                          : 'border-[#E2E7E3] bg-white'
                      }`}
                    />
                    {errors.fullName && (
                      <div className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.fullName}</span>
                      </div>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5" htmlFor="age">
                      Age (years) <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      id="age"
                      type="number"
                      min="1"
                      max="120"
                      placeholder="e.g. 56"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className={`touch-target w-full h-11 rounded-xl border px-3.5 text-sm text-[#20312A] placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] focus-visible:ring-offset-2 transition-all ${
                        errors.age
                          ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                          : 'border-[#E2E7E3] bg-white'
                      }`}
                    />
                    {errors.age && (
                      <div className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.age}</span>
                      </div>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5" htmlFor="gender">
                      Gender <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className={`touch-target w-full h-11 rounded-xl border px-3.5 pr-10 text-sm text-[#20312A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] focus-visible:ring-offset-2 appearance-none cursor-pointer transition-all ${
                        errors.gender
                          ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                          : 'border-[#E2E7E3] bg-white'
                      }`}
                    >
                      <option value="" disabled>Select gender</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && (
                      <div className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.gender}</span>
                      </div>
                    )}
                  </div>

                  {/* Patient ID (Read-only, gray fill as only signal) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5" htmlFor="patientId">
                      Patient ID
                    </label>
                    <input
                      id="patientId"
                      type="text"
                      readOnly
                      value={formData.patientId}
                      className="touch-target w-full h-11 rounded-xl border border-[#E2E7E3] bg-[#F8FAF7] px-3.5 text-sm font-semibold text-[#20312A] tracking-wide cursor-not-allowed select-all"
                    />
                    <p className="text-xs text-[#66756D] mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Generated by DRISHTI</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION B: Clinical Details */}
              <div className="space-y-5 pb-6 border-b border-[#E2E7E3]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E6F4EA] text-[#047857] flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-base text-[#20312A] tracking-tight">
                      B. Clinical Details
                    </h2>
                    <p className="text-xs text-[#66756D]">Diabetic & ocular risk baseline</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                  {/* Diabetes Duration */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5" htmlFor="diabetesDuration">
                      Diabetes Duration (years) <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      id="diabetesDuration"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="e.g. 8"
                      value={formData.diabetesDuration}
                      onChange={(e) => handleInputChange('diabetesDuration', e.target.value)}
                      className={`touch-target w-full h-11 rounded-xl border px-3.5 text-sm text-[#20312A] placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] focus-visible:ring-offset-2 transition-all ${
                        errors.diabetesDuration
                          ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                          : 'border-[#E2E7E3] bg-white'
                      }`}
                    />
                    {errors.diabetesDuration && (
                      <div className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.diabetesDuration}</span>
                      </div>
                    )}
                  </div>

                  {/* HbA1c (%) Optional */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-800" htmlFor="hba1c">
                        HbA1c (%)
                      </label>
                      <span className="text-[11px] text-[#66756D]">Optional</span>
                    </div>
                    <input
                      id="hba1c"
                      type="number"
                      min="3.0"
                      max="20.0"
                      step="0.1"
                      placeholder="7.8"
                      value={formData.hba1c}
                      onChange={(e) => handleInputChange('hba1c', e.target.value)}
                      className="touch-target w-full h-11 rounded-xl border border-[#E2E7E3] bg-white px-3.5 text-sm text-[#20312A] placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] focus-visible:ring-offset-2 transition-all"
                    />
                  </div>

                  {/* Hypertension Soft Pill Control */}
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-800 mb-2">
                      Hypertension <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2" role="group">
                      <button
                        type="button"
                        onClick={() => handleInputChange('hypertension', 'Yes')}
                        className={`touch-target h-11 flex items-center justify-center rounded-xl text-sm transition-all cursor-pointer ${
                          formData.hypertension === 'Yes'
                            ? 'bg-[#E6F4EA] text-[#14532D] font-bold border border-[#A7F3D0] shadow-xs'
                            : 'bg-white border border-[#E2E7E3] text-[#66756D] hover:bg-slate-50 font-medium'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('hypertension', 'No')}
                        className={`touch-target h-11 flex items-center justify-center rounded-xl text-sm transition-all cursor-pointer ${
                          formData.hypertension === 'No'
                            ? 'bg-[#E6F4EA] text-[#14532D] font-bold border border-[#A7F3D0] shadow-xs'
                            : 'bg-white border border-[#E2E7E3] text-[#66756D] hover:bg-slate-50 font-medium'
                        }`}
                      >
                        No
                      </button>
                    </div>
                    <p className="text-[11px] text-[#66756D] mt-1">Diagnosed high blood pressure</p>
                  </div>

                  {/* Family History of DR Soft Pill Control */}
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-800 mb-2">
                      Family History of Diabetic Retinopathy <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2" role="group">
                      <button
                        type="button"
                        onClick={() => handleInputChange('familyHistory', 'Yes')}
                        className={`touch-target h-11 flex items-center justify-center rounded-xl text-sm transition-all cursor-pointer ${
                          formData.familyHistory === 'Yes'
                            ? 'bg-[#E6F4EA] text-[#14532D] font-bold border border-[#A7F3D0] shadow-xs'
                            : 'bg-white border border-[#E2E7E3] text-[#66756D] hover:bg-slate-50 font-medium'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('familyHistory', 'No')}
                        className={`touch-target h-11 flex items-center justify-center rounded-xl text-sm transition-all cursor-pointer ${
                          formData.familyHistory === 'No'
                            ? 'bg-[#E6F4EA] text-[#14532D] font-bold border border-[#A7F3D0] shadow-xs'
                            : 'bg-white border border-[#E2E7E3] text-[#66756D] hover:bg-slate-50 font-medium'
                        }`}
                      >
                        No
                      </button>
                    </div>
                    <p className="text-[11px] text-[#66756D] mt-1">First-degree relatives diagnosed</p>
                  </div>
                </div>
              </div>

              {/* SECTION C: Care Context */}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E6F4EA] text-[#047857] flex items-center justify-center shrink-0 shadow-2xs">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-base text-[#20312A] tracking-tight">
                      C. Care Context
                    </h2>
                    <p className="text-xs text-[#66756D]">Language & screening unit</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                  {/* Preferred Language */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5" htmlFor="preferredLanguage">
                      Preferred Language <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <select
                      id="preferredLanguage"
                      value={formData.preferredLanguage}
                      onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
                      className={`touch-target w-full h-11 rounded-xl border px-3.5 pr-10 text-sm text-[#20312A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] focus-visible:ring-offset-2 appearance-none cursor-pointer transition-all ${
                        errors.preferredLanguage
                          ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                          : 'border-[#E2E7E3] bg-white'
                      }`}
                    >
                      <option value="" disabled>Select language</option>
                      <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                      <option value="Hindi">हिंदी (Hindi)</option>
                      <option value="Tamil">தமிழ் (Tamil)</option>
                      <option value="Telugu">తెలుగు (Telugu)</option>
                      <option value="Marathi">मराठी (MR)</option>
                      <option value="English">English</option>
                    </select>
                    {errors.preferredLanguage && (
                      <div className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.preferredLanguage}</span>
                      </div>
                    )}
                    <p className="text-[11px] text-[#66756D] mt-1">Used for printed screening reports and voice prompts</p>
                  </div>

                  {/* PHC ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5" htmlFor="phcId">
                      Primary Health Centre (PHC ID)
                    </label>
                    <input
                      id="phcId"
                      type="text"
                      readOnly
                      value={formData.phcId}
                      className="touch-target w-full h-11 rounded-xl border border-[#E2E7E3] bg-[#F8FAF7] px-3.5 text-sm font-semibold text-[#20312A] cursor-not-allowed select-all"
                    />
                    <p className="text-[11px] text-[#66756D] mt-1">Locked to logged-in screening unit</p>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-6 border-t border-[#E2E7E3] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
                <Link
                  to="/dashboard"
                  className="min-h-[44px] h-11 w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-[#E2E7E3] rounded-xl text-sm font-semibold text-[#20312A] bg-white hover:bg-[#E6F4EA] shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] focus-visible:ring-offset-2 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] h-11 w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl btn-gradient-pill text-[#14532D] font-bold shadow-xs hover:brightness-105 hover:shadow-md active:scale-[0.98] disabled:opacity-75 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] focus-visible:ring-offset-2 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#14532D]" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2 text-[#14532D]" />
                      <span>Register Patient</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* SUCCESS PANEL */
            <div className="p-6 sm:p-12 text-center animate-in fade-in duration-300">
              <div className="w-14 h-14 bg-[#E6F4EA] border border-[#047857]/20 text-[#047857] rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Check className="w-7 h-7" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-[#20312A] tracking-tight">
                Patient registered successfully
              </h2>
              <p className="text-sm text-[#66756D] mt-1">
                You can now start the retinal screening.
              </p>

              {/* Patient ID Chip */}
              <div className="max-w-xs mx-auto bg-[#E6F4EA] border border-[#047857]/20 rounded-xl p-3 text-center my-5 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#047857]">PATIENT ID</div>
                <div className="text-xl font-heading font-extrabold text-[#20312A] tracking-wide mt-0.5">
                  {formData.patientId}
                </div>
              </div>

              <p className="text-xs text-[#66756D] mb-8 flex items-center justify-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#047857]" />
                PHC Hosakote • Registered just now
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/dashboard"
                  className="min-h-[44px] h-11 w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-[#E2E7E3] rounded-xl text-sm font-semibold text-[#20312A] bg-white hover:bg-[#E6F4EA] shadow-xs transition-colors"
                >
                  Back to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => navigate('/screening')}
                  className="min-h-[44px] h-11 w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-bold text-[#14532D] btn-gradient-pill shadow-xs hover:brightness-105 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Start Screening</span>
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
