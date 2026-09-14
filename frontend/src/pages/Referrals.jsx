import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  Download,
  Calendar,
  Filter,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Eye,
  FileText,
  ExternalLink,
  ShieldCheck,
  Building2,
  TrendingUp
} from 'lucide-react'
import DoctorNavbar from '../components/DoctorNavbar'
import GradeBadge from '../components/GradeBadge'

export default function Referrals() {
  const navigate = useNavigate()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'Pending', 'Sent', 'Attended', 'No Show'
  const [urgencyFilter, setUrgencyFilter] = useState('all') // 'all', 'critical_urgent', 'high', 'routine'
  const [phcFilter, setPhcFilter] = useState('all')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showExportToast, setShowExportToast] = useState(false)

  // Referral mock records matching Stitch ground truth
  const referralsData = [
    {
      id: 'DRI-2026-00419',
      name: 'Ravi T.',
      drGrade: 4,
      drGradeLabel: 'Grade 4 · Proliferative DR',
      phc: 'PHC Chelur',
      urgency: 'Critical · 24-48h',
      urgencyType: 'critical',
      referredOn: 'Today, 8:10 AM',
      status: 'Pending',
      referredBy: 'Tele-Health Worker Kavya N. (PHC Chelur)',
      aiConfidence: '94%',
      doctorStance: 'Confirmed by Dr. Arjun Sharma',
      handoffNotes: 'Preretinal hemorrhages confirmed in superior temporal arcade. Neovascularization at disc. Emergency tele-ophthalmology protocol: Transport vehicle dispatched to District Eye Hospital.'
    },
    {
      id: 'DRI-2026-00411',
      name: 'Mahesh K.',
      drGrade: 3,
      drGradeLabel: 'Grade 3 · Severe NPDR',
      phc: 'PHC Hosakote',
      urgency: 'Urgent · 48h',
      urgencyType: 'urgent',
      referredOn: 'Yesterday, 4:25 PM',
      status: 'Sent',
      referredBy: 'Community Nurse Rajeshwari B. (PHC Hosakote)',
      aiConfidence: '91%',
      doctorStance: 'Confirmed by Dr. Arjun Sharma',
      handoffNotes: 'Extensive microaneurysms, venous beading in 2 quadrants. Patient briefed on urgency; transport confirmed for District Retina Clinic tomorrow morning.'
    },
    {
      id: 'DRI-2026-00421',
      name: 'Anitha R.',
      drGrade: 2,
      drGradeLabel: 'Grade 2 · Moderate NPDR',
      phc: 'PHC Hosakote',
      urgency: 'High · 7 Days',
      urgencyType: 'high',
      referredOn: 'Today, 9:30 AM',
      status: 'Pending',
      referredBy: 'Health Assistant Prema V. (PHC Hosakote)',
      aiConfidence: '89%',
      doctorStance: 'Confirmed by Dr. Arjun Sharma',
      handoffNotes: 'Hard exudates approaching macula perifoveal zone. Advised strict glycemic control and OPD slot booking at secondary center within 7 days.'
    },
    {
      id: 'DRI-2026-00408',
      name: 'Farooq A.',
      drGrade: 3,
      drGradeLabel: 'Grade 3 · Severe NPDR',
      phc: 'PHC Hosakote',
      urgency: 'Urgent · 48h',
      urgencyType: 'urgent',
      referredOn: '2 days ago',
      status: 'Sent',
      referredBy: 'Health Worker Manjunath G. (PHC Hosakote)',
      aiConfidence: '93%',
      doctorStance: 'Confirmed by Dr. Arjun Sharma',
      handoffNotes: 'Multiple cotton wool spots with intraretinal microvascular abnormalities. Referral letter and fundus copies sent to district hospital reception.'
    },
    {
      id: 'DRI-2026-00412',
      name: 'Lakshmi D.',
      drGrade: 2,
      drGradeLabel: 'Grade 2 · Moderate NPDR',
      phc: 'PHC Chelur',
      urgency: 'High · 7 Days',
      urgencyType: 'high',
      referredOn: '5 days ago',
      status: 'Attended',
      referredBy: 'Tele-Health Worker Kavya N. (PHC Chelur)',
      aiConfidence: '88%',
      doctorStance: 'Confirmed by Dr. Arjun Sharma',
      handoffNotes: 'Patient checked into District Hospital Retina OPD. Optical coherence tomography scheduled. Follow-up logged into DRISHTI continuum system.'
    },
    {
      id: 'DRI-2026-00415',
      name: 'Savithri M.',
      drGrade: 1,
      drGradeLabel: 'Grade 1 · Mild NPDR',
      phc: 'PHC Hosakote',
      urgency: 'Routine',
      urgencyType: 'routine',
      referredOn: '8 days ago',
      status: 'Attended',
      referredBy: 'Community Nurse Rajeshwari B. (PHC Hosakote)',
      aiConfidence: '96%',
      doctorStance: 'Confirmed by Dr. Arjun Sharma',
      handoffNotes: 'Routine PHC glycemic follow-up completed. Glycemic targets reviewed with primary health officer. Rescreening scheduled in 6 months.'
    },
    {
      id: 'DRI-2026-00401',
      name: 'Govindappa N.',
      drGrade: 3,
      drGradeLabel: 'Grade 3 · Severe NPDR',
      phc: 'PHC Chintamani',
      urgency: 'Urgent · 48h',
      urgencyType: 'urgent',
      referredOn: '9 days ago',
      status: 'Attended',
      referredBy: 'Tele-Health Worker Manjunath G. (PHC Chintamani)',
      aiConfidence: '92%',
      doctorStance: 'Confirmed by Dr. Arjun Sharma',
      handoffNotes: 'Consultation completed at District Hospital Vitreoretinal OPD. Panretinal photocoagulation laser therapy planned.'
    },
    {
      id: 'DRI-2026-00398',
      name: 'Muniyappa K.',
      drGrade: 2,
      drGradeLabel: 'Grade 2 · Moderate NPDR',
      phc: 'PHC Hosakote',
      urgency: 'High · 7 Days',
      urgencyType: 'high',
      referredOn: '12 days ago',
      status: 'No Show',
      referredBy: 'Health Assistant Prema V. (PHC Hosakote)',
      aiConfidence: '90%',
      doctorStance: 'Confirmed by Dr. Arjun Sharma',
      handoffNotes: 'Patient missed scheduled hospital consult appointment. Community health worker dispatched for home visit counselling.'
    }
  ]

  // Filter calculations
  const filteredReferrals = referralsData.filter(item => {
    // Status
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    // Urgency
    if (urgencyFilter === 'critical_urgent' && item.drGrade < 3) return false
    if (urgencyFilter === 'high' && item.drGrade !== 2) return false
    if (urgencyFilter === 'routine' && item.drGrade > 1) return false
    // PHC
    if (phcFilter !== 'all' && item.phc !== phcFilter) return false
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesName = item.name.toLowerCase().includes(q)
      const matchesId = item.id.toLowerCase().includes(q)
      const matchesPhc = item.phc.toLowerCase().includes(q)
      if (!matchesName && !matchesId && !matchesPhc) return false
    }
    return true
  })

  // Export action
  const handleExport = () => {
    setShowExportToast(true)
    setTimeout(() => setShowExportToast(false), 2500)
  }

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setUrgencyFilter('all')
    setPhcFilter('all')
  }

  const isFiltered = searchQuery || statusFilter !== 'all' || urgencyFilter !== 'all' || phcFilter !== 'all'

  // Status pills (ultra-subtle ghost pill)
  const getStatusPill = (status) => {
    return (
      <span className="bg-transparent border border-[#E2E7E3] text-[#475569] px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center whitespace-nowrap">
        {status}
      </span>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A] antialiased pb-16">
      <DoctorNavbar />

      {/* FULL-WIDTH CRITICAL TRIAGE STRIP */}
      <div className="w-full bg-[#B91C1C] text-white font-bold tracking-wide px-4 py-2.5 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <span className="text-xs sm:text-sm font-bold tracking-wide text-white">
              Triage Status: 4 Critical Referrals Require Urgent Vitreoretinal Transport
            </span>
          </div>
          <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30 backdrop-blur-xs">
            Review SLA: 24–48h · Immediate Action
          </span>
        </div>
      </div>

      {/* Toast Notification */}
      {showExportToast && (
        <div className="fixed top-6 right-6 z-[9999] bg-[#20312A] text-white text-xs px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in duration-200 border border-[#E2E7E3] pointer-events-auto">
          <Download className="w-4 h-4 text-[#16866A]" />
          <span>Exporting Referral Log (CSV)... Download ready.</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Breadcrumb & Workspace Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/doctor-dashboard"
            className="group inline-flex items-center gap-1.5 text-xs font-medium text-[#66756D] hover:text-[#16866A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Doctor Dashboard</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#285943]/10 border border-[#285943]/20 rounded-md">
            <FileText className="w-3.5 h-3.5 text-[#285943]" />
            <span className="text-[11px] font-semibold text-[#285943] uppercase tracking-wider">
              Workspace: Referrals Management
            </span>
          </div>
        </div>

        {/* Page Header Card */}
        <div className="bg-white rounded-xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(40,89,67,0.04)] border border-[#E2E7E3]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col max-w-2xl">
              <h1 className="text-xl sm:text-2xl font-bold text-[#20312A] tracking-tight font-heading mb-1">
                Referral Board
              </h1>
              <p className="text-sm text-[#66756D] mb-2">
                Track referred patients from pending dispatch to attendance outcome across network facilities.
              </p>
              <div className="flex items-center gap-1.5 text-[#66756D] text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#16866A]" />
                <span>Referral outcomes support continuum of care after AI-assisted screening and doctor review.</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAF7] border border-[#E2E7E3] text-[#20312A] text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#66756D]" />
                <span>Today · 24 Oct 2026</span>
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="h-9 px-3.5 rounded-lg bg-white hover:bg-[#F8FAF7] border border-[#E2E7E3] text-[#20312A] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#66756D]" />
                <span>Export Referral Log</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Elevated Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Total Referrals */}
          <div className="bg-white rounded-xl p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] border border-[#E2E7E3] border-l-4 border-l-[#285943] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#66756D]">Total Referrals (Month)</span>
              <Users className="w-4 h-4 text-[#285943]" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#285943] tracking-tight font-heading mb-1.5">68</div>
            <div className="flex items-center gap-1 text-xs text-[#66756D]">
              <span className="text-[#047857] font-semibold inline-flex items-center text-xs">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />+12%
              </span>
              <span>from last month · 5 PHCs</span>
            </div>
          </div>

          {/* Stat 2: Attendance Rate */}
          <div className="bg-white rounded-xl p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] border border-[#E2E7E3] border-l-4 border-l-[#16866A] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#66756D]">Attendance Rate</span>
              <CheckCircle2 className="w-4 h-4 text-[#16866A]" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#16866A] tracking-tight font-heading mb-1.5">78%</div>
            <div className="flex items-center gap-1.5 text-xs text-[#66756D]">
              <span className="px-1.5 py-0.5 rounded bg-[#E6F4EA] text-[#047857] font-semibold text-[11px] border border-[#047857]/20">Target ≥75%</span>
              <span>· 53 attended</span>
            </div>
          </div>

          {/* Stat 3: Avg Days to Attendance */}
          <div className="bg-white rounded-xl p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] border border-[#E2E7E3] border-l-4 border-l-[#64748B] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#66756D]">Avg Days to Attendance</span>
              <Clock className="w-4 h-4 text-[#64748B]" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#64748B] tracking-tight font-heading mb-1.5">
              5.6 <span className="text-sm font-normal text-[#66756D]">days</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#66756D]">
              <Clock className="w-3.5 h-3.5 text-[#047857]" />
              <span>Within standard 7-day protocol</span>
            </div>
          </div>

          {/* Stat 4: Open / Pending */}
          <div className="bg-white rounded-xl p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] border border-[#E2E7E3] border-l-4 border-l-[#DC2626] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#66756D]">Open / Pending</span>
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#DC2626] tracking-tight font-heading mb-1.5">14</div>
            <div className="flex items-center gap-1 text-xs text-[#DC2626] font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>4 require urgent transport</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs Card */}
        <div className="bg-white rounded-xl px-5 pt-3.5 pb-0 shadow-[0_2px_12px_rgba(40,89,67,0.04)] border border-slate-200">
          <div className="flex flex-wrap items-center gap-6 border-b border-[#E2E7E3]">
            {[
              { id: 'all', label: 'All', count: referralsData.length },
              { id: 'Pending', label: 'Pending', count: referralsData.filter(r => r.status === 'Pending').length },
              { id: 'Sent', label: 'Sent', count: referralsData.filter(r => r.status === 'Sent').length },
              { id: 'Attended', label: 'Attended', count: referralsData.filter(r => r.status === 'Attended').length },
              { id: 'No Show', label: 'No Show', count: referralsData.filter(r => r.status === 'No Show').length }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'border-b-2 border-[#285943] text-[#285943] font-bold pb-2'
                    : 'text-[#66756D] hover:text-[#20312A] pb-2 border-b-2 border-transparent font-medium'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono ${
                  statusFilter === tab.id ? 'bg-[#285943]/10 text-[#285943]' : 'bg-slate-100 text-[#66756D]'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Dropdown Filter Toolbar */}
        <div className="bg-white rounded-xl p-3 shadow-[0_2px_12px_rgba(40,89,67,0.04)] border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, ID (e.g. DRI-2026-00419), or PHC..."
              className="w-full h-9 pl-9 pr-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#16866A] focus:border-[#16866A] border border-[#E2E7E3] transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
            {/* Urgency select */}
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="h-9 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 cursor-pointer"
            >
              <option value="all">All Urgencies</option>
              <option value="critical_urgent">Critical & Urgent (Grades 3-4)</option>
              <option value="high">High (Grade 2)</option>
              <option value="routine">Routine (Grade 1)</option>
            </select>

            {/* PHC select */}
            <select
              value={phcFilter}
              onChange={(e) => setPhcFilter(e.target.value)}
              className="h-9 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 cursor-pointer"
            >
              <option value="all">All PHCs</option>
              <option value="PHC Hosakote">PHC Hosakote</option>
              <option value="PHC Chelur">PHC Chelur</option>
              <option value="PHC Chintamani">PHC Chintamani</option>
            </select>

            {/* Clear filters */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="h-9 px-3 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors border border-rose-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(40,89,67,0.04)] overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-3">DR Grade</th>
                  <th className="py-3 px-3">PHC Unit</th>
                  <th className="py-3 px-3">Urgency</th>
                  <th className="py-3 px-3">Referred</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredReferrals.length > 0 ? (
                  filteredReferrals.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#20312A]">{row.name}</div>
                        <div className="text-xs text-[#66756D] font-mono">{row.id}</div>
                      </td>
                      <td className="py-3 px-3">
                        <GradeBadge grade={row.drGrade} />
                      </td>
                      <td className="py-3 px-3 text-xs text-[#20312A] font-medium">
                        {row.phc}
                      </td>
                      <td className="py-3 px-3">
                        {row.urgency.toLowerCase().includes('critical') || row.urgency.toLowerCase().includes('urgent') ? (
                          <span className="text-[#DC2626] font-bold text-xs uppercase flex items-center gap-1 whitespace-nowrap">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>{row.urgency}</span>
                          </span>
                        ) : (
                          <span className="text-[#475569] font-bold text-xs uppercase flex items-center gap-1 whitespace-nowrap">
                            <Clock size={14} className="shrink-0" />
                            <span>{row.urgency}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-[#20312A]">
                        {row.referredOn}
                      </td>
                      <td className="py-3 px-3">
                        {getStatusPill(row.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedPatient(row)}
                            className="bg-transparent text-[#66756D] hover:text-[#285943] hover:bg-[#F3F6F1] font-semibold rounded-lg px-3 py-1.5 transition-colors cursor-pointer text-xs"
                          >
                            Quick View
                          </button>
                          <Link
                            to={`/history/${row.id}`}
                            className="p-1 text-slate-400 hover:text-[#16866A] rounded transition-colors"
                            title="Full Patient History"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                      <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400 mb-3">
                        <Filter className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-slate-800">No matching referrals found</p>
                      <p className="text-xs text-slate-500 mt-1">Try resetting your filters or search query.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* QUICK VIEW SLIDE-OVER DRAWER */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-[#E2E7E3] overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E2E7E3] bg-white flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-[#20312A] leading-tight font-heading">
                    {selectedPatient.name}
                  </h2>
                  <span className="px-2.5 py-0.5 bg-[#F8FAF7] text-[#20312A] border border-[#E2E7E3] font-mono text-xs rounded-md font-semibold">
                    {selectedPatient.id}
                  </span>
                </div>
                <div className="mt-1.5">
                  {getStatusPill(selectedPatient.status)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#66756D] hover:text-[#20312A] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-[#66756D]" strokeWidth={2} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 text-left">
              {/* Context */}
              <div className="mb-4 bg-[#F8FAF7] rounded-xl p-4 border border-[#E2E7E3]">
                <div className="text-[#285943] text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#285943]" strokeWidth={2} />
                  <span>Referral Context</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-[#66756D] block text-xs font-medium">Referred By</span>
                    <span className="text-[#20312A] font-semibold text-sm">{selectedPatient.referredBy}</span>
                  </div>
                  <div>
                    <span className="text-[#66756D] block text-xs font-medium">Referred Date</span>
                    <span className="text-[#20312A] font-medium text-sm">{selectedPatient.referredOn}</span>
                  </div>
                  <div>
                    <span className="text-[#66756D] block text-xs font-medium">Urgency Protocol</span>
                    <span className={`text-sm font-bold ${selectedPatient.urgencyType === 'critical' ? 'text-[#DC2626]' : selectedPatient.urgencyType === 'urgent' ? 'text-[#D97706]' : 'text-[#20312A]'}`}>
                      {selectedPatient.urgency}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI & Clinical Evaluation */}
              <div className="mb-4 bg-[#F8FAF7] rounded-xl p-4 border border-[#E2E7E3]">
                <div className="text-[#16866A] text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#16866A]" strokeWidth={2} />
                  <span>AI &amp; Clinical Evaluation</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[#66756D] block text-xs font-medium mb-1.5">Diagnosed DR Grade</span>
                    <GradeBadge grade={selectedPatient.drGrade} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E2E7E3]">
                    <div>
                      <span className="text-[#66756D] block text-xs font-medium">AI Confidence</span>
                      <span className="text-2xl font-extrabold text-[#20312A] font-heading">{selectedPatient.aiConfidence}</span>
                    </div>
                    <div>
                      <span className="text-[#66756D] block text-xs font-medium">Review Stance</span>
                      <span className="text-sm font-semibold text-[#047857] block mt-1">{selectedPatient.doctorStance}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4 bg-[#F8FAF7] rounded-xl p-4 border border-[#E2E7E3]">
                <div className="text-[#20312A] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#285943]" strokeWidth={2} />
                  <span>Action &amp; Handoff Notes</span>
                </div>
                <p className="text-xs sm:text-sm text-[#20312A] bg-white p-3 rounded-lg border border-[#E2E7E3] leading-relaxed font-normal">
                  {selectedPatient.handoffNotes}
                </p>
              </div>
            </div>

            {/* Pinned Bottom CTA */}
            <div className="p-4 border-t border-[#E2E7E3] bg-white flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null)
                  navigate(`/history/${selectedPatient.id}`)
                }}
                className="btn-gradient-pill w-full min-h-[44px] h-12 text-sm font-bold shadow-xs hover:brightness-105 hover:shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Eye className="w-4 h-4 text-[#14532D]" strokeWidth={2} />
                <span>Open Full Patient History</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
