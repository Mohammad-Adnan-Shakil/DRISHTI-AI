import { forwardRef } from 'react'

const RISK_TEXT_COLORS = {
  0: '#059669',
  1: '#D97706',
  2: '#EA580C',
  3: '#DC2626',
  4: '#991B1B'
}

// Offscreen-rendered A4 single-visit report captured by html2canvas + jsPDF
// (see lib/pdfExport.js). Fixed 794px width = A4 page width at 96dpi.
const ScreeningReportPDF = forwardRef(function ScreeningReportPDF(
  { patient, activeGrade, activeConfidence, activeEye, gradeInfo, gradcamUrl, recommendationText, qualityScore },
  ref
) {
  const generatedOn = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const gradeColor = RISK_TEXT_COLORS[activeGrade] ?? '#20312A'

  return (
    <div
      ref={ref}
      style={{ width: '794px', background: '#FFFFFF', color: '#20312A', fontFamily: 'Inter, Arial, sans-serif' }}
      className="p-10 text-sm"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between border-b border-[#E2E7E3] pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-[#20312A]">DRISHTI</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#047857]">
              AI Screening Report
            </span>
          </div>
          <p className="text-xs text-[#66756D] mt-1">Single-Visit Retinal Screening Summary</p>
        </div>
        <div className="text-right text-[11px] text-[#66756D]">
          <div>Generated: {generatedOn}</div>
          <div>Report ID: DRISHTI-SR-{patient?.id ?? '—'}</div>
        </div>
      </div>

      {/* PATIENT INFO */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#285943] mb-2">Patient Information</h2>
        <div className="grid grid-cols-4 gap-4 bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl p-4 text-xs">
          <div>
            <span className="block text-[10px] uppercase text-[#66756D] font-semibold">Name</span>
            <span className="font-bold text-[#20312A]">{patient?.name ?? '—'}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-[#66756D] font-semibold">Patient ID</span>
            <span className="font-mono font-semibold text-[#20312A]">{patient?.id ?? '—'}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-[#66756D] font-semibold">Age / Gender</span>
            <span className="font-semibold text-[#20312A]">{patient?.ageGender ?? '—'}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-[#66756D] font-semibold">PHC</span>
            <span className="font-semibold text-[#20312A]">{patient?.phc ?? '—'}</span>
          </div>
        </div>
      </section>

      {/* AI RESULT */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#285943] mb-2">AI-Assisted Screening Result</h2>
        <div className="border border-[#E2E7E3] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: gradeColor }} className="text-lg font-extrabold">
                {gradeInfo?.title ?? `Grade ${activeGrade}`}
              </div>
              <div className="text-xs text-[#66756D] mt-0.5">
                Examined Eye: <strong>{activeEye === 'OD' ? 'Right Eye (OD)' : 'Left Eye (OS)'}</strong> &middot; Field: 45&deg; Non-Mydriatic &middot; Image Quality: {qualityScore}%
              </div>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full border" style={{ color: gradeColor, borderColor: gradeColor }}>
              {gradeInfo?.risk ?? '—'}
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-[#66756D]">Diagnostic AI Confidence</span>
              <span className="font-mono font-bold text-[#20312A]">{activeConfidence}%</span>
            </div>
            <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div className="h-full bg-[#16866A] rounded-full" style={{ width: `${activeConfidence}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* GRAD-CAM THUMBNAIL */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#285943] mb-2">Grad-CAM Attention Map</h2>
        <div className="flex items-center gap-4 bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl p-4">
          {gradcamUrl ? (
            <img
              src={gradcamUrl}
              crossOrigin="anonymous"
              alt="Grad-CAM heatmap"
              className="w-32 h-32 object-cover rounded-lg border border-[#1E293B] shrink-0"
            />
          ) : (
            <div className="w-32 h-32 rounded-lg bg-[#0F172A] text-[#94A3B8] text-[10px] flex items-center justify-center text-center shrink-0 p-2">
              No Grad-CAM image available
            </div>
          )}
          <p className="text-xs text-[#66756D] leading-relaxed">
            The highlighted region represents the visual attention map of the neural network, concentrated on areas
            suggestive of the identified pathology. Intended for clinical assistance, not definitive lesion
            segmentation.
          </p>
        </div>
      </section>

      {/* CLINICAL RECOMMENDATION */}
      <section className="mb-6 bg-[#EAFBF7] border border-[#5EEAD4] rounded-xl p-4 text-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#0D9488] mb-1.5">Clinical Recommendation</h2>
        <div className="font-bold text-[#20312A] mb-1">{gradeInfo?.recommendationTitle}</div>
        <p className="text-[#20312A] leading-relaxed">{recommendationText ?? gradeInfo?.recommendation}</p>
      </section>

      {/* DOCTOR SIGN-OFF */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#285943] mb-2">Doctor Sign-Off</h2>
        <div className="border border-[#E2E7E3] rounded-xl p-4 grid grid-cols-2 gap-6 text-xs">
          <div>
            <span className="block text-[10px] uppercase text-[#66756D] font-semibold mb-4">Reviewing Doctor</span>
            <div className="border-b border-[#94A3B8] h-6" />
          </div>
          <div>
            <span className="block text-[10px] uppercase text-[#66756D] font-semibold mb-4">Signature &amp; Date</span>
            <div className="border-b border-[#94A3B8] h-6" />
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="text-[10px] text-[#66756D] leading-relaxed border-t border-[#E2E7E3] pt-3">
        <strong>Medical Disclaimer:</strong> AI screening supports clinical decision-making and does not replace
        professional diagnosis. Final assessment and treatment decisions remain the responsibility of the qualified
        examining physician.
      </section>
    </div>
  )
})

export default ScreeningReportPDF
