import { forwardRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const GRADE_LABELS = { 0: 'No DR', 1: 'Mild NPDR', 2: 'Moderate NPDR', 3: 'Severe NPDR', 4: 'Proliferative DR' }
const GRADE_COLORS = { 0: '#059669', 1: '#D97706', 2: '#EA580C', 3: '#DC2626', 4: '#991B1B' }

// Offscreen-rendered A4 report captured by html2canvas + jsPDF (see
// lib/pdfExport.js). Fixed 794px width = A4 page width at 96dpi, so the
// captured image maps 1:1 onto a portrait A4 PDF page.
const PatientHistoryPDF = forwardRef(function PatientHistoryPDF(
  { patient, historyData = [], latestAssessment, chartData = [] },
  ref
) {
  const generatedOn = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

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
              Clinical Tele-Retina
            </span>
          </div>
          <p className="text-xs text-[#66756D] mt-1">
            National Tele-Ophthalmology Network &middot; Longitudinal Patient Assessment Report
          </p>
        </div>
        <div className="text-right text-[11px] text-[#66756D]">
          <div>Generated: {generatedOn}</div>
          <div>Report ID: DRISHTI-HX-{patient?.id ?? '—'}</div>
        </div>
      </div>

      {/* PATIENT DEMOGRAPHICS */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#285943] mb-2">Patient Demographics</h2>
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
            <span className="block text-[10px] uppercase text-[#66756D] font-semibold">Primary Facility</span>
            <span className="font-semibold text-[#20312A]">{patient?.phc ?? '—'}</span>
          </div>
        </div>
      </section>

      {/* 5-VISIT TABLE */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#285943] mb-2">Screening History (5 Most Recent Visits)</h2>
        <table className="w-full text-xs border-collapse border border-[#E2E7E3] rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-[#F8FAF7] text-[#66756D] uppercase text-[10px]">
              <th className="py-2 px-3 text-left border-b border-[#E2E7E3]">Date</th>
              <th className="py-2 px-3 text-left border-b border-[#E2E7E3]">Eye</th>
              <th className="py-2 px-3 text-left border-b border-[#E2E7E3]">AI Grade</th>
              <th className="py-2 px-3 text-left border-b border-[#E2E7E3]">Doctor Assessment</th>
              <th className="py-2 px-3 text-right border-b border-[#E2E7E3]">Care Plan</th>
            </tr>
          </thead>
          <tbody>
            {historyData.map((v, i) => (
              <tr key={i} className="border-b border-[#E2E7E3] last:border-0">
                <td className="py-2 px-3 font-medium">{v.date}</td>
                <td className="py-2 px-3 font-mono text-[#66756D]">{v.eye}</td>
                <td className="py-2 px-3">
                  <span style={{ color: GRADE_COLORS[v.grade] ?? '#20312A' }} className="font-bold">
                    Grade {v.grade} &middot; {GRADE_LABELS[v.grade] ?? 'Unknown'}
                  </span>
                </td>
                <td className="py-2 px-3 text-[#66756D]">{v.doctorAssessment}</td>
                <td className="py-2 px-3 text-right text-[#66756D]">{v.carePlan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* DR GRADE CHART */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#285943] mb-2">DR Grade Progression</h2>
        <div className="bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl p-4" style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 24, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E7E3" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#66756D' }} />
              <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 10, fill: '#66756D' }} />
              <Tooltip />
              <Line type="monotone" dataKey="grade" stroke="#285943" strokeWidth={2.5} dot={{ r: 4, fill: '#285943' }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* LATEST FUNDUS */}
      <section className="mb-6 flex gap-4 items-start bg-[#F8FAF7] border border-[#E2E7E3] rounded-xl p-4">
        <div className="w-20 h-20 rounded-lg bg-[#0F172A] shrink-0 flex items-center justify-center text-[#FFFFFF] text-[10px] font-mono">
          {latestAssessment?.eye ?? 'OD'}
        </div>
        <div className="text-xs space-y-1 flex-1">
          <div className="font-bold text-[#20312A]">
            Latest Fundus Inspection ({latestAssessment?.date ?? '—'})
          </div>
          <p className="text-[#66756D] leading-relaxed">{latestAssessment?.findings}</p>
          <div className="font-semibold text-[#20312A]">AI Confidence: {latestAssessment?.confidence}%</div>
        </div>
      </section>

      {/* CARE INSTRUCTIONS */}
      <section className="mb-6 bg-[#EAFBF7] border border-[#5EEAD4] rounded-xl p-4 text-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#0D9488] mb-1.5">Care Instructions &amp; Referral Action Plan</h2>
        <p className="text-[#20312A] leading-relaxed">{latestAssessment?.carePlan}</p>
      </section>

      {/* DISCLAIMER */}
      <section className="text-[10px] text-[#66756D] leading-relaxed border-t border-[#E2E7E3] pt-3">
        <strong>Medical Disclaimer:</strong> This clinical document is produced under the National Tele-Ophthalmology
        Screening Protocol. AI outputs serve as clinical decision support for licensed medical practitioners and do
        not substitute for definitive ophthalmic examination.
      </section>
    </div>
  )
})

export default PatientHistoryPDF
