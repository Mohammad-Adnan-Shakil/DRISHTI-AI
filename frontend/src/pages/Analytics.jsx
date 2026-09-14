import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Download,
  Info,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Building2,
  Globe,
  Activity
} from 'lucide-react'
import AdminNavbar from '../components/AdminNavbar'

export default function Analytics() {
  const [dateRange, setDateRange] = useState('30')
  const [showExportToast, setShowExportToast] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')

  const handleExportCSV = () => {
    setShowExportToast(true)
    setTimeout(() => setShowExportToast(false), 2500)
  }

  // PHC performance data (denser)
  const phcPerformance = [
    { name: 'PHC Hosakote', workers: 6, screenings: 412, referrals: 64, attendance: '82%', attendanceLevel: 'High', confidence: 84, status: 'Online' },
    { name: 'PHC Chelur', workers: 4, screenings: 298, referrals: 48, attendance: '76%', attendanceLevel: 'Moderate', confidence: 79, status: 'Online' },
    { name: 'PHC Chintamani', workers: 5, screenings: 245, referrals: 38, attendance: '74%', attendanceLevel: 'Moderate', confidence: 81, status: 'Online' },
    { name: 'PHC Siddlaghatta', workers: 3, screenings: 182, referrals: 22, attendance: '78%', attendanceLevel: 'Moderate', confidence: 83, status: 'Online' },
    { name: 'PHC Vijayapura', workers: 3, screenings: 111, referrals: 14, attendance: '80%', attendanceLevel: 'High', confidence: 78, status: 'Online' }
  ]

  // Grade breakdown
  const gradeDistribution = [
    { grade: 0, label: '✓ Grade 0 · No DR', count: 848, pct: 68.0, color: '#059669' },
    { grade: 1, label: 'Grade 1 · Mild NPDR', count: 214, pct: 17.1, color: '#D97706' },
    { grade: 2, label: 'Grade 2 · Moderate NPDR', count: 112, pct: 9.0, color: '#EA580C' },
    { grade: 3, label: 'Grade 3 · Severe NPDR', count: 50, pct: 4.0, color: '#DC2626' },
    { grade: 4, label: 'Grade 4 · Proliferative DR', count: 24, pct: 1.9, color: '#991B1B' }
  ]

  // Referral funnel stages
  const funnelStages = [
    { label: 'Flagged ≥ Grade 2', count: 186, pct: 100, color: '#285943', textColor: '#047857' },
    { label: 'Referral Sent', count: 142, pct: 76, color: '#0D9488', textColor: '#0D9488' },
    { label: 'Patient Attended', count: 110, pct: 59, color: '#0284C7', textColor: '#0284C7' },
    { label: 'No-Show / Lost', count: 32, pct: 17, color: '#DC2626', textColor: '#DC2626' }
  ]

  // Language data
  const languages = [
    { name: 'Kannada', native: 'ಕನ್ನಡ', pct: 48 },
    { name: 'Hindi', native: 'हिन्दी', pct: 22 },
    { name: 'Tamil', native: 'தமிழ்', pct: 12 },
    { name: 'Telugu', native: 'తెలుగు', pct: 9 },
    { name: 'Marathi', native: 'मराठी', pct: 5 },
    { name: 'English', native: 'English', pct: 4 }
  ]

  // Recent system activity
  const recentActivity = [
    { time: '2 min ago', event: 'Dr. Arjun Sharma reviewed Ravi T. (Grade 3 → Confirmed)', category: 'REVIEW', categoryColor: 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/20' },
    { time: '8 min ago', event: 'Anitha R. screening completed at PHC Hosakote (Grade 2)', category: 'SCREENING', categoryColor: 'bg-[#285943]/10 text-[#285943] border-[#285943]/20' },
    { time: '15 min ago', event: 'Referral dispatched for Mahesh K. to District Eye Hospital', category: 'REFERRAL', categoryColor: 'bg-[#0284C7]/10 text-[#0284C7] border-[#0284C7]/20' },
    { time: '22 min ago', event: 'PHC Chelur offline sync completed (48 records)', category: 'SYNC', categoryColor: 'bg-[#66756D]/10 text-[#66756D] border-[#66756D]/20' },
    { time: '35 min ago', event: 'Dr. Arjun overrode Grade 2 → Grade 1 for Lakshmi D.', category: 'OVERRIDE', categoryColor: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20' },
    { time: '1h ago', event: 'Farooq A. screening completed at PHC Hosakote (Grade 3)', category: 'SCREENING', categoryColor: 'bg-[#285943]/10 text-[#285943] border-[#285943]/20' },
    { time: '1h 20m ago', event: 'Savithri M. referred — routine follow-up at District OPD', category: 'REFERRAL', categoryColor: 'bg-[#0284C7]/10 text-[#0284C7] border-[#0284C7]/20' },
    { time: '2h ago', event: 'PHC Siddlaghatta offline sync completed (22 records)', category: 'SYNC', categoryColor: 'bg-[#66756D]/10 text-[#66756D] border-[#66756D]/20' }
  ]

  const sectionAnchors = [
    { id: 'overview', label: 'Overview' },
    { id: 'operations', label: 'Operations' },
    { id: 'phc-performance', label: 'PHC Performance' }
  ]

  // Network aggregate totals for PHC footer row
  const networkTotals = {
    workers: phcPerformance.reduce((s, r) => s + r.workers, 0),
    screenings: phcPerformance.reduce((s, r) => s + r.screenings, 0),
    referrals: phcPerformance.reduce((s, r) => s + r.referrals, 0),
    attendance: '78%',
    confidence: Math.round(phcPerformance.reduce((s, r) => s + r.confidence, 0) / phcPerformance.length)
  }

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col antialiased text-[#20312A] selection:bg-[#E6F4EA] selection:text-[#047857] pb-16">
      <AdminNavbar />

      {/* Export Toast — z-[9999] to sit above navbar */}
      {showExportToast && (
        <div className="fixed top-6 right-6 z-[9999] bg-[#20312A] text-white text-xs px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in duration-200 border border-[#E2E7E3] pointer-events-auto">
          <Download className="w-4 h-4 text-[#16866A]" />
          <span>Exporting System Analytics CSV... Download ready.</span>
        </div>
      )}

      {/* Sticky Section Subnav */}
      <div className="sticky top-[56px] z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E7E3] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 h-10 overflow-x-auto">
          {sectionAnchors.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveSection(id)
                document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === id
                  ? 'bg-gradient-to-r from-[#D9F99D] via-[#DCFCE7] to-[#CCFBF1] text-[#14532D] border border-[#A7F3D0] shadow-2xs'
                  : 'text-[#66756D] hover:text-[#20312A] hover:bg-slate-100'
              }`}
            >
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
              <span className="w-1.5 h-1.5 rounded-full bg-[#285943]" />
              <span>Admin Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#20312A] font-heading">
              System overview
            </h1>
            <p className="text-sm text-[#66756D] mt-1">
              Screening volume, DR grade distribution, referral outcomes, and PHC performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <div className="inline-flex rounded-full p-1 bg-white border border-[#E2E7E3] shadow-xs gap-1">
              {[
                { val: '7', label: '7D' },
                { val: '30', label: '30D' },
                { val: '90', label: '90D' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDateRange(val)}
                  className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                    dateRange === val
                      ? 'bg-gradient-to-r from-[#D9F99D] via-[#DCFCE7] to-[#CCFBF1] text-[#14532D] font-bold border border-[#A7F3D0] shadow-2xs'
                      : 'text-[#66756D] hover:text-[#20312A] hover:bg-slate-100 font-medium'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E7E3] rounded-lg shadow-xs text-xs font-semibold text-[#66756D] hover:text-[#20312A] hover:bg-[#F8FAF7] transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Clinical / Operations Disclaimer Banner */}
        <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-lg bg-[#E6F4EA]/60 border border-[#047857]/20 text-[#20312A]">
          <Info className="w-5 h-5 text-[#047857] mt-0.5 shrink-0" />
          <div className="text-xs sm:text-[13px] leading-relaxed text-[#20312A]">
            <span className="font-bold text-[#047857]">Clinical Operations Governance:</span> Analytics summarize AI-assisted screening operations and referral outcomes across the rural tele-retina network. Clinical decisions remain with qualified doctors.
          </div>
        </div>

        {/* ===== OVERVIEW SECTION ===== */}
        <div id="section-overview">
          {/* 4 KPI SUMMARY CARDS */}
          <section aria-label="Key Performance Indicators">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Screenings */}
              <div className="bg-white rounded-xl border border-[#E2E7E3] border-l-4 border-l-[#285943] shadow-[0_2px_12px_rgba(40,89,67,0.04)] p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#66756D] uppercase tracking-wider">Total Screenings</span>
                    <span className="p-1.5 rounded-lg bg-emerald-50 text-[#285943] border border-emerald-100">
                      <Activity className="w-4 h-4 text-[#285943]" />
                    </span>
                  </div>
                  <div className="text-4xl font-extrabold text-[#285943] tracking-tight mt-2 font-heading">
                    1,248
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#E2E7E3]/60 flex items-center justify-between text-xs text-[#66756D]">
                  <span>Last {dateRange} days</span>
                  <span className="inline-flex items-center font-semibold text-[#047857]">
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                    +12.4%
                  </span>
                </div>
              </div>

              {/* Referable Cases */}
              <div className="bg-white rounded-xl border border-[#E2E7E3] border-l-4 border-l-[#D97706] shadow-[0_2px_12px_rgba(40,89,67,0.04)] p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#66756D] uppercase tracking-wider">Referable Cases</span>
                    <span className="p-1.5 rounded-lg bg-amber-50 text-[#D97706] border border-amber-100">
                      <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                    </span>
                  </div>
                  <div className="text-4xl font-extrabold text-[#20312A] tracking-tight mt-2 font-heading">
                    186
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#E2E7E3]/60 flex items-center justify-between text-xs text-[#66756D]">
                  <span>Grade ≥ 2</span>
                  <span className="font-semibold text-[#D97706]">14.9% of total</span>
                </div>
              </div>

              {/* Attendance Rate */}
              <div className="bg-white rounded-xl border border-[#E2E7E3] border-l-4 border-l-[#0D9488] shadow-[0_2px_12px_rgba(40,89,67,0.04)] p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#66756D] uppercase tracking-wider">Referral Attendance</span>
                    <span className="p-1.5 rounded-lg bg-teal-50 text-[#0D9488] border border-teal-100">
                      <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-[#20312A] tracking-tight mt-2 font-heading">
                    78%
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#E2E7E3]/60 flex items-center justify-between text-xs text-[#66756D]">
                  <span>110 / 142 attended</span>
                  <span className="font-medium">Target: 85%</span>
                </div>
              </div>

              {/* Active PHCs */}
              <div className="bg-white rounded-xl border border-[#E2E7E3] border-l-4 border-l-[#285943] shadow-[0_2px_12px_rgba(40,89,67,0.04)] p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#66756D] uppercase tracking-wider">Active PHCs</span>
                    <span className="p-1.5 rounded-lg bg-emerald-50 text-[#285943] border border-emerald-100">
                      <Building2 className="w-4 h-4 text-[#285943]" />
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-[#20312A] tracking-tight mt-2 font-heading">
                    24
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#E2E7E3]/60 flex items-center justify-between text-xs text-[#66756D]">
                  <span>Rural network centres</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#047857]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#047857]" />
                    All Online
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* DOCTOR REVIEW WORKLOAD ROW */}
          <section aria-labelledby="heading-review-workload" className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#20312A] tracking-tight font-heading" id="heading-review-workload">
                Doctor Review Workload
              </h2>
              <Link to="/doctor-dashboard" className="inline-flex items-center text-xs font-semibold text-[#16866A] hover:text-[#285943] transition-colors">
                <span>Open Review Queue</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/doctor-dashboard" className="bg-white rounded-xl border border-[#E2E7E3] border-l-4 border-l-[#DC2626] shadow-xs hover:shadow-sm hover:border-[#16866A] transition-all p-4 sm:p-5 flex flex-col justify-between group cursor-pointer">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#66756D] uppercase tracking-wider group-hover:text-[#DC2626] transition-colors">Pending Reviews</span>
                    <span className="p-1.5 rounded-md bg-red-50 text-[#DC2626] group-hover:bg-red-100 transition-colors"><Clock className="w-4 h-4" /></span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#20312A] tracking-tight mt-2 font-heading">14</div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#E2E7E3]/60 flex items-center justify-between text-xs text-[#66756D]">
                  <span className="truncate">Awaiting confirmation</span>
                  <span className="font-semibold text-[#DC2626] group-hover:underline">Open Queue →</span>
                </div>
              </Link>

              <div className="bg-white rounded-xl border border-[#E2E7E3] border-l-4 border-l-[#0D9488] shadow-xs hover:shadow-sm transition-shadow p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#66756D] uppercase tracking-wider">Reviewed (30 days)</span>
                    <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#20312A] tracking-tight mt-2 font-heading">412</div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#E2E7E3]/60 flex items-center justify-between text-xs text-[#66756D]">
                  <span>Completed clinical reviews</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E7E3] border-l-4 border-l-[#285943] shadow-xs hover:shadow-sm transition-shadow p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#66756D] uppercase tracking-wider">Median Time to Review</span>
                    <Clock className="w-4 h-4 text-[#285943]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#20312A] tracking-tight mt-2 font-heading">4h 12m</div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#E2E7E3]/60 flex items-center justify-between text-xs text-[#66756D]">
                  <span>Target: &lt; 24h</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E7E3] border-l-4 border-l-[#0D9488] shadow-xs hover:shadow-sm transition-shadow p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#66756D] uppercase tracking-wider">AI Agreement Rate</span>
                    <Sparkles className="w-4 h-4 text-[#0D9488]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#20312A] tracking-tight mt-2 font-heading">81%</div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#E2E7E3]/60 flex items-center justify-between text-xs text-[#66756D]">
                  <span>Doctor accepted AI grade</span>
                  <span className="font-medium text-[#66756D]">Override 19%</span>
                </div>
              </div>
            </div>
          </section>

          {/* REFERRAL SLA ALERTS */}
          <section aria-labelledby="heading-sla-alerts" className="bg-white rounded-xl border border-[#E2E7E3] p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] flex flex-col space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <h2 className="text-base font-bold text-[#20312A] tracking-tight font-heading" id="heading-sla-alerts">Referral SLA Alerts</h2>
                <p className="text-xs text-[#66756D] mt-0.5">Cases needing operational attention</p>
              </div>
              <Link to="/referrals" className="inline-flex items-center text-xs font-semibold text-[#16866A] hover:text-[#285943] transition-colors">
                <span>All Active Referrals</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Link to="/referrals" className="group block p-4 sm:p-5 rounded-xl bg-[#FEF2F2] border border-red-200 border-l-4 border-l-[#DC2626] hover:shadow-[0_2px_12px_rgba(40,89,67,0.08)] transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">Critical pending &gt; 24h</div>
                    <div className="text-2xl font-extrabold text-[#DC2626] font-heading">3</div>
                    <p className="text-xs text-red-700">Grade 4 referrals still pending dispatch</p>
                  </div>
                  <span className="p-1.5 rounded-md bg-white text-[#DC2626] shadow-xs border border-red-100">
                    <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                  </span>
                </div>
                <div className="mt-3 pt-2 border-t border-red-200/60 flex items-center justify-between text-xs font-semibold text-[#DC2626] group-hover:underline">
                  <span>View in Referrals</span><span>→</span>
                </div>
              </Link>

              <Link to="/referrals" className="group block p-4 sm:p-5 rounded-xl bg-[#FFFBEB] border border-amber-200 border-l-4 border-l-[#D97706] hover:shadow-[0_2px_12px_rgba(40,89,67,0.08)] transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">Urgent pending &gt; 48h</div>
                    <div className="text-2xl font-extrabold text-amber-900 font-heading">5</div>
                    <p className="text-xs text-amber-800">Grade 3 referrals crossing SLA window</p>
                  </div>
                  <span className="p-1.5 rounded-md bg-white text-amber-800 shadow-xs border border-amber-100">
                    <Clock className="w-4 h-4 text-amber-800" />
                  </span>
                </div>
                <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs font-semibold text-amber-900 group-hover:underline">
                  <span>View in Referrals</span><span>→</span>
                </div>
              </Link>

              <Link to="/referrals" className="group block p-4 sm:p-5 rounded-xl bg-[#F8FAF7] border border-[#E2E7E3] border-l-4 border-l-[#64748B] hover:shadow-[0_2px_12px_rgba(40,89,67,0.08)] transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#20312A] uppercase tracking-wider">No-show rate (30d)</div>
                    <div className="text-2xl font-extrabold text-[#20312A] font-heading">17%</div>
                    <p className="text-xs text-[#66756D]">32 no-shows · outreach recommended</p>
                  </div>
                  <span className="p-1.5 rounded-md bg-white text-slate-700 shadow-xs border border-slate-200">
                    <AlertCircle className="w-4 h-4 text-slate-700" />
                  </span>
                </div>
                <div className="mt-3 pt-2 border-t border-[#E2E7E3] flex items-center justify-between text-xs font-semibold text-[#20312A] group-hover:underline">
                  <span>View in Referrals</span><span>→</span>
                </div>
              </Link>
            </div>
          </section>
        </div>

        {/* ===== OPERATIONS SECTION ===== */}
        <div id="section-operations" className="space-y-6 pt-2">
          {/* MAIN VISUALIZATION GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* A: Screenings Over Time (7 cols) */}
            <section className="lg:col-span-7 bg-white rounded-xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] flex flex-col justify-between overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E7E3] flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#20312A] tracking-tight font-heading">Screenings Over Time</h2>
                  <p className="text-xs text-[#66756D] mt-0.5">Daily screening volume across 24 rural PHCs</p>
                </div>
                <span className="text-[11px] font-semibold text-[#285943] bg-[#285943]/10 px-2.5 py-1 rounded border border-[#285943]/20">
                  30-Day Trend · Mean: 41.6/day
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="relative w-full h-[220px] select-none">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 220">
                    <defs>
                      <linearGradient id="forestAreaGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#285943" stopOpacity="0.28" />
                        <stop offset="75%" stopColor="#285943" stopOpacity="0.04" />
                        <stop offset="100%" stopColor="#F8FAF7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <g stroke="#E2E7E3" strokeDasharray="3 3" strokeWidth="1">
                      <line x1="40" x2="690" y1="20" y2="20" />
                      <text x="32" y="24" textAnchor="end" fill="#94A3B8" fontSize="10">60</text>
                      <line x1="40" x2="690" y1="65" y2="65" />
                      <text x="32" y="69" textAnchor="end" fill="#94A3B8" fontSize="10">50</text>
                      <line x1="40" x2="690" y1="110" y2="110" />
                      <text x="32" y="114" textAnchor="end" fill="#94A3B8" fontSize="10">40</text>
                      <line x1="40" x2="690" y1="155" y2="155" />
                      <text x="32" y="159" textAnchor="end" fill="#94A3B8" fontSize="10">30</text>
                      <line x1="40" x2="690" y1="200" y2="200" stroke="#CBD5E1" strokeDasharray="none" />
                      <text x="32" y="204" textAnchor="end" fill="#94A3B8" fontSize="10">20</text>
                    </g>

                    {/* Filled Area */}
                    <path
                      d="M 40 141.5 L 62.4 132.5 L 84.8 119 L 107.2 137 L 129.6 110 L 152 96.5 L 174.4 105.5 L 196.8 123.5 L 219.2 114.5 L 241.6 87.5 L 264 92 L 286.4 101 L 308.8 83 L 331.2 92 L 353.6 74 L 376 96.5 L 398.4 114.5 L 420.8 128 L 443.2 101 L 465.6 78.5 L 488 65 L 510.4 83 L 532.8 74 L 555.2 60.5 L 577.6 47 L 600 78.5 L 622.4 92 L 644.8 69.5 L 667.2 56 L 689.6 74 L 689.6 200 L 40 200 Z"
                      fill="url(#forestAreaGrad)"
                    />
                    {/* Stroke Line */}
                    <path
                      d="M 40 141.5 L 62.4 132.5 L 84.8 119 L 107.2 137 L 129.6 110 L 152 96.5 L 174.4 105.5 L 196.8 123.5 L 219.2 114.5 L 241.6 87.5 L 264 92 L 286.4 101 L 308.8 83 L 331.2 92 L 353.6 74 L 376 96.5 L 398.4 114.5 L 420.8 128 L 443.2 101 L 465.6 78.5 L 488 65 L 510.4 83 L 532.8 74 L 555.2 60.5 L 577.6 47 L 600 78.5 L 622.4 92 L 644.8 69.5 L 667.2 56 L 689.6 74"
                      fill="none"
                      stroke="#285943"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                    />
                    {/* Key data points */}
                    <circle cx="241.6" cy="87.5" r="3.5" fill="#285943" stroke="#FFFFFF" strokeWidth="1.5" />
                    <circle cx="488" cy="65" r="3.5" fill="#285943" stroke="#FFFFFF" strokeWidth="1.5" />
                    <circle cx="577.6" cy="47" r="4.5" fill="#1E4334" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="689.6" cy="74" r="4" fill="#285943" stroke="#FFFFFF" strokeWidth="2" />

                    {/* Light tooltip on peak */}
                    <g className="pointer-events-none">
                      <rect fill="#FFFFFF" stroke="#E2E7E3" strokeWidth="1" filter="drop-shadow(0 2px 6px rgba(32,49,42,0.10))" height="34" rx="6" width="96" x="530" y="24" />
                      <text fill="#20312A" fontSize="10" fontWeight="bold" textAnchor="middle" x="578" y="38">Peak: 54/day</text>
                      <text fill="#66756D" fontSize="9" textAnchor="middle" x="578" y="50">Nov 11</text>
                    </g>
                  </svg>
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between pl-10 pr-2 pt-1.5 text-[11px] text-[#66756D] font-medium">
                  <span>Oct 16</span><span>Oct 22</span><span>Oct 29</span><span>Nov 05</span><span>Nov 11</span><span>Nov 14 (Today)</span>
                </div>

                {/* Footer mini metrics */}
                <div className="mt-4 pt-3 border-t border-[#E2E7E3] grid grid-cols-3 gap-2 text-center">
                  <div className="px-2 py-1.5 bg-[#F8FAF7] border border-[#E2E7E3] rounded-lg">
                    <div className="text-[11px] text-[#66756D] font-medium">Peak Day</div>
                    <div className="text-xs sm:text-sm font-bold text-[#20312A] mt-0.5">54 screenings</div>
                  </div>
                  <div className="px-2 py-1.5 bg-[#F8FAF7] border border-[#E2E7E3] rounded-lg">
                    <div className="text-[11px] text-[#66756D] font-medium">Lowest</div>
                    <div className="text-xs sm:text-sm font-bold text-[#20312A] mt-0.5">31 screenings</div>
                  </div>
                  <div className="px-2 py-1.5 bg-[#285943]/10 border border-[#285943]/20 rounded-lg">
                    <div className="text-[11px] text-[#285943] font-semibold">7-day Moving Avg</div>
                    <div className="text-xs sm:text-sm font-bold text-[#20312A] mt-0.5">43.8 / day</div>
                  </div>
                </div>
              </div>
            </section>

            {/* B: DR Grade Distribution Donut (5 cols) */}
            <section className="lg:col-span-5 bg-white rounded-xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] flex flex-col justify-between overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E7E3]">
                <h2 className="text-base font-bold text-[#20312A] tracking-tight font-heading">DR Grade Distribution</h2>
                <p className="text-xs text-[#66756D] mt-0.5">Proportion across 1,248 completed patient visits</p>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* Donut chart */}
                <div className="flex items-center justify-center py-3">
                  <div className="relative w-44 h-44">
                    <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
                      {/* Grade 0: 68% */}
                      <circle cx="21" cy="21" r="15.91549" fill="none" stroke="#059669" strokeWidth="4" strokeDasharray="68 32" strokeDashoffset="0" />
                      {/* Grade 1: 17.1% */}
                      <circle cx="21" cy="21" r="15.91549" fill="none" stroke="#D97706" strokeWidth="4" strokeDasharray="17.1 82.9" strokeDashoffset="-68" />
                      {/* Grade 2: 9% */}
                      <circle cx="21" cy="21" r="15.91549" fill="none" stroke="#EA580C" strokeWidth="4" strokeDasharray="9 91" strokeDashoffset="-85.1" />
                      {/* Grade 3: 4% */}
                      <circle cx="21" cy="21" r="15.91549" fill="none" stroke="#DC2626" strokeWidth="4" strokeDasharray="4 96" strokeDashoffset="-94.1" />
                      {/* Grade 4: 1.9% */}
                      <circle cx="21" cy="21" r="15.91549" fill="none" stroke="#991B1B" strokeWidth="4" strokeDasharray="1.9 98.1" strokeDashoffset="-98.1" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-[#20312A] font-heading leading-none">1,248</span>
                      <span className="text-[10px] text-[#66756D] font-medium mt-0.5">Total Screenings</span>
                    </div>
                  </div>
                </div>

                {/* Legend */}
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
                  <span className="font-bold text-[#EA580C]">14.9% (186 cases)</span>
                </div>
              </div>
            </section>
          </div>

          {/* ROW 2: Referral Funnel + Patient Language */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* C: Referral Continuum Funnel (7 cols) */}
            <section className="lg:col-span-7 bg-white rounded-xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E7E3]">
                <h2 className="text-base font-bold text-[#20312A] tracking-tight font-heading">Referral Continuum Funnel</h2>
                <p className="text-xs text-[#66756D] mt-0.5">From AI flagged to patient attended · {dateRange}-day window</p>
              </div>
              <div className="p-5 space-y-3">
                {funnelStages.map((stage, i) => (
                  <div key={stage.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#20312A]">{stage.label}</span>
                      <span className="font-mono font-bold" style={{ color: stage.textColor }}>{stage.count}</span>
                    </div>
                    {/* Funnel Bar with 100% baseline fill #F1F5F9 */}
                    <div className="w-full bg-[#F1F5F9] border border-slate-200/50 rounded-full h-4.5 overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${stage.pct}%`, backgroundColor: stage.color }}
                      >
                        {stage.pct > 15 && <span className="text-white text-[10px] font-bold">{stage.pct}%</span>}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-[#E2E7E3] flex items-center gap-1.5 text-xs text-[#66756D]">
                  <Info className="w-3.5 h-3.5 text-[#66756D] shrink-0" />
                  <span>Attendance benchmark: 78% (target 85%) · 32 no-shows flagged for community outreach</span>
                </div>
              </div>
            </section>

            {/* D: Patient Language Preference (5 cols) */}
            <section className="lg:col-span-5 bg-white rounded-xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E7E3] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#20312A] tracking-tight font-heading">Patient Language Preference</h2>
                  <p className="text-xs text-[#66756D] mt-0.5">Self-reported preferred communication language</p>
                </div>
                <Globe className="w-5 h-5 text-[#66756D]" />
              </div>
              <div className="p-5 space-y-3">
                {languages.map((lang) => (
                  <div key={lang.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#20312A]">{lang.name} <span className="text-[#66756D] ml-1">{lang.native}</span></span>
                      <span className="font-mono font-bold text-[#20312A]">{lang.pct}%</span>
                    </div>
                    {/* Demoted visual weight using Slate #94A3B8 */}
                    <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-[#94A3B8] rounded-full transition-all" style={{ width: `${lang.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* E: Recent System Activity (ADDED from Stitch) */}
          <section className="bg-white rounded-xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E7E3] flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#20312A] tracking-tight font-heading">Recent System Activity</h2>
                <p className="text-xs text-[#66756D] mt-0.5">Live clinical operations stream</p>
              </div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#047857] border border-[#047857]/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]" />
                </span>
                <span>Live Stream</span>
              </div>
            </div>
            <div className="divide-y divide-[#E2E7E3]/70">
              {recentActivity.map((item, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-[#F8FAF7]/60 transition-colors">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-[11px] text-[#66756D] font-mono whitespace-nowrap pt-0.5 w-20 shrink-0">{item.time}</span>
                    <p className="text-xs text-[#20312A] leading-relaxed">{item.event}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Activity Feed Chips: px-2 py-1 and text-xs */}
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border ${item.categoryColor}`}>
                      {item.category}
                    </span>
                    <button type="button" className="text-[11px] font-semibold text-[#66756D] hover:text-[#16866A] transition-colors cursor-pointer">
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ===== PHC PERFORMANCE SECTION ===== */}
        <div id="section-phc-performance" className="pt-2">
          <section className="bg-white rounded-xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E7E3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#20312A] tracking-tight font-heading">Primary Health Centre Performance</h2>
                <p className="text-xs text-[#66756D] mt-0.5">Screening throughput, referrals, AI concordance, and operational status by facility</p>
              </div>
              <span className="text-[11px] font-semibold text-[#285943] bg-[#285943]/10 px-2.5 py-1 rounded border border-[#285943]/20">
                {phcPerformance.length} Facilities · Network Active
              </span>
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
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            row.attendanceLevel === 'High' ? 'bg-[#F0FDFA] text-[#0D9488]' : 'bg-[#FFF7ED] text-[#D97706]'
                          }`}>
                            {row.attendanceLevel}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-[#E2E7E3] rounded-full overflow-hidden">
                            <div className="h-full bg-[#285943] rounded-full" style={{ width: `${row.confidence}%` }} />
                          </div>
                          <span className="font-mono font-semibold text-[#20312A] text-xs">{row.confidence}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#66756D]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button type="button" className="text-[11px] font-semibold text-[#66756D] hover:text-[#16866A] border border-[#E2E7E3] px-2.5 py-1 rounded-md hover:bg-[#F8FAF7] transition-colors cursor-pointer">
                          View Center
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Network Aggregate Footer */}
                <tfoot>
                  <tr className="bg-[#F8FAF7] border-t-2 border-[#E2E7E3] font-bold">
                    <td className="py-3.5 px-4 text-[#285943] text-xs uppercase tracking-wider border-t-2 border-[#E2E7E3] bg-[#F8FAF7]">Network Total</td>
                    <td className="py-3.5 px-3 text-center font-mono text-[#20312A] border-t-2 border-[#E2E7E3] bg-[#F8FAF7]">{networkTotals.workers}</td>
                    <td className="py-3.5 px-3 font-mono text-[#285943] border-t-2 border-[#E2E7E3] bg-[#F8FAF7]">{networkTotals.screenings.toLocaleString()}</td>
                    <td className="py-3.5 px-3 font-mono text-[#20312A] border-t-2 border-[#E2E7E3] bg-[#F8FAF7]">{networkTotals.referrals}</td>
                    <td className="py-3.5 px-3 font-semibold text-[#20312A] border-t-2 border-[#E2E7E3] bg-[#F8FAF7]">{networkTotals.attendance}</td>
                    <td className="py-3.5 px-3 font-mono text-[#20312A] border-t-2 border-[#E2E7E3] bg-[#F8FAF7]">{networkTotals.confidence}%</td>
                    <td className="py-3.5 px-3 text-xs text-[#0D9488] font-semibold border-t-2 border-[#E2E7E3] bg-[#F8FAF7]">All Online</td>
                    <td className="py-3.5 px-4 border-t-2 border-[#E2E7E3] bg-[#F8FAF7]" />
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
