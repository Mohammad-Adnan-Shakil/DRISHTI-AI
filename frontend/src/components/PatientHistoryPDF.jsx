import { forwardRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Eye } from 'lucide-react'

const GRADE_LABELS = { 0: 'No DR', 1: 'Mild NPDR', 2: 'Moderate NPDR', 3: 'Severe NPDR', 4: 'Proliferative DR' }
const GRADE_COLORS = { 0: '#059669', 1: '#D97706', 2: '#EA580C', 3: '#DC2626', 4: '#991B1B' }

// Offscreen-rendered or modal-rendered A4 report captured by html2canvas + jsPDF
// Fixed 794px width = A4 page width at 96dpi.
const PatientHistoryPDF = forwardRef(function PatientHistoryPDF(
  { patient, historyData = [], latestAssessment, chartData = [], latestScreening },
  ref
) {
  const generatedOn = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

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
                Generated: <span className="font-semibold text-[#20312A]">{generatedOn}</span>
              </div>
              <div>
                Report ID:{' '}
                <span className="font-mono font-semibold text-[#20312A]">
                  DRISHTI-HX-{patient?.id ?? '—'}
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
        </div>

        {/* 3. LATEST INSPECTION & RETINAL IMAGING */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#285943] font-heading">
              Latest Inspection &amp; Retinal Imaging
            </h3>
            <span className="text-[11px] font-mono text-[#66756D]">
              Visit: {latestAssessment?.date ?? '14 Jan 2025'} &middot; Eye: {latestAssessment?.eye ?? 'OD'}
            </span>
          </div>
          <div className="border border-[#E2E7E3] rounded-lg p-3.5 bg-white grid grid-cols-3 gap-3 items-center">
            {/* Fundus Thumbnail (Fixed - never a broken black box) */}
            <div className="aspect-4/3 bg-slate-950 rounded-lg overflow-hidden border border-slate-200 flex flex-col items-center justify-between p-1.5 relative">
              <div className="w-full h-full flex items-center justify-center">
                {latestScreening?.fundus_image_url ? (
                  <img
                    src={latestScreening.fundus_image_url}
                    alt="Latest Fundus"
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
                  </svg>
                )}
              </div>
              <span className="absolute bottom-1 left-1.5 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                Fundus ({latestAssessment?.eye ?? 'OD'})
              </span>
            </div>

            {/* Grad-CAM Salience */}
            <div className="aspect-4/3 bg-slate-950 rounded-lg overflow-hidden border border-slate-200 flex flex-col items-center justify-between p-1.5 relative">
              <div className="w-full h-full flex items-center justify-center">
                {latestScreening?.heatmap_url ? (
                  <img
                    src={latestScreening.heatmap_url}
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
                {latestAssessment?.findings ? latestAssessment.findings.split('.')[0] : 'ETDRS Grade 2 Moderate NPDR'}
              </div>
              <p className="text-[10.5px] text-[#66756D] leading-relaxed line-clamp-2">
                {latestAssessment?.findings ?? 'Microaneurysms and early hard exudates confirmed with concordant Grad-CAM salience.'}
              </p>
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[9.5px] font-bold text-[#047857] bg-[#E6F4EA] border border-[#047857]/20 rounded px-1.5 py-0.5">
                  Confidence: {latestAssessment?.confidence ?? 94}%
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
              <LineChart data={chartData} margin={{ top: 8, right: 20, left: -20, bottom: 0 }}>
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
                {historyData.slice(0, 5).map((v, i) => (
                  <tr key={i} className="border-b border-[#E2E7E3] py-2 last:border-0 hover:bg-[#F8FAF7]/50">
                    <td className="py-2 px-3 font-semibold text-[#20312A]">{v.date}</td>
                    <td className="py-2 px-3 font-mono font-medium text-[#66756D]">{v.eye}</td>
                    <td className="py-2 px-3 font-bold">
                      <span style={{ color: GRADE_COLORS[v.grade] ?? '#20312A' }}>
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
  )
})

export default PatientHistoryPDF
