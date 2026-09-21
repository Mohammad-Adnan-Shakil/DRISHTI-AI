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
  {
    patient,
    activeGrade,
    activeConfidence,
    activeEye,
    gradeInfo,
    gradcamUrl,
    recommendationText,
    qualityScore
  },
  ref
) {
  const generatedOn = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  const gradeColor = RISK_TEXT_COLORS[activeGrade] ?? '#20312A'

  return (
    <div
      ref={ref}
      style={{
        width: '794px',
        background: '#FFFFFF',
        color: '#20312A',
        fontFamily: 'Inter, Arial, sans-serif'
      }}
      className="p-10 text-sm"
    >
      {/* HEADER */}
      <div className="border-b border-[#E2E7E3] pb-4 mb-6">
        <div
          style={{
            display: 'table',
            width: '100%',
            tableLayout: 'fixed'
          }}
        >
          {/* LEFT HEADER */}
          <div
            style={{
              display: 'table-cell',
              width: '65%',
              verticalAlign: 'middle'
            }}
          >
            <div
              style={{
                display: 'table',
                height: '60px'
              }}
            >
              {/* LOGO */}
              <div
                style={{
                  display: 'table-cell',
                  width: '60px',
                  height: '60px',
                  verticalAlign: 'middle'
                }}
              >
                <img
                  src="/drishti-logo.png"
                  alt="DRISHTI"
                  style={{
                    height: '60px',
                    width: '60px',
                    objectFit: 'cover',
                    borderRadius: '9999px',
                    display: 'block'
                  }}
                />
              </div>

              {/* AI SCREENING REPORT BADGE */}
              <div
                style={{
                  display: 'table-cell',
                  verticalAlign: 'middle',
                  paddingLeft: '8px',
                  height: '60px'
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '5px 10px',
                    borderRadius: '9999px',
                    backgroundColor: '#E6F4EA',
                    color: '#047857',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    lineHeight: '14px',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  AI Screening Report
                </div>
              </div>
            </div>

            <p className="text-xs text-[#66756D] mt-1">
              Single-Visit Retinal Screening Summary
            </p>
          </div>

          {/* RIGHT HEADER */}
          <div
            style={{
              display: 'table-cell',
              width: '35%',
              verticalAlign: 'middle',
              textAlign: 'right'
            }}
          >
            <div className="text-[11px] text-[#66756D]">
              <div>Generated: {generatedOn}</div>
              <div>Report ID: DRISHTI-SR-{patient?.id ?? '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* PATIENT INFO */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#285943] mb-2">
          Patient Information
        </h2>

        <div className="grid grid-cols-4 gap-4 bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl p-4 text-xs">
          <div>
            <span className="block text-[10px] uppercase text-[#66756D] font-semibold">
              Name
            </span>
            <span className="font-bold text-[#20312A]">
              {patient?.name ?? '—'}
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase text-[#66756D] font-semibold">
              Patient ID
            </span>
            <span className="font-mono font-semibold text-[#20312A]">
              {patient?.id ?? '—'}
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase text-[#66756D] font-semibold">
              Age / Gender
            </span>
            <span className="font-semibold text-[#20312A]">
              {patient?.ageGender ?? '—'}
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase text-[#66756D] font-semibold">
              PHC
            </span>
            <span className="font-semibold text-[#20312A]">
              {patient?.phc ?? '—'}
            </span>
          </div>
        </div>
      </section>

      {/* AI RESULT */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#285943] mb-2">
          AI-Assisted Screening Result
        </h2>

        <div
          style={{
            border: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            borderRadius: '12px',
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >
          {/* RESULT HEADER */}
          <div
            style={{
              display: 'table',
              width: '100%',
              tableLayout: 'fixed'
            }}
          >
            {/* LEFT RESULT CONTENT */}
            <div
              style={{
                display: 'table-cell',
                width: '75%',
                verticalAlign: 'middle',
                paddingRight: '16px',
                boxSizing: 'border-box'
              }}
            >
              <div
                style={{
                  color: gradeColor,
                  fontSize: '18px',
                  fontWeight: 800,
                  lineHeight: '23px',
                  margin: 0,
                  padding: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                {gradeInfo?.title ?? `Grade ${activeGrade}`}
              </div>

              <div
                style={{
                  color: '#66756D',
                  fontSize: '12px',
                  marginTop: '2px',
                  lineHeight: '17px',
                  whiteSpace: 'nowrap'
                }}
              >
                Examined Eye:{' '}
                <strong>
                  {activeEye === 'OD'
                    ? 'Right Eye (OD)'
                    : 'Left Eye (OS)'}
                </strong>{' '}
                &middot; Field: 45&deg; Non-Mydriatic &middot; Image Quality:{' '}
                {qualityScore}%
              </div>
            </div>

            {/* RIGHT RISK BADGE */}
            <div
              style={{
                display: 'table-cell',
                width: '25%',
                verticalAlign: 'middle',
                textAlign: 'right',
                boxSizing: 'border-box'
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: `1px solid ${gradeColor}`,
                  color: gradeColor,
                  fontSize: '12px',
                  fontWeight: 800,
                  lineHeight: '16px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  verticalAlign: 'middle'
                }}
              >
                {gradeInfo?.risk ?? '—'}
              </span>
            </div>
          </div>

          {/* CONFIDENCE */}
          <div
            style={{
              marginTop: '16px'
            }}
          >
            <div
              style={{
                display: 'table',
                width: '100%',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '4px'
              }}
            >
              <span
                style={{
                  display: 'table-cell',
                  color: '#66756D'
                }}
              >
                Diagnostic AI Confidence
              </span>

              <span
                style={{
                  display: 'table-cell',
                  color: '#20312A',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  textAlign: 'right'
                }}
              >
                {activeConfidence}%
              </span>
            </div>

            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#F1F5F9',
                borderRadius: '9999px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${activeConfidence}%`,
                  backgroundColor: '#16866A',
                  borderRadius: '9999px'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* GRAD-CAM THUMBNAIL */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#285943] mb-2">
          Grad-CAM Attention Map
        </h2>

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
            The highlighted region represents the visual attention map of
            the neural network, concentrated on areas suggestive of the
            identified pathology. Intended for clinical assistance, not
            definitive lesion segmentation.
          </p>
        </div>
      </section>

      {/* CLINICAL RECOMMENDATION */}
      <section className="mb-6 bg-[#EAFBF7] border border-[#5EEAD4] rounded-xl p-4 text-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#0D9488] mb-1.5">
          Clinical Recommendation
        </h2>

        <div className="font-bold text-[#20312A] mb-1">
          {gradeInfo?.recommendationTitle}
        </div>

        <p className="text-[#20312A] leading-relaxed">
          {recommendationText ?? gradeInfo?.recommendation}
        </p>
      </section>

      {/* DOCTOR SIGN-OFF */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#285943] mb-2">
          Doctor Sign-Off
        </h2>

        <div className="border border-[#E2E7E3] rounded-xl p-4 grid grid-cols-2 gap-6 text-xs">
          <div>
            <span className="block text-[10px] uppercase text-[#66756D] font-semibold mb-4">
              Reviewing Doctor
            </span>
            <div className="border-b border-[#94A3B8] h-6" />
          </div>

          <div>
            <span className="block text-[10px] uppercase text-[#66756D] font-semibold mb-4">
              Signature &amp; Date
            </span>
            <div className="border-b border-[#94A3B8] h-6" />
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="text-[10px] text-[#66756D] leading-relaxed border-t border-[#E2E7E3] pt-3">
        <strong>Medical Disclaimer:</strong> AI screening supports clinical
        decision-making and does not replace professional diagnosis. Final
        assessment and treatment decisions remain the responsibility of the
        qualified examining physician.
      </section>
    </div>
  )
})

export default ScreeningReportPDF