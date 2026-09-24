import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Calendar, AlertTriangle, CheckCircle2, Users, Clock, ArrowRight, ShieldCheck } from 'lucide-react'
import DoctorNavbar from '../components/DoctorNavbar'
import GradeBadge from '../components/GradeBadge'
import Skeleton from '../components/Skeleton'
import { getPendingScreenings, getReviewedScreenings, getScreeningStats } from '../lib/api'

function getRailColor(grade) {
  if (grade >= 4) return 'border-l-[#991B1B]'
  if (grade === 3) return 'border-l-[#DC2626]'
  if (grade === 2) return 'border-l-[#EA580C]'
  return 'border-l-[#94A3B8]'
}

function getUrgency(grade) {
  if (grade >= 4) return 'Critical'
  if (grade === 3) return 'Urgent'
  if (grade === 2) return 'High'
  return 'Routine'
}

// Collapses duplicate submissions for the same patient — e.g. a retry or
// double-tap that created two near-identical screening records — keeping
// only the latest when two records for the same patient_id land within 60s
// of each other.
function dedupeByPatientAndTime(records) {
  const DEDUPE_WINDOW_MS = 60 * 1000
  const byPatient = new Map()

  for (const r of records) {
    const pid = r.patient_id ?? r.id ?? 'unknown'
    if (!byPatient.has(pid)) byPatient.set(pid, [])
    byPatient.get(pid).push(r)
  }

  const result = []
  for (const entries of byPatient.values()) {
    const sorted = [...entries].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      return ta - tb
    })

    const kept = []
    for (const entry of sorted) {
      const ts = entry.created_at ? new Date(entry.created_at).getTime() : null
      const last = kept[kept.length - 1]
      const lastTs = last?.created_at ? new Date(last.created_at).getTime() : null
      if (last && ts != null && lastTs != null && Math.abs(ts - lastTs) <= DEDUPE_WINDOW_MS) {
        // Same patient, within the dedupe window — the later record wins.
        kept[kept.length - 1] = entry
      } else {
        kept.push(entry)
      }
    }
    result.push(...kept)
  }
  return result
}

