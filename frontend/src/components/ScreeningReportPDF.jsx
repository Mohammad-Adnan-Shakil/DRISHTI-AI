import { forwardRef } from 'react'

// Offscreen-rendered or modal-rendered A4 single-visit report captured by html2canvas + jsPDF
// Fixed 794px width = A4 page width at 96dpi.
const ScreeningReportPDF = forwardRef(function ScreeningReportPDF(
  {
    patient,
    activeGrade = 2,
    activeConfidence = 94,
    activeEye = 'OD',
    gradeInfo,
    fundusUrl,
    gradcamUrl,
    vesselMapUrl,
    microaneurysmCount = 0,
    exudateAreaPercent = 0.0,
    hemorrhageCount = 0,
    opticDiscCenter = null,
    recommendationText,
    qualityScore = 92
  },
  ref
) {
  const generatedOn = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  const gradeColor =
    activeGrade >= 3 ? '#B91C1C' : activeGrade >= 1 ? '#D97706' : '#059669'

  // Real risk factors from Patient model in database
  const hba1cDisplay =
    patient?.hba1c_level != null
      ? `${patient.hba1c_level}%`
      : patient?.hba1c && patient.hba1c !== 'Not recorded'
      ? patient.hba1c
      : null

  const durationDisplay =
    patient?.diabetes_duration_years != null
      ? `${patient.diabetes_duration_years} yrs`
      : patient?.diabetesDuration && patient.diabetesDuration !== 'Not recorded'
      ? patient.diabetesDuration
      : null

  const hypertensionDisplay =
    patient?.hypertension != null
      ? (typeof patient.hypertension === 'boolean'
          ? (patient.hypertension ? 'Hypertensive' : 'Normotensive')
          : String(patient.hypertension))
      : null

  const familyHistoryDisplay =
    patient?.family_history_dr != null
      ? (patient.family_history_dr ? 'Positive' : 'None')
      : patient?.familyHistory
      ? 'Positive'
      : null

  const hasRiskFactors = Boolean(hba1cDisplay || durationDisplay || hypertensionDisplay || familyHistoryDisplay)

  return (
    <div
      ref={ref}
      style={{
        width: '794px',
        minHeight: '1050px',
        aspectRatio: '1 / 1.414',
        background: '#FFFFFF',
        color: '#20312A',
        fontFamily: 'Inter, Arial, sans-serif'
      }}
      className="p-8 sm:p-9 text-xs flex flex-col justify-between print:shadow-none print:border-none print:m-0 print:exact-colors print-color-adjust-exact box-border"
    >
      <div>
        {/* 1. LETTERHEAD */}
        <div className="flex items-start justify-between border-b-4 border-[#285943] pb-3.5 mb-5">
          <div className="flex items-center">
            <img
              src="/drishti-logo.png"
              alt="DRISHTI Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="ml-2.5 text-xl font-extrabold tracking-tight text-[#20312A] font-heading">
              DRISHTI
            </span>
            <span className="bg-[#E6F4EA] text-[#047857] text-[10px] font-bold px-2 py-0.5 rounded-md ml-2 border border-[#047857]/20">
              CLINICAL AI
            </span>
          </div>

          <div className="text-right">
            <h2 className="text-sm font-extrabold tracking-wide text-[#285943] uppercase font-heading">
              CLINICAL ASSESSMENT REPORT
            </h2>
            <div className="text-[11px] text-[#66756D] mt-0.5 space-y-0.5">
              <div>
                Generated: <span className="font-semibold text-[#20312A]">{generatedOn}</span>
              </div>
              <div>
                Report ID:{' '}
                <span className="font-mono font-semibold text-[#20312A]">
                  DRISHTI-CR-{patient?.id ?? '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. PATIENT DEMOGRAPHICS */}
        <div className="bg-[#F8FAF7] border border-[#E2E7E3] rounded-lg p-3.5 grid grid-cols-4 gap-3 text-xs mb-4">
          <div>
            <span className="block text-[9.5px] uppercase font-bold text-[#66756D]">
              Patient Name
            </span>
            <span className="text-[#20312A] font-semibold text-xs">
              {patient?.name ?? '—'}
            </span>
          </div>
          <div>
            <span className="block text-[9.5px] uppercase font-bold text-[#66756D]">
              Patient ID / ABHA
            </span>
            <span className="text-[#20312A] font-semibold font-mono text-xs">
              {patient?.id ?? '—'}
            </span>
          </div>
          <div>
            <span className="block text-[9.5px] uppercase font-bold text-[#66756D]">
              Age / Gender
            </span>
            <span className="text-[#20312A] font-semibold text-xs">
              {patient?.ageGender ?? '—'}
            </span>
          </div>
          <div>
            <span className="block text-[9.5px] uppercase font-bold text-[#66756D]">
              Facility / PHC
            </span>
            <span className="text-[#20312A] font-semibold text-xs">
              {patient?.phc ?? '—'}
            </span>
          </div>
          {(patient?.phone || patient?.email) && (
            <div className="col-span-4 pt-1.5 border-t border-[#E2E7E3]/60 flex items-center gap-6 text-[11px] text-[#66756D]">
              {patient?.phone && (
                <div>
                  <span className="font-bold uppercase text-[9.5px] text-[#66756D] mr-1.5">Phone:</span>
                  <span className="font-semibold text-[#20312A]">{patient.phone}</span>
                </div>
              )}
              {patient?.email && (
                <div>
                  <span className="font-bold uppercase text-[9.5px] text-[#66756D] mr-1.5">Email:</span>
                  <span className="font-semibold text-[#20312A]">{patient.email}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. RISK FACTOR BREAKDOWN (Real Patient Model Fields) */}
        {hasRiskFactors && (
          <div className="bg-[#F8FAF7] border border-[#E2E7E3] rounded-lg p-3 grid grid-cols-4 gap-3 text-xs mb-4">
            <div className="col-span-4 pb-1 border-b border-[#E2E7E3] flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#285943] tracking-wider">
                Risk Factor Breakdown
              </span>
              <span className="text-[10px] font-mono text-[#66756D]">
                Clinical Tier: <strong className="text-[#20312A]">{patient?.risk_tier || patient?.riskTier || 'Standard'}</strong>
              </span>
            </div>
            <div>
              <span className="block text-[9.5px] uppercase font-bold text-[#66756D]">HbA1c Level</span>
              <span className="text-[#20312A] font-semibold font-mono">
                {hba1cDisplay || '—'}
              </span>
            </div>
            <div>
              <span className="block text-[9.5px] uppercase font-bold text-[#66756D]">Diabetes Duration</span>
              <span className="text-[#20312A] font-semibold">
                {durationDisplay || '—'}
              </span>
            </div>
            <div>
              <span className="block text-[9.5px] uppercase font-bold text-[#66756D]">Hypertension</span>
              <span className="text-[#20312A] font-semibold">
                {hypertensionDisplay || '—'}
              </span>
            </div>
            <div>
              <span className="block text-[9.5px] uppercase font-bold text-[#66756D]">Family History DR</span>
              <span className="text-[#20312A] font-semibold">
                {familyHistoryDisplay || '—'}
              </span>
            </div>
          </div>
        )}

        {/* 4. LESION SUMMARY (Real Detection Output Fields) */}
        <div className="bg-white border border-[#E2E7E3] rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#E2E7E3]">
            <span className="text-[10px] uppercase font-bold text-[#285943] tracking-wider">
              Lesion Summary (Computer Vision Biomarkers)
            </span>
            <span className="text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded bg-[#E6F4EA] text-[#047857] border border-[#047857]/20">
              Automated Detection
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2.5 text-center">
            <div className="bg-[#F8FAF7] p-2 rounded border border-[#E2E7E3]">
              <span className="block text-[9.5px] uppercase font-bold text-[#66756D]">Microaneurysm Count</span>
              <span className={`text-sm font-extrabold font-mono ${(microaneurysmCount ?? 0) > 0 ? 'text-rose-700' : 'text-[#20312A]'}`}>
                {microaneurysmCount != null ? microaneurysmCount : 0}
              </span>
              <span className="block text-[9px] text-[#66756D]">
                {(microaneurysmCount ?? 0) === 0 ? 'None detected' : 'Detected'}
              </span>
            </div>
            <div className="bg-[#F8FAF7] p-2 rounded border border-[#E2E7E3]">
              <span className="block text-[9.5px] uppercase font-bold text-[#66756D]">Hemorrhage Count</span>
              <span className={`text-sm font-extrabold font-mono ${(hemorrhageCount ?? 0) > 0 ? 'text-red-700' : 'text-[#20312A]'}`}>
                {hemorrhageCount != null ? hemorrhageCount : 0}
              </span>
              <span className="block text-[9px] text-[#66756D]">
                {(hemorrhageCount ?? 0) === 0 ? 'None detected' : 'Detected'}
              </span>
            </div>
            <div className="bg-[#F8FAF7] p-2 rounded border border-[#E2E7E3]">
              <span className="block text-[9.5px] uppercase font-bold text-[#66756D]">Exudate Area</span>
              <span className={`text-sm font-extrabold font-mono ${(exudateAreaPercent ?? 0) > 0 ? 'text-amber-800' : 'text-[#20312A]'}`}>
                {exudateAreaPercent != null && exudateAreaPercent > 0 ? `${exudateAreaPercent}%` : '0%'}
              </span>
              <span className="block text-[9px] text-[#66756D]">
                {(exudateAreaPercent ?? 0) > 0 ? 'Retinal coverage' : 'None detected'}
              </span>
            </div>
            <div className="bg-[#F8FAF7] p-2 rounded border border-[#E2E7E3]">
              <span className="block text-[9.5px] uppercase font-bold text-[#66756D]">Optic Disc Center</span>
              <span className={`text-xs font-extrabold font-mono ${opticDiscCenter ? 'text-teal-800' : 'text-[#20312A]'}`}>
                {opticDiscCenter
                  ? (Array.isArray(opticDiscCenter) ? `[${opticDiscCenter.join(', ')}]` : opticDiscCenter)
                  : 'Localized'}
              </span>
              <span className="block text-[9px] text-[#66756D]">
                {opticDiscCenter ? 'Co-ordinates' : 'Normal region'}
              </span>
            </div>
          </div>
        </div>

        {/* 5. AI DIAGNOSTIC TRIAGE & 3-IMAGE MODALITIES */}
        <div className="border border-[#E2E7E3] rounded-lg p-3.5 bg-white mb-4 space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E7E3]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#66756D]">
                AI-Assisted Screening Result:
              </span>
              <span
                className="text-base font-extrabold font-heading"
                style={{ color: gradeColor }}
              >
                {gradeInfo?.title ?? `Grade ${activeGrade}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#F8FAF7] border border-[#E2E7E3] text-[#285943]">
                {gradeInfo?.risk ?? 'Moderate Risk'}
              </span>
              <span className="text-[10px] font-mono text-[#66756D]">
                Confidence: <strong>{activeConfidence}%</strong> &middot; Quality: <strong>{qualityScore}%</strong>
              </span>
            </div>
          </div>

          {/* 3-Column Multimodal Imaging (Standard Fundus, Grad-CAM, Vessel Map) */}
          <div className="grid grid-cols-3 gap-3">
            {/* Fig 1: Standard Fundus */}
            <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center relative">
              {fundusUrl ? (
                <img
                  src={fundusUrl}
                  alt="Standard Fundus"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <svg className="w-24 h-24 select-none" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="#9A3412" />
                  <circle cx="42" cy="46" r="8" fill="#FED7AA" />
                  <circle cx="62" cy="50" r="10" fill="#431407" opacity="0.8" />
                  <path d="M42,46 Q45,30 55,22 T75,16" stroke="#7F1D1D" strokeWidth="1.5" fill="none" />
                  <path d="M42,46 Q47,60 60,70 T80,80" stroke="#7F1D1D" strokeWidth="1.6" fill="none" />
                </svg>
              )}
              <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                {activeEye} · 45°
              </span>
            </div>

            {/* Fig 2: Grad-CAM Salience */}
            <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center relative">
              {gradcamUrl ? (
                <img
                  src={gradcamUrl}
                  alt="Grad-CAM Salience"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <svg className="w-24 h-24 select-none" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="#9A3412" />
                  <circle cx="48" cy="48" r="26" fill="#EF4444" opacity="0.8" filter="blur(3px)" />
                  <circle cx="48" cy="48" r="16" fill="#FBBF24" opacity="0.7" filter="blur(2px)" />
                </svg>
              )}
              <span className="absolute bottom-1 left-1 bg-black/75 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-mono">
                Grad-CAM
              </span>
            </div>

            {/* Fig 3: Vessel Map (Frangi) */}
            <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center relative">
              {vesselMapUrl ? (
                <img
                  src={vesselMapUrl}
                  alt="Frangi Vessel Map"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <svg className="w-24 h-24 select-none" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="#020617" />
                  <path d="M50,95 Q50,50 30,15 M50,65 Q65,40 85,25 M50,80 Q40,65 15,55 M50,45 Q70,30 90,10" stroke="#2DD4BF" strokeWidth="1.8" fill="none" />
                </svg>
              )}
              <span className="absolute bottom-1 left-1 bg-black/75 text-teal-300 text-[9px] px-1.5 py-0.5 rounded font-mono">
                Vessel Map
              </span>
            </div>
          </div>
          <p className="text-[9.5px] text-[#66756D] text-center font-medium italic">
            Fig 1: Standard Fundus ({activeEye}) | Fig 2: Grad-CAM Salience | Fig 3: Frangi Vessel Map
          </p>

          {/* Clinical Recommendation Text */}
          <div className="bg-[#F8FAF7] rounded-md p-2.5 border border-[#E2E7E3]">
            <span className="text-[10px] uppercase font-bold text-[#285943] block mb-0.5">
              Clinical Recommendation
            </span>
            <p className="text-xs text-[#20312A] leading-relaxed">
              {recommendationText ?? gradeInfo?.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* 6. DOCTOR SIGNATURE LINE & DISCLAIMER */}
      <div className="pt-2">
        <div className="flex justify-between pt-4 border-t border-[#E2E7E3] text-xs text-[#20312A] font-semibold">
          <div>Reviewing Physician: ____________________</div>
          <div>Signature &amp; Date: ____________________</div>
        </div>

        <div className="text-[9px] text-[#66756D] mt-4 pt-2 border-t border-[#E2E7E3] leading-relaxed">
          <strong>Medical Disclaimer:</strong> This clinical assessment document is generated by DRISHTI AI Screening Support under National Tele-Ophthalmology Protocols. AI triage recommendations must be confirmed by a licensed ophthalmologist or medical practitioner.
        </div>
      </div>
    </div>
  )
})

export default ScreeningReportPDF