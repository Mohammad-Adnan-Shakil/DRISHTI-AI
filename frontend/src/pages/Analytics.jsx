import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Download, Info, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, AlertCircle, Building2, Globe, Activity
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
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const [sRes, rRes] = await Promise.allSettled([
        getScreeningStats(),
        getReferralStats()
      ])

      if (sRes.status === 'fulfilled' && sRes.value) {
        setStats(sRes.value)
      }
      if (rRes.status === 'fulfilled' && rRes.value) {
        setRefStats(rRes.value)
      }

      const failedSources = [
        sRes.status === 'rejected' ? 'screening statistics' : null,
        rRes.status === 'rejected' ? 'referral statistics' : null,
      ].filter(Boolean)
      if (failedSources.length > 0) {
        const message = `Could not load ${failedSources.join(' and ')}. Showing only available live data.`
        console.error(`Analytics fetch failed: ${message}`)
        setError(message)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  // Safe-access views keep unavailable backend fields honest instead of
  // replacing them with unrelated demo values.
  const safeStats = stats ?? {}
  const safeRefStats = refStats ?? {}
  const attendanceRate = safeRefStats.total > 0
    ? Math.round((safeRefStats.attended / safeRefStats.total) * 100)
    : null
  const referableRate = safeStats.total_screenings > 0
    ? Math.round((safeStats.referrals_recommended / safeStats.total_screenings) * 1000) / 10
    : null
  const gradeMeta = [
    ['✓ Grade 0 · No DR', '#059669'],
    ['Grade 1 · Mild NPDR', '#D97706'],
    ['Grade 2 · Moderate NPDR', '#EA580C'],
    ['Grade 3 · Severe NPDR', '#DC2626'],
    ['Grade 4 · Proliferative DR', '#991B1B'],
  ]
  const gradeDistribution = gradeMeta.map(([label, color], grade) => {
    const count = safeStats.grade_distribution?.[String(grade)]
    const pct = safeStats.total_screenings > 0 && count != null
      ? Math.round((count / safeStats.total_screenings) * 1000) / 10
      : null
    return { grade, label, count, pct, color }
  })
  const gradeSegments = gradeDistribution.reduce((segments, item) => {
    if (item.pct == null) return segments
    const previous = segments[segments.length - 1]
    const offset = previous ? previous.offset - previous.pct : 0
    return [...segments, { ...item, offset }]
  }, [])

  const sectionAnchors = [
    { id: 'overview', label: 'Overview' },
    { id: 'operations', label: 'Operations' },
    { id: 'phc-performance', label: 'PHC Performance' }
  ]

  const handleExportAnalyticsCsv = () => {
    if (!stats) return
    const kpiData = {
      'Total Screenings': safeStats.total_screenings ?? 'N/A',
      'Referable Cases (Grade >= 2)': safeStats.referrals_recommended ?? 'N/A',
      'Referable Rate (%)': referableRate ?? 'N/A',
      'Referral Attendance Rate (%)': attendanceRate ?? 'N/A',
      'Active PHCs': safeStats.active_phcs ?? 'N/A',
      'Pending Reviews': safeStats.pending_reviews ?? 'N/A',
      'Reviewed (30 Days)': safeStats.reviewed_30d ?? 'N/A',
      'Median Time to Review': 'N/A',
      'AI Agreement Rate (%)': 'N/A',
      'Total Referrals': safeRefStats.total ?? 'N/A',
      'Referrals Attended': safeRefStats.attended ?? 'N/A',
      'Referrals No-Show': safeRefStats.no_show ?? 'N/A',
      ...Object.fromEntries(gradeDistribution.map(item => [`Grade ${item.grade} Count`, item.count ?? 'N/A'])),
    }
    exportAnalyticsToCSV(dateRange, kpiData, [])
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
            <button type="button" onClick={handleExportAnalyticsCsv} disabled={loading || !stats}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E7E3] rounded-lg shadow-xs text-xs font-semibold text-[#66756D] hover:text-[#20312A] hover:bg-[#F8FAF7] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
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
        {error && (
          <div role="alert" className="flex items-start gap-3 p-3 sm:p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <span>{error}</span>
          </div>
        )}

        {/* ===== OVERVIEW ===== */}
        <div id="section-overview">
          <section aria-label="Key Performance Indicators">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Screenings', value: loading ? <Skeleton className="h-9 w-16" /> : (safeStats.total_screenings ?? 'N/A'), sub: `Live total · ${dateRange}D filter unavailable`, trend: 'Live', color: 'border-l-[#285943]', icon: <Activity className="w-4 h-4 text-[#285943]" />, bg: 'bg-emerald-50', textColor: 'text-[#285943]' },
                { label: 'Referable Cases', value: loading ? <Skeleton className="h-9 w-16" /> : (safeStats.referrals_recommended ?? 'N/A'), sub: 'Grade ≥ 2', trend: referableRate == null ? 'N/A' : `${referableRate}% of total`, color: 'border-l-[#D97706]', icon: <AlertTriangle className="w-4 h-4 text-[#D97706]" />, bg: 'bg-amber-50', textColor: 'text-[#20312A]' },
                { label: 'Referral Attendance', value: loading ? <Skeleton className="h-9 w-16" /> : (attendanceRate == null ? 'N/A' : `${attendanceRate}%`), sub: refStats ? `${safeRefStats.attended} / ${safeRefStats.total} attended` : 'Unavailable', trend: 'Live referral stats', color: 'border-l-[#0D9488]', icon: <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />, bg: 'bg-teal-50', textColor: 'text-[#20312A]' },
                { label: 'Active PHCs', value: loading ? <Skeleton className="h-9 w-16" /> : (safeStats.active_phcs ?? 'N/A'), sub: 'Distinct PHC IDs with screenings', trend: 'Live', color: 'border-l-[#285943]', icon: <Building2 className="w-4 h-4 text-[#285943]" />, bg: 'bg-emerald-50', textColor: 'text-[#20312A]' },
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
                { label: 'Pending Reviews', value: loading ? <Skeleton className="h-8 w-10" /> : (safeStats.pending_reviews ?? 'N/A'), sub: 'Awaiting confirmation', link: '/doctor-dashboard', color: 'border-l-[#DC2626]', textColor: 'text-[#20312A]' },
                { label: 'Reviewed (30 days)', value: loading ? <Skeleton className="h-8 w-10" /> : (safeStats.reviewed_30d ?? 'N/A'), sub: 'Completed clinical reviews', color: 'border-l-[#0D9488]', textColor: 'text-[#20312A]' },
                { label: 'Median Time to Review', value: loading ? <Skeleton className="h-8 w-16" /> : 'N/A', sub: 'Not provided by API', color: 'border-l-[#285943]', textColor: 'text-[#20312A]' },
                { label: 'AI Agreement Rate', value: loading ? <Skeleton className="h-8 w-12" /> : 'N/A', sub: 'Not provided by API', color: 'border-l-[#0D9488]', textColor: 'text-[#20312A]' },
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
                    <div className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">Critical SLA metric</div>
                    <div className="text-2xl font-extrabold text-[#DC2626] font-heading">N/A</div>
                    <p className="text-xs text-red-700">Age-based critical SLA data is not provided by the API</p>
                  </div>
                  <span className="p-1.5 rounded-md bg-white text-[#DC2626] shadow-xs border border-red-100"><AlertTriangle className="w-4 h-4" /></span>
                </div>
              </div>
              <div className="p-4 sm:p-5 rounded-xl bg-[#FFFBEB] border border-amber-200 border-l-4 border-l-[#D97706]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">Urgent SLA metric</div>
                    <div className="text-2xl font-extrabold text-amber-900 font-heading">N/A</div>
                    <p className="text-xs text-amber-800">Age-based urgent SLA data is not provided by the API</p>
                  </div>
                  <span className="p-1.5 rounded-md bg-white text-amber-800 shadow-xs border border-amber-100"><Clock className="w-4 h-4" /></span>
                </div>
              </div>
              <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAF7] border border-[#E2E7E3] border-l-4 border-l-[#64748B]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#20312A] uppercase tracking-wider">No-show rate (30d)</div>
                    <div className="text-2xl font-extrabold text-[#20312A] font-heading">{loading ? <Skeleton className="h-8 w-12" /> : (refStats && safeRefStats.total > 0 ? `${Math.round((safeRefStats.no_show / safeRefStats.total) * 100)}%` : 'N/A')}</div>
                    <p className="text-xs text-[#66756D]">{refStats ? `${safeRefStats.no_show} no-shows of ${safeRefStats.total} referrals` : 'Unavailable'}</p>
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
                <span className="text-[11px] font-semibold text-[#66756D] bg-[#F8FAF7] px-2.5 py-1 rounded border border-[#E2E7E3]">Historical data unavailable</span>
              </div>
              <div className="p-5 flex-1 flex items-center justify-center min-h-[280px]">
                <div className="w-full rounded-xl border border-dashed border-[#E2E7E3] bg-[#F8FAF7] p-8 text-center">
                  <Clock className="w-8 h-8 mx-auto text-[#66756D] mb-3" />
                  <p className="text-sm font-semibold text-[#20312A]">Insufficient historical data</p>
                  <p className="text-xs text-[#66756D] mt-1">The available statistics endpoint provides totals, not date-bucketed screening history.</p>
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
                      <circle cx="21" cy="21" r="15.91549" fill="none" stroke="#E2E7E3" strokeWidth="4" />
                      {gradeSegments.map(item => (
                        <circle key={item.grade} cx="21" cy="21" r="15.91549" fill="none" stroke={item.color} strokeWidth="4" strokeDasharray={`${item.pct} ${100 - item.pct}`} strokeDashoffset={item.offset} />
                      ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-[#20312A] font-heading leading-none">{loading ? '...' : (safeStats.total_screenings ?? 'N/A')}</span>
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
                      <span className="text-[#66756D] font-mono font-semibold">{item.count == null ? 'N/A' : `${item.count} (${item.pct}%)`}</span>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-[#FFF7ED] rounded-lg border border-[#EA580C]/20 text-xs text-[#20312A] flex items-center justify-between">
                  <span className="font-medium">Total Referable Rate (Grade ≥ 2):</span>
                  <span className="font-bold text-[#EA580C]">{loading ? '...' : `${referableRate == null ? 'N/A' : `${referableRate}%`} (${safeStats.referrals_recommended ?? 'N/A'} cases)`}</span>
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
            <div className="p-5">
              <div className="rounded-xl border border-dashed border-[#E2E7E3] bg-[#F8FAF7] p-6 text-center">
                <Globe className="w-7 h-7 mx-auto text-[#66756D] mb-2" />
                <p className="text-sm font-semibold text-[#20312A]">Language distribution unavailable</p>
                <p className="text-xs text-[#66756D] mt-1">The current analytics APIs do not provide patient language aggregates.</p>
              </div>
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
              <span className="text-[11px] font-semibold text-[#66756D] bg-[#F8FAF7] px-2.5 py-1 rounded border border-[#E2E7E3]">PHC breakdown unavailable</span>
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
                  <tr>
                    <td colSpan="8" className="py-10 px-4">
                      {/* Left-aligned (not centered across the full, wider-
                          than-viewport table) so this placeholder is visible
                          without needing to scroll the table horizontally. */}
                      <div className="sticky left-4 w-fit max-w-[280px]">
                        <Building2 className="w-7 h-7 text-[#66756D] mb-2" />
                        <p className="text-sm font-semibold text-[#20312A]">Insufficient PHC-level data</p>
                        <p className="text-xs text-[#66756D] mt-1">The current endpoints provide an aggregate PHC count, not facility-level throughput or worker metrics.</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-[#F8FAF7] border-t-2 border-[#E2E7E3] font-bold">
                    <td className="py-3.5 px-4 text-[#285943] text-xs uppercase tracking-wider">Network Total</td>
                    <td className="py-3.5 px-3 text-center font-mono text-[#20312A]">N/A</td>
                    <td className="py-3.5 px-3 font-mono text-[#285943]">N/A</td>
                    <td className="py-3.5 px-3 font-mono text-[#20312A]">N/A</td>
                    <td className="py-3.5 px-3 font-semibold text-[#20312A]">N/A</td>
                    <td className="py-3.5 px-3 font-mono text-[#20312A]">N/A</td>
                    <td className="py-3.5 px-3 text-xs text-[#66756D] font-semibold">Unavailable</td>
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