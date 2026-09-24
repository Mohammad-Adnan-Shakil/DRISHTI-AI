import { forwardRef } from 'react'
import { Eye } from 'lucide-react'

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
      className="p-8 sm:p-10 text-xs flex flex-col justify-between print:shadow-none print:border-none print:m-0 print:exact-colors print-color-adjust-exact"
    >
      <div>
        {/* 1. LETTERHEAD */}
        <div className="flex items-start justify-between border-b-4 border-[#285943] pb-4 mb-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#16866A] to-[#285943] text-white shadow-sm">
              <Eye size={18} strokeWidth={2.5} />
            </div>
            <span className="ml-2 text-xl font-extrabold tracking-tight text-[#20312A] font-heading">
              DRISHTI
            </span>
            <span className="bg-[#E6F4EA] text-[#047857] text-[10px] font-bold px-2 py-0.5 rounded-md ml-2 border border-[#047857]/20">
              CLINICAL AI
            </span>
          </div>

          <div className="text-right">
            <h2 className="text-base font-extrabold tracking-wide text-[#285943] uppercase font-heading">
              CLINICAL ASSESSMENT REPORT
            </h2>
            <div className="text-xs text-[#66756D] mt-0.5 space-y-0.5">
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

        {/* 2. PATIENT DEMOGRAPHICS BOX */}
        <div className="bg-[#F8FAF7] border border-[#E2E7E3] rounded-lg p-4 grid grid-cols-4 gap-4 text-sm mb-6">
          <div>
            <span className="block text-[10px] uppercase font-bold text-[#66756D]">
              Patient Name
            </span>
            <span className="text-[#20312A] font-semibold">
              {patient?.name ?? '—'}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-[#66756D]">
              Patient ID / ABHA
            </span>
            <span className="text-[#20312A] font-semibold font-mono">
              {patient?.id ?? '—'}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-[#66756D]">
              Age / Gender
            </span>
            <span className="text-[#20312A] font-semibold">
              {patient?.ageGender ?? '—'}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-[#66756D]">
              Facility / PHC
            </span>
            <span className="text-[#20312A] font-semibold">
              {patient?.phc ?? '—'}
            </span>
          </div>
          {(patient?.phone || patient?.email) && (
            <div className="col-span-4 pt-2 border-t border-[#E2E7E3]/60 flex items-center gap-6 text-xs text-[#66756D]">
              {patient?.phone && (
                <div>
                  <span className="font-bold uppercase text-[10px] text-[#66756D] mr-1.5">Phone:</span>
                  <span className="font-semibold text-[#20312A]">{patient.phone}</span>
                </div>
              )}
              {patient?.email && (
                <div>
                  <span className="font-bold uppercase text-[10px] text-[#66756D] mr-1.5">Email:</span>
                  <span className="font-semibold text-[#20312A]">{patient.email}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. AI FINDINGS & IMAGING (Side-by-Side) */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Left Column: AI-Assisted Screening Result */}
          <div className="border border-[#E2E7E3] rounded-lg p-4 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-[#66756D]">
                  AI-Assisted Screening Result
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#F8FAF7] border border-[#E2E7E3] text-[#285943]">
                  {gradeInfo?.risk ?? 'Moderate Risk'}
                </span>
              </div>
              <div
                className="text-xl font-bold mb-1"
                style={{ color: gradeColor }}
              >
                {gradeInfo?.title ?? `Grade ${activeGrade}`}
              </div>
              <p className="text-xs text-[#66756D] mb-4">
                Examined Eye:{' '}
                <span className="font-semibold text-[#20312A]">
                  {activeEye === 'OD' ? 'Right Eye (OD)' : 'Left Eye (OS)'}
                </span>{' '}
                &middot; Field:{' '}
                <span className="font-semibold text-[#20312A]">45° Non-Mydriatic</span>{' '}
                &middot; Quality:{' '}
                <span className="font-semibold text-[#20312A]">{qualityScore}%</span>
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-[#E2E7E3]">
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#66756D]">
                    Diagnostic Confidence
                  </span>
                  <span className="font-mono font-bold text-[#20312A]">
                    {activeConfidence}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#E2E7E3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#16866A] rounded-full transition-all"
                    style={{ width: `${activeConfidence}%` }}
                  />
                </div>
              </div>

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

          {/* Right Column: IMAGING */}
          <div className="border border-[#E2E7E3] rounded-lg p-4 bg-white flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#66756D] block mb-2.5">
                Retinal Imaging &amp; Salience Overlay
              </span>
              <div className="grid grid-cols-2 gap-2">
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
              </div>
            </div>
            <p className="text-[10px] text-[#66756D] text-center mt-3 font-medium italic">
              Fig 1: Standard Fundus | Fig 2: Grad-CAM Salience
            </p>
          </div>
        </div>
      </div>

      {/* 4. DOCTOR SIGNATURE LINE & DISCLAIMER */}
      <div>
        <div className="flex justify-between mt-12 pt-8 border-t border-[#E2E7E3] text-xs text-[#20312A] font-semibold">
          <div>Reviewing Physician: ____________________</div>
          <div>Signature &amp; Date: ____________________</div>
        </div>

        <div className="text-[9.5px] text-[#66756D] mt-6 pt-3 border-t border-[#E2E7E3] leading-relaxed">
          <strong>Medical Disclaimer:</strong> This clinical assessment document is generated by DRISHTI AI Screening Support under National Tele-Ophthalmology Protocols. AI triage recommendations must be confirmed by a licensed ophthalmologist or medical practitioner.
        </div>
      </div>
    </div>
  )
})

export default ScreeningReportPDF