// Shared mapping from /screenings/pending and /screenings/reviewed rows
// (same response shape) to the display format this page renders.
function mapScreeningRows(rows) {
  return rows.map(s => ({
    id: s.patient_id ?? s.id ?? s.screening_id,
    name: s.patient_name || s.name || 'Unnamed patient',
    phc: s.phc_id || 'N/A',
    drGrade: s.dr_grade ?? 0,
    confidence: s.dr_confidence != null ? `${s.dr_confidence}%` : 'N/A',
    time: s.created_at ? new Date(s.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
    urgency: getUrgency(s.dr_grade ?? 0),
    railColor: getRailColor(s.dr_grade ?? 0)
  }))
}

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [queueData, setQueueData] = useState([])
  const [reviewedData, setReviewedData] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      setQueueData([])
      setReviewedData([])
      setStats(null)
      try {
        const [pendingRes, reviewedRes, statsRes] = await Promise.allSettled([
          getPendingScreenings(),
          getReviewedScreenings(),
          getScreeningStats()
        ])

        if (pendingRes.status === 'fulfilled') {
          const deduped = dedupeByPatientAndTime(pendingRes.value)
          setQueueData(mapScreeningRows(deduped))
        }

        if (reviewedRes.status === 'fulfilled') {
          setReviewedData(mapScreeningRows(reviewedRes.value))
        }

        if (statsRes.status === 'fulfilled' && statsRes.value) {
          const s = statsRes.value
          setStats({
            pending: s.pending_reviews ?? null,
            reviewed: s.reviewed_today ?? null,
            confirmed: s.referrals_confirmed ?? null,
          })
        }
        const failures = [
          pendingRes.status === 'rejected' ? 'pending screenings' : null,
          reviewedRes.status === 'rejected' ? 'reviewed screenings' : null,
          statsRes.status === 'rejected' ? 'screening statistics' : null,
        ].filter(Boolean)
        if (failures.length > 0) {
          setError(`Could not load ${failures.join(' and ')}. Please retry.`)
        }
      } catch (err) {
        console.error('DoctorDashboard fetch failed:', err)
        setError('Could not load the review queue. Please retry.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [reloadToken])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A] antialiased">
        <DoctorNavbar />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div role="alert" className="bg-white rounded-xl border border-amber-200 p-8 text-center">
            <AlertTriangle className="w-10 h-10 mx-auto text-amber-600 mb-3" />
            <h1 className="text-lg font-bold">Review queue unavailable</h1>
            <p className="text-sm text-[#66756D] mt-2">{error}</p>
            <button type="button" onClick={() => setReloadToken(value => value + 1)} className="btn-secondary mt-5 text-sm">Retry</button>
          </div>
        </main>
      </div>
    )
  }

  const filteredQueue = filterSeverity === 'reviewed' ? reviewedData : queueData.filter(item => {
    if (filterSeverity === 'critical') return item.drGrade === 4
    if (filterSeverity === 'urgent') return item.drGrade === 3
    if (filterSeverity === 'moderate') return item.drGrade === 2
    if (filterSeverity === 'mild') return item.drGrade <= 1
    return true
  })

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A] antialiased pb-12">
      <DoctorNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8 space-y-7 sm:space-y-8">

        {/* WELCOME HERO */}
        <section className="bg-gradient-to-br from-[#E6F4EA] via-white to-[#CCFBF1]/40 rounded-2xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Eye className="absolute -right-4 -bottom-8 w-48 h-48 text-[#16866A] opacity-[0.03] rotate-[-10deg] pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 space-y-1">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-[#20312A]" style={{ fontSize: 'clamp(26px, 2.5vw, 32px)', letterSpacing: '-0.02em' }}>
              <span className="text-[#20312A]">Welcome back, </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#285943] to-[#16866A] font-extrabold">Dr. Arjun Sharma</span>
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-[#16866A] to-transparent rounded-full mt-3" />
            <p className="text-sm font-medium text-[#66756D] max-w-2xl mt-1">Review Queue • Confirm AI-assisted screenings and guide referral decisions across primary health centres.</p>
          </div>
          <div className="relative z-10 flex flex-wrap items-center gap-2.5 self-start md:self-center">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#20312A] bg-white border border-[#E2E7E3] shadow-[0_2px_8px_rgba(40,89,67,0.06)] rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-[#16866A]" />
              <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              <span className="relative flex h-2.5 w-2.5 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#059669]" />
              </span>
              <span>Clinic Session Active</span>
            </div>
          </div>
        </section>

        {/* STAT CARDS */}
        <section aria-label="Clinical Queue Statistics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E2E7E3] border-l-4 border-l-[#DC2626] shadow-[0_2px_12px_rgba(40,89,67,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-[13px] font-medium text-[#66756D]">Pending Reviews</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-[#DC2626]"><AlertTriangle className="w-4 h-4" /></div>
              </div>
              <div>
                <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#DC2626] tracking-tight">{loading ? <Skeleton className="h-9 w-10" /> : stats?.pending ?? 0}</div>
                <div className="flex items-center gap-1 text-[11px] text-rose-600 font-semibold mt-1"><span>{loading ? 'Loading urgency data...' : `${queueData.filter(item => item.drGrade >= 3).length} urgent (Grade 3/4)`}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E2E7E3] border-l-4 border-l-[#16866A] shadow-[0_2px_12px_rgba(40,89,67,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-[13px] font-medium text-[#66756D]">Reviewed Today</span>
                <div className="w-8 h-8 rounded-lg bg-[#E6F4EA] border border-[#16866A]/20 flex items-center justify-center text-[#16866A]"><CheckCircle2 className="w-4 h-4" /></div>
              </div>
              <div>
                <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#16866A] tracking-tight">{loading ? <Skeleton className="h-9 w-10" /> : stats?.reviewed ?? 0}</div>
                <div className="flex items-center gap-1 text-[11px] text-[#047857] font-semibold mt-1"><span>{stats?.reviewed != null ? 'Live reviewed count' : 'Not provided by API'}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E2E7E3] border-l-4 border-l-[#285943] shadow-[0_2px_12px_rgba(40,89,67,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-[13px] font-medium text-[#66756D]">Referrals Confirmed</span>
                <div className="w-8 h-8 rounded-lg bg-[#E6F4EA] border border-[#285943]/20 flex items-center justify-center text-[#285943]"><Users className="w-4 h-4" /></div>
              </div>
              <div>
                <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#285943] tracking-tight">{loading ? <Skeleton className="h-9 w-10" /> : stats?.confirmed ?? 'N/A'}</div>
                <div className="flex items-center gap-1 text-[11px] text-[#285943] font-semibold mt-1"><span>Not provided by API</span></div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E2E7E3] border-l-4 border-l-[#64748B] shadow-[0_2px_12px_rgba(40,89,67,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-[13px] font-medium text-[#66756D]">Avg Review Time</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#64748B]"><Clock className="w-4 h-4" /></div>
              </div>
              <div>
                <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#64748B] tracking-tight">N/A</div>
                <div className="flex items-center gap-1 text-[11px] text-[#66756D] font-medium mt-1"><span>Not provided by API</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* CLINICAL QUEUE */}
        <section className="bg-white rounded-xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E7E3] bg-[#F8FAF7] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-semibold text-[#20312A] font-heading">Needs Clinical Review</h2>
                <span className="text-xs text-[#66756D]">Sorted by urgency · AI screening supports review, not final diagnosis</span>
              </div>
              <p className="text-xs text-[#66756D] mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16866A] flex-shrink-0" />
                <span>AI screening supports clinical decision-making. Final clinical assessment is performed by the qualified doctor.</span>
              </p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-center min-w-0 w-full md:w-auto">
              <div className="flex rounded-full p-1 bg-[#F8FAF7] border border-[#E2E7E3] text-xs gap-1 overflow-x-auto max-w-full">
                {[
                  { id: 'all', label: `All (${queueData.length})` },
                  { id: 'critical', label: 'Grade 4 (1)' },
                  { id: 'urgent', label: 'Grade 3 (2)' },
                  { id: 'moderate', label: 'Grade 2 (2)' },
                  { id: 'reviewed', label: `Reviewed (${reviewedData.length})` }
                ].map(tab => (
                  <button key={tab.id} type="button" onClick={() => setFilterSeverity(tab.id)}
                    className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      filterSeverity === tab.id
                        ? 'bg-gradient-to-r from-[#D9F99D] via-[#DCFCE7] to-[#CCFBF1] text-[#14532D] font-bold border border-[#A7F3D0] shadow-2xs'
                        : 'text-[#66756D] hover:text-[#20312A] hover:bg-white/80 font-medium'
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block">
            <div className="w-full overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E7E3] bg-[#F8FAF7] text-[11px] font-semibold text-[#66756D] uppercase tracking-wider">
                  <th scope="col" className="py-3.5 pl-5 pr-3">Patient</th>
                  <th scope="col" className="py-3.5 px-3">PHC Unit</th>
                  <th scope="col" className="py-3.5 px-3">AI Screening Result</th>
                  <th scope="col" className="py-3.5 px-3 text-center">Confidence</th>
                  <th scope="col" className="py-3.5 px-3">Time</th>
                  <th scope="col" className="py-3.5 px-3">Urgency</th>
                  <th scope="col" className="py-3.5 pl-3 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7E3] text-sm bg-white">
                {loading ? (
                  [0, 1, 2, 3, 4].map(i => (
                    <tr key={i}>
                      <td className="py-3.5 pl-4 pr-3"><Skeleton className="h-4 w-28 mb-1.5" /><Skeleton className="h-3 w-20" /></td>
                      <td className="py-3.5 px-3"><Skeleton className="h-3 w-24" /></td>
                      <td className="py-3.5 px-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="py-3.5 px-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-3.5 px-3"><Skeleton className="h-3 w-14" /></td>
                      <td className="py-3.5 px-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-3.5 pl-3 pr-5 text-right"><Skeleton className="h-6 w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  filteredQueue.map((item) => (
                    <tr key={item.id} className={`hover:bg-[#F8FAF7]/80 transition-colors border-l-[4px] ${item.railColor}`}>
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="font-bold text-[#20312A]">{item.name}</div>
                        <div className="text-xs text-[#66756D] font-mono">{item.id}</div>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-[#20312A] font-medium">{item.phc}</td>
                      <td className="py-3.5 px-3"><GradeBadge grade={item.drGrade} /></td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#20312A] min-w-[32px]">{item.confidence}</span>
                          <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden shrink-0">
                            <div className={`h-full rounded-full ${parseInt(item.confidence) > 90 ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} style={{ width: item.confidence }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-[#20312A] font-medium">{item.time}</td>
                      <td className="py-3.5 px-3">
                        {item.urgency === 'Critical' || item.urgency === 'Urgent' ? (
                          <span className="text-[#DC2626] font-bold text-xs uppercase flex items-center gap-1"><AlertTriangle size={14} className="shrink-0" /><span>{item.urgency}</span></span>
                        ) : (
                          <span className="text-[#475569] font-bold text-xs uppercase flex items-center gap-1"><Clock size={14} className="shrink-0" /><span>{item.urgency}</span></span>
                        )}
                      </td>
                      <td className="py-3.5 pl-3 pr-5 text-right">
                        <button type="button" onClick={() => navigate(`/doctor-review/${item.id}`)}
                          className="bg-transparent text-[#66756D] hover:text-[#285943] hover:bg-[#F3F6F1] font-semibold rounded-lg px-3 py-1.5 transition-colors inline-flex items-center gap-1.5 cursor-pointer text-xs">
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5 text-current" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="block sm:hidden p-4 space-y-3 bg-[#F8FAF7]">
            {loading ? (
              [0, 1, 2].map(i => (
                <div key={i} className="bg-white rounded-lg p-4 border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))
            ) : filteredQueue.map((item) => (
              <div key={item.id} className={`bg-white rounded-lg p-4 border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] border-l-[4px] ${item.railColor} space-y-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-[#20312A] text-base">{item.name}</div>
                    <div className="text-xs text-[#66756D] font-mono">{item.id} · {item.phc}</div>
                  </div>
                  <span className="text-xs text-[#20312A] font-medium">{item.time}</span>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <GradeBadge grade={item.drGrade} />
                  <span className="font-mono text-xs font-semibold text-[#20312A]">{item.confidence}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  {item.urgency === 'Critical' || item.urgency === 'Urgent' ? (
                    <span className="text-[#DC2626] font-bold text-xs uppercase flex items-center gap-1"><AlertTriangle size={14} /><span>{item.urgency}</span></span>
                  ) : (
                    <span className="text-[#475569] font-bold text-xs uppercase flex items-center gap-1"><Clock size={14} /><span>{item.urgency}</span></span>
                  )}
                  <button type="button" onClick={() => navigate(`/doctor-review/${item.id}`)}
                    className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-transparent text-[#66756D] hover:text-[#285943] hover:bg-[#F3F6F1] font-semibold rounded-lg border border-[#E2E7E3] transition-colors text-xs cursor-pointer">
                    <span>Review Case</span>
                    <ArrowRight className="w-3.5 h-3.5 text-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}