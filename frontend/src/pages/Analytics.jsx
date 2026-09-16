import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Download, Info, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Sparkles, ArrowRight, AlertCircle, Building2, Globe, Activity
} from 'lucide-react'
import AdminNavbar from '../components/AdminNavbar'
import Skeleton from '../components/Skeleton'
import { getScreeningStats, getReferralStats } from '../lib/api'
import { exportAnalyticsToCSV } from '../lib/csvExport'

export default function Analytics() {
  const [dateRange, setDateRange] = useState('30')
  const [showExportToast, setShowExportToast] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [stats, setStats] = useState(null)
  const [refStats, setRefStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [sRes, rRes] = await Promise.allSettled([
          getScreeningStats(),
          getReferralStats()
        ])
        if (sRes.status === 'fulfilled' && sRes.value) {
          const s = sRes.value
          setStats(prev => ({
            total_screenings: s.total_screenings ?? prev?.total_screenings ?? 0,
            // Backend's /api/screenings/stats names this field
            // "referrals_recommended" (count of screenings with
            // referral_recommended = true) — "referable_cases" was never
            // the real key, hence it always fell back to 0.
            referable_cases: s.referrals_recommended ?? s.referable_cases ?? prev?.referable_cases ?? 0,
            active_phcs: s.active_phcs ?? prev?.active_phcs ?? 0,
            pending_reviews: s.pending_reviews ?? prev?.pending_reviews ?? 0,
            reviewed_30d: s.reviewed_30d ?? prev?.reviewed_30d ?? 0,
            median_review_time: s.median_review_time ?? prev?.median_review_time ?? '—',
            ai_agreement_rate: s.ai_agreement_rate ?? prev?.ai_agreement_rate ?? 0,
          }))
        }
        if (rRes.status === 'fulfilled' && rRes.value) {
          const r = rRes.value
          setRefStats({
            total: r.total ?? 0,
            pending: r.pending ?? 0,
            attended: r.attended ?? 0,
            no_show: r.no_show ?? 0,
          })
        }
      } catch (err) {
        console.error('Analytics fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Safe-access views — stats/refStats stay null until the fetch settles
  // (or forever, if it fails entirely), so every read below goes through
  // these rather than risking a null-dereference crash.
  const safeStats = stats ?? {}
  const safeRefStats = refStats ?? {}
  const attendanceRate = safeRefStats.total > 0 ? Math.round((safeRefStats.attended / safeRefStats.total) * 100) : (safeStats.attendance_rate ?? 0)

  const phcPerformance = [
    { name: 'PHC Hosakote', workers: 6, screenings: 412, referrals: 64, attendance: '82%', attendanceLevel: 'High', confidence: 84, status: 'Online' },
    { name: 'PHC Chelur', workers: 4, screenings: 298, referrals: 48, attendance: '76%', attendanceLevel: 'Moderate', confidence: 79, status: 'Online' },
    { name: 'PHC Chintamani', workers: 5, screenings: 245, referrals: 38, attendance: '74%', attendanceLevel: 'Moderate', confidence: 81, status: 'Online' },
    { name: 'PHC Siddlaghatta', workers: 3, screenings: 182, referrals: 22, attendance: '78%', attendanceLevel: 'Moderate', confidence: 83, status: 'Online' },
    { name: 'PHC Vijayapura', workers: 3, screenings: 111, referrals: 14, attendance: '80%', attendanceLevel: 'High', confidence: 78, status: 'Online' }
  ]

  const gradeDistribution = [
    { grade: 0, label: '✓ Grade 0 · No DR', count: 848, pct: 68.0, color: '#059669' },
    { grade: 1, label: 'Grade 1 · Mild NPDR', count: 214, pct: 17.1, color: '#D97706' },
    { grade: 2, label: 'Grade 2 · Moderate NPDR', count: 112, pct: 9.0, color: '#EA580C' },
    { grade: 3, label: 'Grade 3 · Severe NPDR', count: 50, pct: 4.0, color: '#DC2626' },
    { grade: 4, label: 'Grade 4 · Proliferative DR', count: 24, pct: 1.9, color: '#991B1B' }
  ]

  const languages = [
    { name: 'Kannada', native: 'ಕನ್ನಡ', pct: 48 },
    { name: 'Hindi', native: 'हिन्दी', pct: 22 },
    { name: 'Tamil', native: 'தமிழ்', pct: 12 },
    { name: 'Telugu', native: 'తెలుగు', pct: 9 },
    { name: 'Marathi', native: 'मराठी', pct: 5 },
    { name: 'English', native: 'English', pct: 4 }
  ]

  const networkTotals = {
    workers: phcPerformance.reduce((s, r) => s + r.workers, 0),
    screenings: phcPerformance.reduce((s, r) => s + r.screenings, 0),
    referrals: phcPerformance.reduce((s, r) => s + r.referrals, 0),
    attendance: '78%',
    confidence: Math.round(phcPerformance.reduce((s, r) => s + r.confidence, 0) / phcPerformance.length)
  }

  const sectionAnchors = [
    { id: 'overview', label: 'Overview' },
    { id: 'operations', label: 'Operations' },
    { id: 'phc-performance', label: 'PHC Performance' }
  ]

  const handleExportAnalyticsCsv = () => {
    const kpiData = {
      'Total Screenings': safeStats.total_screenings ?? 0,
      'Referable Cases (Grade >= 2)': safeStats.referable_cases ?? 0,
      'Referral Attendance Rate (%)': attendanceRate,
      'Active PHCs': safeStats.active_phcs ?? 0,
      'Pending Reviews': safeStats.pending_reviews ?? 0,
      'Reviewed (30 Days)': safeStats.reviewed_30d ?? 0,
      'Median Time to Review': safeStats.median_review_time ?? '—',
      'AI Agreement Rate (%)': safeStats.ai_agreement_rate ?? 0,
      'Total Referrals': safeRefStats.total ?? 0,
      'Referrals Attended': safeRefStats.attended ?? 0,
      'Referrals No-Show': safeRefStats.no_show ?? 0,
    }
    exportAnalyticsToCSV(dateRange, kpiData, phcPerformance)
    setShowExportToast(true)
    setTimeout(() => setShowExportToast(false), 2500)
  }

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col antialiased text-[#20312A] pb-16">
      <AdminNavbar />

      {showExportToast && (
        <div className="fixed top-6 right-6 z-[9999] bg-[#20312A] text-white text-xs px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in duration-200 border border-[#E2E7E3]">
          <Download className="w-4 h-4 text-[#16866A]" />
          <span>Exporting System Analytics CSV... Download ready.</span>
        </div>
      )}

      {/* Sticky Subnav */}
      <div className="sticky top-[56px] z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E7E3] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 h-10 overflow-x-auto">
          {sectionAnchors.map(({ id, label }) => (
            <button key={id} type="button" onClick={() => { setActiveSection(id); document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${activeSection === id ? 'bg-gradient-to-r from-[#D9F99D] via-[#DCFCE7] to-[#CCFBF1] text-[#14532D] border border-[#A7F3D0] shadow-2xs' : 'text-[#66756D] hover:text-[#20312A] hover:bg-slate-100'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2E7E3]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#285943]/10 text-[#285943] border border-[#285943]/20 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#285943]" /><span>Admin Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#20312A] font-heading">System overview</h1>
            <p className="text-sm text-[#66756D] mt-1">Screening volume, DR grade distribution, referral outcomes, and PHC performance.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <div className="inline-flex rounded-full p-1 bg-white border border-[#E2E7E3] shadow-xs gap-1">
              {[{ val: '7', label: '7D' }, { val: '30', label: '30D' }, { val: '90', label: '90D' }].map(({ val, label }) => (
                <button key={val} type="button" onClick={() => setDateRange(val)}
                  className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${dateRange === val ? 'bg-gradient-to-r from-[#D9F99D] via-[#DCFCE7] to-[#CCFBF1] text-[#14532D] font-bold border border-[#A7F3D0] shadow-2xs' : 'text-[#66756D] hover:text-[#20312A] hover:bg-slate-100 font-medium'}`}>
                  {label}
                </button>
              ))}
            </div>
            <button type="button" onClick={handleExportAnalyticsCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E7E3] rounded-lg shadow-xs text-xs font-semibold text-[#66756D] hover:text-[#20312A] hover:bg-[#F8FAF7] transition-colors cursor-pointer">
              <Download className="w-4 h-4 text-slate-500" /><span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-lg bg-[#E6F4EA]/60 border border-[#047857]/20 text-[#20312A]">
          <Info className="w-5 h-5 text-[#047857] mt-0.5 shrink-0" />
          <div className="text-xs sm:text-[13px] leading-relaxed text-[#20312A]">
            <span className="font-bold text-[#047857]">Clinical Operations Governance:</span> Analytics summarize AI-assisted screening operations and referral outcomes across the rural tele-retina network. Clinical decisions remain with qualified doctors.
          </div>
        </div>

        {/* ===== OVERVIEW ===== */}
        <div id="section-overview">
          <section aria-label="Key Performance Indicators">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Screenings', value: loading ? <Skeleton className="h-9 w-16" /> : (safeStats.total_screenings ?? 0).toLocaleString(), sub: `Last ${dateRange} days`, trend: '+12.4%', color: 'border-l-[#285943]', icon: <Activity className="w-4 h-4 text-[#285943]" />, bg: 'bg-emerald-50', textColor: 'text-[#285943]' },
                { label: 'Referable Cases', value: loading ? <Skeleton className="h-9 w-16" /> : (safeStats.referable_cases ?? 0), sub: 'Grade ≥ 2', trend: '14.9% of total', color: 'border-l-[#D97706]', icon: <AlertTriangle className="w-4 h-4 text-[#D97706]" />, bg: 'bg-amber-50', textColor: 'text-[#20312A]' },
                { label: 'Referral Attendance', value: loading ? <Skeleton className="h-9 w-16" /> : `${attendanceRate}%`, sub: `${safeRefStats.attended ?? 0} / ${(safeRefStats.total ?? 0) + (safeRefStats.pending ?? 0)} attended`, trend: 'Target: 85%', color: 'border-l-[#0D9488]', icon: <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />, bg: 'bg-teal-50', textColor: 'text-[#20312A]' },
                { label: 'Active PHCs', value: loading ? <Skeleton className="h-9 w-16" /> : (safeStats.active_phcs ?? 0), sub: 'Rural network centres', trend: 'All Online', color: 'border-l-[#285943]', icon: <Building2 className="w-4 h-4 text-[#285943]" />, bg: 'bg-emerald-50', textColor: 'text-[#20312A]' },
              ].map(card => (
                <div key={card.label} className={`bg-white rounded-xl border border-[#E2E7E3] border-l-4 ${card.color} shadow-[0_2px_12px_rgba(40,89,67,0.04)] p-4 sm:p-5 flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#66756D] uppercase tracking-wider">{card.label}</span>
                      <span className={`p-1.5 rounded-lg ${card.bg} border border-opacity-20`}>{card.icon}</span>
                    </div>
                    <div className={`text-4xl font-extrabold ${card.textColor} tracking-tight mt-2 font-heading`}>{card.value}</div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#E2E7E3]/60 flex items-center justify-between text-xs text-[#66756D]">
                    <span>{card.sub}</span>
                    <span className="inline-flex items-center font-semibold text-[#047857]"><TrendingUp className="w-3 h-3 mr-0.5" />{card.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Doctor Review Workload */}
          <section aria-labelledby="heading-review-workload" className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#20312A] tracking-tight font-heading" id="heading-review-workload">Doctor Review Workload</h2>
              <Link to="/doctor-dashboard" className="inline-flex items-center text-xs font-semibold text-[#16866A] hover:text-[#285943] transition-colors">
                <span>Open Review Queue</span><ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Pending Reviews', value: loading ? <Skeleton className="h-8 w-10" /> : (safeStats.pending_reviews ?? 0), sub: 'Awaiting confirmation', link: '/doctor-dashboard', color: 'border-l-[#DC2626]', textColor: 'text-[#20312A]' },
                { label: 'Reviewed (30 days)', value: loading ? <Skeleton className="h-8 w-10" /> : (safeStats.reviewed_30d ?? 0), sub: 'Completed clinical reviews', color: 'border-l-[#0D9488]', textColor: 'text-[#20312A]' },
                { label: 'Median Time to Review', value: loading ? <Skeleton className="h-8 w-16" /> : (safeStats.median_review_time ?? '—'), sub: 'Target: < 24h', color: 'border-l-[#285943]', textColor: 'text-[#20312A]' },
                { label: 'AI Agreement Rate', value: loading ? <Skeleton className="h-8 w-12" /> : `${safeStats.ai_agreement_rate ?? 0}%`, sub: 'Doctor accepted AI grade', color: 'border-l-[#0D9488]', textColor: 'text-[#20312A]' },
              ].map(card => (
                <div key={card.label} className={`bg-white rounded-xl border border-[#E2E7E3] border-l-4 ${card.color} shadow-xs hover:shadow-sm transition-shadow p-4 sm:p-5 flex flex-col justify-between`}>
                  <div>
                    <span className="text-xs font-semibold text-[#66756D] uppercase tracking-wider">{card.label}</span>
                    <div className={`text-2xl sm:text-3xl font-extrabold ${card.textColor} tracking-tight mt-2 font-heading`}>{card.value}</div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#E2E7E3]/60 flex items-center justify-between text-xs text-[#66756D]">
                    <span>{card.sub}</span>
                    {card.link && <Link to={card.link} className="font-semibold text-[#DC2626] hover:underline">Open Queue →</Link>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Referral SLA Alerts */}
          <section className="bg-white rounded-xl border border-[#E2E7E3] p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] flex flex-col space-y-4 mt-6">
            <div>
              <h2 className="text-base font-bold text-[#20312A] tracking-tight font-heading">Referral SLA Alerts</h2>
              <p className="text-xs text-[#66756D] mt-0.5">Cases needing operational attention</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-4 sm:p-5 rounded-xl bg-[#FEF2F2] border border-red-200 border-l-4 border-l-[#DC2626]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">Critical pending &gt; 24h</div>
                    <div className="text-2xl font-extrabold text-[#DC2626] font-heading">3</div>
                    <p className="text-xs text-red-700">Grade 4 referrals still pending dispatch</p>
                  </div>
                  <span className="p-1.5 rounded-md bg-white text-[#DC2626] shadow-xs border border-red-100"><AlertTriangle className="w-4 h-4" /></span>
                </div>
              </div>
              <div className="p-4 sm:p-5 rounded-xl bg-[#FFFBEB] border border-amber-200 border-l-4 border-l-[#D97706]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">Urgent pending &gt; 48h</div>
                    <div className="text-2xl font-extrabold text-amber-900 font-heading">5</div>
                    <p className="text-xs text-amber-800">Grade 3 referrals crossing SLA window</p>
                  </div>
                  <span className="p-1.5 rounded-md bg-white text-amber-800 shadow-xs border border-amber-100"><Clock className="w-4 h-4" /></span>
                </div>
              </div>
              <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAF7] border border-[#E2E7E3] border-l-4 border-l-[#64748B]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#20312A] uppercase tracking-wider">No-show rate (30d)</div>
                    <div className="text-2xl font-extrabold text-[#20312A] font-heading">{loading ? <Skeleton className="h-8 w-12" /> : `${Math.round(((safeRefStats.no_show ?? 0) / Math.max(safeRefStats.total ?? 0, 1)) * 100)}%`}</div>
                    <p className="text-xs text-[#66756D]">{safeRefStats.no_show ?? 0} no-shows · outreach recommended</p>
                  </div>
                  <span className="p-1.5 rounded-md bg-white text-slate-700 shadow-xs border border-slate-200"><AlertCircle className="w-4 h-4" /></span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ===== OPERATIONS ===== */}
        <div id="section-operations" className="space-y-6 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Screenings Over Time */}
            <section className="lg:col-span-7 bg-white rounded-xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] flex flex-col justify-between overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E7E3] flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#20312A] tracking-tight font-heading">Screenings Over Time</h2>
                  <p className="text-xs text-[#66756D] mt-0.5">Daily screening volume across 24 rural PHCs</p>
                </div>
                <span className="text-[11px] font-semibold text-[#285943] bg-[#285943]/10 px-2.5 py-1 rounded border border-[#285943]/20">30-Day Trend · Mean: 41.6/day</span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="relative w-full h-[220px] select-none">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 220">
                    <defs>
                      <linearGradient id="forestAreaGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#285943" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#F8FAF7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <g stroke="#E2E7E3" strokeDasharray="3 3" strokeWidth="1">
                      {[20, 65, 110, 155, 200].map((y, i) => (
                        <line key={i} x1="40" x2="690" y1={y} y2={y} />
                      ))}
                    </g>
                    <path d="M 40 141.5 L 62.4 132.5 L 84.8 119 L 107.2 137 L 129.6 110 L 152 96.5 L 174.4 105.5 L 196.8 123.5 L 219.2 114.5 L 241.6 87.5 L 264 92 L 286.4 101 L 308.8 83 L 331.2 92 L 353.6 74 L 376 96.5 L 398.4 114.5 L 420.8 128 L 443.2 101 L 465.6 78.5 L 488 65 L 510.4 83 L 532.8 74 L 555.2 60.5 L 577.6 47 L 600 78.5 L 622.4 92 L 644.8 69.5 L 667.2 56 L 689.6 74 L 689.6 200 L 40 200 Z" fill="url(#forestAreaGrad)" />
                    <path d="M 40 141.5 L 62.4 132.5 L 84.8 119 L 107.2 137 L 129.6 110 L 152 96.5 L 174.4 105.5 L 196.8 123.5 L 219.2 114.5 L 241.6 87.5 L 264 92 L 286.4 101 L 308.8 83 L 331.2 92 L 353.6 74 L 376 96.5 L 398.4 114.5 L 420.8 128 L 443.2 101 L 465.6 78.5 L 488 65 L 510.4 83 L 532.8 74 L 555.2 60.5 L 577.6 47 L 600 78.5 L 622.4 92 L 644.8 69.5 L 667.2 56 L 689.6 74" fill="none" stroke="#285943" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    <circle cx="577.6" cy="47" r="4.5" fill="#1E4334" stroke="#FFFFFF" strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex justify-between pl-10 pr-2 pt-1.5 text-[11px] text-[#66756D] font-medium">
                  <span>Oct 16</span><span>Oct 22</span><span>Oct 29</span><span>Nov 05</span><span>Nov 11</span><span>Nov 14</span>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E2E7E3] grid grid-cols-3 gap-2 text-center">
                  <div className="px-2 py-1.5 bg-[#F8FAF7] border border-[#E2E7E3] rounded-lg"><div className="text-[11px] text-[#66756D] font-medium">Peak Day</div><div className="text-xs sm:text-sm font-bold text-[#20312A] mt-0.5">54 screenings</div></div>
                  <div className="px-2 py-1.5 bg-[#F8FAF7] border border-[#E2E7E3] rounded-lg"><div className="text-[11px] text-[#66756D] font-medium">Lowest</div><div className="text-xs sm:text-sm font-bold text-[#20312A] mt-0.5">31 screenings</div></div>
                  <div className="px-2 py-1.5 bg-[#285943]/10 border border-[#285943]/20 rounded-lg"><div className="text-[11px] text-[#285943] font-semibold">7-day Moving Avg</div><div className="text-xs sm:text-sm font-bold text-[#20312A] mt-0.5">43.8 / day</div></div>
                </div>
              </div>
            </section>

            {/* DR Grade Distribution */}
            <section className="lg:col-span-5 bg-white rounded-xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] flex flex-col justify-between overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E7E3]">
                <h2 className="text-base font-bold text-[#20312A] tracking-tight font-heading">DR Grade Distribution</h2>
                <p className="text-xs text-[#66756D] mt-0.5">Proportion across {loading ? '...' : (safeStats.total_screenings ?? 0).toLocaleString()} completed patient visits</p>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-center py-3">
                  <div className="relative w-44 h-44">
                    <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
                      <circle cx="21" cy="21" r="15.91549" fill="none" stroke="#059669" strokeWidth="4" strokeDasharray="68 32" strokeDashoffset="0" />
                      <circle cx="21" cy="21" r="15.91549" fill="none" stroke="#D97706" strokeWidth="4" strokeDasharray="17.1 82.9" strokeDashoffset="-68" />
                      <circle cx="21" cy="21" r="15.91549" fill="none" stroke="#EA580C" strokeWidth="4" strokeDasharray="9 91" strokeDashoffset="-85.1" />
                      <circle cx="21" cy="21" r="15.91549" fill="none" stroke="#DC2626" strokeWidth="4" strokeDasharray="4 96" strokeDashoffset="-94.1" />
                      <circle cx="21" cy="21" r="15.91549" fill="none" stroke="#991B1B" strokeWidth="4" strokeDasharray="1.9 98.1" strokeDashoffset="-98.1" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-[#20312A] font-heading leading-none">{loading ? '...' : (safeStats.total_screenings ?? 0).toLocaleString()}</span>
                      <span className="text-[10px] text-[#66756D] font-medium mt-0.5">Total Screenings</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {gradeDistribution.map((item) => (
                    <div key={item.grade} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-[#20312A]">{item.label}</span>
                      </div>
                      <span className="text-[#66756D] font-mono font-semibold">{item.count} ({item.pct}%)</span>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-[#FFF7ED] rounded-lg border border-[#EA580C]/20 text-xs text-[#20312A] flex items-center justify-between">
                  <span className="font-medium">Total Referable Rate (Grade ≥ 2):</span>
                  <span className="font-bold text-[#EA580C]">14.9% ({loading ? '...' : (safeStats.referable_cases ?? 0)} cases)</span>
                </div>
              </div>
            </section>
          </div>

          {/* Language Distribution */}
          <section className="bg-white rounded-xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E7E3] flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#20312A] tracking-tight font-heading">Patient Language Preference</h2>
                <p className="text-xs text-[#66756D] mt-0.5">Self-reported preferred communication language</p>
              </div>
              <Globe className="w-5 h-5 text-[#66756D]" />
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {languages.map((lang) => (
                <div key={lang.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#20312A]">{lang.name} <span className="text-[#66756D] ml-1">{lang.native}</span></span>
                    <span className="font-mono font-bold text-[#20312A]">{lang.pct}%</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-[#94A3B8] rounded-full transition-all" style={{ width: `${lang.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ===== PHC PERFORMANCE ===== */}
        <div id="section-phc-performance" className="pt-2">
          <section className="bg-white rounded-xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E7E3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#20312A] tracking-tight font-heading">Primary Health Centre Performance</h2>
                <p className="text-xs text-[#66756D] mt-0.5">Screening throughput, referrals, AI concordance, and operational status by facility</p>
              </div>
              <span className="text-[11px] font-semibold text-[#285943] bg-[#285943]/10 px-2.5 py-1 rounded border border-[#285943]/20">{phcPerformance.length} Facilities · Network Active</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F8FAF7] text-[#66756D] text-[11px] font-semibold uppercase tracking-wider border-b border-[#E2E7E3]">
                    <th className="py-3 px-4">PHC Facility</th>
                    <th className="py-3 px-3 text-center">Workers</th>
                    <th className="py-3 px-3">Screenings</th>
                    <th className="py-3 px-3">Referrals</th>
                    <th className="py-3 px-3">Attendance</th>
                    <th className="py-3 px-3">AI Confidence</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E7E3]/70">
                  {phcPerformance.map((row) => (
                    <tr key={row.name} className="hover:bg-[#F8FAF7]/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#20312A]">{row.name}</td>
                      <td className="py-3.5 px-3 text-center font-mono text-[#20312A]">{row.workers}</td>
                      <td className="py-3.5 px-3 font-mono text-[#20312A]">{row.screenings}</td>
                      <td className="py-3.5 px-3 font-mono text-[#20312A]">{row.referrals}</td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#20312A]">{row.attendance}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${row.attendanceLevel === 'High' ? 'bg-[#F0FDFA] text-[#0D9488]' : 'bg-[#FFF7ED] text-[#D97706]'}`}>{row.attendanceLevel}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-[#E2E7E3] rounded-full overflow-hidden"><div className="h-full bg-[#285943] rounded-full" style={{ width: `${row.confidence}%` }} /></div>
                          <span className="font-mono font-semibold text-[#20312A] text-xs">{row.confidence}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#66756D]"><span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />{row.status}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button type="button" className="text-[11px] font-semibold text-[#66756D] hover:text-[#16866A] border border-[#E2E7E3] px-2.5 py-1 rounded-md hover:bg-[#F8FAF7] transition-colors cursor-pointer">View Center</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F8FAF7] border-t-2 border-[#E2E7E3] font-bold">
                    <td className="py-3.5 px-4 text-[#285943] text-xs uppercase tracking-wider">Network Total</td>
                    <td className="py-3.5 px-3 text-center font-mono text-[#20312A]">{networkTotals.workers}</td>
                    <td className="py-3.5 px-3 font-mono text-[#285943]">{networkTotals.screenings.toLocaleString()}</td>
                    <td className="py-3.5 px-3 font-mono text-[#20312A]">{networkTotals.referrals}</td>
                    <td className="py-3.5 px-3 font-semibold text-[#20312A]">{networkTotals.attendance}</td>
                    <td className="py-3.5 px-3 font-mono text-[#20312A]">{networkTotals.confidence}%</td>
                    <td className="py-3.5 px-3 text-xs text-[#0D9488] font-semibold">All Online</td>
                    <td className="py-3.5 px-4" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}