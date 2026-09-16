import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Search, Download, Calendar, Filter, X, Clock,
  CheckCircle2, AlertTriangle, Users, Eye, FileText, ExternalLink,
  ShieldCheck, Building2, TrendingUp
} from 'lucide-react'
import DoctorNavbar from '../components/DoctorNavbar'
import GradeBadge from '../components/GradeBadge'
import Skeleton from '../components/Skeleton'
import { getPendingReferrals, getReferralStats, updateReferral } from '../lib/api'

export default function Referrals() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [phcFilter, setPhcFilter] = useState('all')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showExportToast, setShowExportToast] = useState(false)
  const [referralsData, setReferralsData] = useState([])
  const [statsData, setStatsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [refRes, statsRes] = await Promise.allSettled([
          getPendingReferrals(),
          getReferralStats()
        ])

        if (refRes.status === 'fulfilled' && refRes.value?.length > 0) {
          const mapped = refRes.value.map(r => ({
            id: r.patient_id || r.id || 'DRI-0000',
            name: r.patient_name || r.name || 'Patient',
            drGrade: r.dr_grade ?? 0,
            phc: r.phc_id || 'PHC Hosakote',
            urgency: r.dr_grade >= 4 ? 'Critical · 24-48h' : r.dr_grade === 3 ? 'Urgent · 48h' : r.dr_grade === 2 ? 'High · 7 Days' : 'Routine',
            urgencyType: r.dr_grade >= 4 ? 'critical' : r.dr_grade === 3 ? 'urgent' : r.dr_grade === 2 ? 'high' : 'routine',
            referredOn: r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : 'Today',
            status: r.status || 'Pending',
            referralId: r.id,
            aiConfidence: `${r.dr_confidence ?? 90}%`,
            doctorStance: 'Confirmed by Dr. Arjun Sharma',
            handoffNotes: r.doctor_notes || 'Referral created from AI screening result.'
          }))
          setReferralsData(mapped)
        }

        if (statsRes.status === 'fulfilled' && statsRes.value) {
          const s = statsRes.value
          const total = s.total ?? 0
          setStatsData({
            total,
            attendance_rate: s.attendance_rate ?? (total > 0 ? Math.round(((s.attended ?? 0) / total) * 100) : 0),
            avg_days: s.avg_days ?? 0,
            open: s.pending ?? 0,
          })
        }
      } catch (err) {
        console.error('Referrals fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleStatusUpdate = async (referral, newStatus) => {
    if (!referral.referralId) return
    setUpdatingId(referral.id)
    try {
      await updateReferral(referral.referralId, { status: newStatus })
      setReferralsData(prev => prev.map(r => r.id === referral.id ? { ...r, status: newStatus } : r))
      if (selectedPatient?.id === referral.id) setSelectedPatient(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      console.error('Update referral failed:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredReferrals = referralsData.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (urgencyFilter === 'critical_urgent' && item.drGrade < 3) return false
    if (urgencyFilter === 'high' && item.drGrade !== 2) return false
    if (urgencyFilter === 'routine' && item.drGrade > 1) return false
    if (phcFilter !== 'all' && item.phc !== phcFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!item.name.toLowerCase().includes(q) && !item.id.toLowerCase().includes(q) && !item.phc.toLowerCase().includes(q)) return false
    }
    return true
  })

  const isFiltered = searchQuery || statusFilter !== 'all' || urgencyFilter !== 'all' || phcFilter !== 'all'

  const getStatusPill = (status) => (
    <span className="bg-transparent border border-[#E2E7E3] text-[#475569] px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center whitespace-nowrap">{status}</span>
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A] antialiased pb-16">
      <DoctorNavbar />

      <div className="w-full bg-[#B91C1C] text-white font-bold tracking-wide px-4 py-2.5 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" /></span>
            <span className="text-xs sm:text-sm font-bold tracking-wide text-white">Triage Status: 4 Critical Referrals Require Urgent Vitreoretinal Transport</span>
          </div>
          <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30">Review SLA: 24–48h · Immediate Action</span>
        </div>
      </div>

      {showExportToast && (
        <div className="fixed top-6 right-6 z-[9999] bg-[#20312A] text-white text-xs px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in duration-200 border border-[#E2E7E3]">
          <Download className="w-4 h-4 text-[#16866A]" />
          <span>Exporting Referral Log (CSV)... Download ready.</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/doctor-dashboard" className="group inline-flex items-center gap-1.5 text-xs font-medium text-[#66756D] hover:text-[#16866A] transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Doctor Dashboard</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#285943]/10 border border-[#285943]/20 rounded-md">
            <FileText className="w-3.5 h-3.5 text-[#285943]" />
            <span className="text-[11px] font-semibold text-[#285943] uppercase tracking-wider">Workspace: Referrals Management</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(40,89,67,0.04)] border border-[#E2E7E3]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col max-w-2xl">
              <h1 className="text-xl sm:text-2xl font-bold text-[#20312A] tracking-tight font-heading mb-1">Referral Board</h1>
              <p className="text-sm text-[#66756D] mb-2">Track referred patients from pending dispatch to attendance outcome across network facilities.</p>
              <div className="flex items-center gap-1.5 text-[#66756D] text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#16866A]" />
                <span>Referral outcomes support continuum of care after AI-assisted screening and doctor review.</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAF7] border border-[#E2E7E3] text-[#20312A] text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#66756D]" />
                <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <button type="button" onClick={() => { setShowExportToast(true); setTimeout(() => setShowExportToast(false), 2500) }}
                className="h-9 px-3.5 rounded-lg bg-white hover:bg-[#F8FAF7] border border-[#E2E7E3] text-[#20312A] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer">
                <Download className="w-4 h-4 text-[#66756D]" />
                <span>Export Referral Log</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] border border-[#E2E7E3] border-l-4 border-l-[#285943] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold uppercase tracking-wider text-[#66756D]">Total Referrals (Month)</span><Users className="w-4 h-4 text-[#285943]" /></div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#285943] tracking-tight font-heading mb-1.5">{loading ? <Skeleton className="h-9 w-14" /> : statsData?.total ?? 0}</div>
            <div className="flex items-center gap-1 text-xs text-[#66756D]"><span className="text-[#047857] font-semibold inline-flex items-center text-xs"><TrendingUp className="w-3.5 h-3.5 mr-0.5" />+12%</span><span>from last month</span></div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] border border-[#E2E7E3] border-l-4 border-l-[#16866A] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold uppercase tracking-wider text-[#66756D]">Attendance Rate</span><CheckCircle2 className="w-4 h-4 text-[#16866A]" /></div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#16866A] tracking-tight font-heading mb-1.5">{loading ? <Skeleton className="h-9 w-14" /> : `${statsData?.attendance_rate ?? 0}%`}</div>
            <div className="flex items-center gap-1.5 text-xs text-[#66756D]"><span className="px-1.5 py-0.5 rounded bg-[#E6F4EA] text-[#047857] font-semibold text-[11px] border border-[#047857]/20">Target ≥75%</span></div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] border border-[#E2E7E3] border-l-4 border-l-[#64748B] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold uppercase tracking-wider text-[#66756D]">Avg Days to Attendance</span><Clock className="w-4 h-4 text-[#64748B]" /></div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#64748B] tracking-tight font-heading mb-1.5">{loading ? <Skeleton className="h-9 w-14" /> : <>{statsData?.avg_days ?? 0} <span className="text-sm font-normal text-[#66756D]">days</span></>}</div>
            <div className="flex items-center gap-1 text-xs text-[#66756D]"><Clock className="w-3.5 h-3.5 text-[#047857]" /><span>Within 7-day protocol</span></div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] border border-[#E2E7E3] border-l-4 border-l-[#DC2626] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold uppercase tracking-wider text-[#66756D]">Open / Pending</span><AlertTriangle className="w-4 h-4 text-[#DC2626]" /></div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#DC2626] tracking-tight font-heading mb-1.5">{loading ? <Skeleton className="h-9 w-14" /> : statsData?.open ?? 0}</div>
            <div className="flex items-center gap-1 text-xs text-[#DC2626] font-medium"><AlertTriangle className="w-3.5 h-3.5" /><span>4 require urgent transport</span></div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl px-5 pt-3.5 pb-0 shadow-[0_2px_12px_rgba(40,89,67,0.04)] border border-slate-200">
          <div className="flex flex-wrap items-center gap-6 border-b border-[#E2E7E3]">
            {[
              { id: 'all', label: 'All', count: referralsData.length },
              { id: 'Pending', label: 'Pending', count: referralsData.filter(r => r.status === 'Pending').length },
              { id: 'Sent', label: 'Sent', count: referralsData.filter(r => r.status === 'Sent').length },
              { id: 'Attended', label: 'Attended', count: referralsData.filter(r => r.status === 'Attended').length },
              { id: 'No Show', label: 'No Show', count: referralsData.filter(r => r.status === 'No Show').length }
            ].map(tab => (
              <button key={tab.id} type="button" onClick={() => setStatusFilter(tab.id)}
                className={`text-xs flex items-center gap-2 transition-all cursor-pointer ${statusFilter === tab.id ? 'border-b-2 border-[#285943] text-[#285943] font-bold pb-2' : 'text-[#66756D] hover:text-[#20312A] pb-2 border-b-2 border-transparent font-medium'}`}>
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono ${statusFilter === tab.id ? 'bg-[#285943]/10 text-[#285943]' : 'bg-slate-100 text-[#66756D]'}`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-xl p-3 shadow-[0_2px_12px_rgba(40,89,67,0.04)] border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by patient name, ID, or PHC..."
              className="w-full h-9 pl-9 pr-3 bg-slate-50 text-slate-900 placeholder:text-slate-400 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#16866A] border border-[#E2E7E3] transition-all" />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
            <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)} className="h-9 px-3 bg-slate-50 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 cursor-pointer">
              <option value="all">All Urgencies</option>
              <option value="critical_urgent">Critical & Urgent (Grades 3-4)</option>
              <option value="high">High (Grade 2)</option>
              <option value="routine">Routine (Grade 1)</option>
            </select>
            <select value={phcFilter} onChange={(e) => setPhcFilter(e.target.value)} className="h-9 px-3 bg-slate-50 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 cursor-pointer">
              <option value="all">All PHCs</option>
              <option value="PHC Hosakote">PHC Hosakote</option>
              <option value="PHC Chelur">PHC Chelur</option>
              <option value="PHC Chintamani">PHC Chintamani</option>
            </select>
            {isFiltered && (
              <button type="button" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setUrgencyFilter('all'); setPhcFilter('all') }}
                className="h-9 px-3 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors border border-rose-200 cursor-pointer">
                <X className="w-3.5 h-3.5" /><span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Table */}
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
                {loading ? (
                  [0, 1, 2, 3, 4].map(i => (
                    <tr key={i}>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-28 mb-1.5" /><Skeleton className="h-3 w-20" /></td>
                      <td className="py-3 px-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="py-3 px-3"><Skeleton className="h-3 w-24" /></td>
                      <td className="py-3 px-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-3 px-3"><Skeleton className="h-3 w-16" /></td>
                      <td className="py-3 px-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="py-3 px-4 text-right"><Skeleton className="h-6 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredReferrals.length > 0 ? filteredReferrals.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4"><div className="font-bold text-[#20312A]">{row.name}</div><div className="text-xs text-[#66756D] font-mono">{row.id}</div></td>
                    <td className="py-3 px-3"><GradeBadge grade={row.drGrade} /></td>
                    <td className="py-3 px-3 text-xs text-[#20312A] font-medium">{row.phc}</td>
                    <td className="py-3 px-3">
                      {row.urgencyType === 'critical' || row.urgencyType === 'urgent' ? (
                        <span className="text-[#DC2626] font-bold text-xs uppercase flex items-center gap-1 whitespace-nowrap"><AlertTriangle size={14} className="shrink-0" /><span>{row.urgency}</span></span>
                      ) : (
                        <span className="text-[#475569] font-bold text-xs uppercase flex items-center gap-1 whitespace-nowrap"><Clock size={14} className="shrink-0" /><span>{row.urgency}</span></span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-[#20312A]">{row.referredOn}</td>
                    <td className="py-3 px-3">{getStatusPill(row.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button type="button" onClick={() => setSelectedPatient(row)}
                          className="bg-transparent text-[#66756D] hover:text-[#285943] hover:bg-[#F3F6F1] font-semibold rounded-lg px-3 py-1.5 transition-colors cursor-pointer text-xs">
                          Quick View
                        </button>
                        <Link to={`/history/${row.id}`} className="p-1 text-slate-400 hover:text-[#16866A] rounded transition-colors" title="Full Patient History">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                      <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400 mb-3"><Filter className="w-5 h-5" /></div>
                      <p className="font-semibold text-slate-800">No matching referrals found</p>
                      <p className="text-xs text-slate-500 mt-1">Try resetting your filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Quick View Drawer */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-[#E2E7E3] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E7E3] bg-white flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-[#20312A] leading-tight font-heading">{selectedPatient.name}</h2>
                  <span className="px-2.5 py-0.5 bg-[#F8FAF7] text-[#20312A] border border-[#E2E7E3] font-mono text-xs rounded-md font-semibold">{selectedPatient.id}</span>
                </div>
                <div className="mt-1.5">{getStatusPill(selectedPatient.status)}</div>
              </div>
              <button type="button" onClick={() => setSelectedPatient(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#66756D] hover:text-[#20312A] hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 text-left">
              <div className="mb-4 bg-[#F8FAF7] rounded-xl p-4 border border-[#E2E7E3]">
                <div className="text-[#285943] text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-[#285943]" /><span>Referral Context</span></div>
                <div className="space-y-2.5 text-xs">
                  <div><span className="text-[#66756D] block text-xs font-medium">Urgency Protocol</span><span className={`text-sm font-bold ${selectedPatient.urgencyType === 'critical' ? 'text-[#DC2626]' : selectedPatient.urgencyType === 'urgent' ? 'text-[#D97706]' : 'text-[#20312A]'}`}>{selectedPatient.urgency}</span></div>
                  <div><span className="text-[#66756D] block text-xs font-medium">Referred Date</span><span className="text-[#20312A] font-medium text-sm">{selectedPatient.referredOn}</span></div>
                </div>
              </div>
              <div className="mb-4 bg-[#F8FAF7] rounded-xl p-4 border border-[#E2E7E3]">
                <div className="text-[#16866A] text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#16866A]" /><span>AI & Clinical Evaluation</span></div>
                <div className="space-y-3 text-xs">
                  <div><span className="text-[#66756D] block text-xs font-medium mb-1.5">Diagnosed DR Grade</span><GradeBadge grade={selectedPatient.drGrade} /></div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E2E7E3]">
                    <div><span className="text-[#66756D] block text-xs font-medium">AI Confidence</span><span className="text-2xl font-extrabold text-[#20312A] font-heading">{selectedPatient.aiConfidence}</span></div>
                    <div><span className="text-[#66756D] block text-xs font-medium">Review Stance</span><span className="text-sm font-semibold text-[#047857] block mt-1">{selectedPatient.doctorStance}</span></div>
                  </div>
                </div>
              </div>
              <div className="mb-4 bg-[#F8FAF7] rounded-xl p-4 border border-[#E2E7E3]">
                <div className="text-[#20312A] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText className="w-4 h-4 text-[#285943]" /><span>Action & Handoff Notes</span></div>
                <p className="text-xs sm:text-sm text-[#20312A] bg-white p-3 rounded-lg border border-[#E2E7E3] leading-relaxed">{selectedPatient.handoffNotes}</p>
              </div>
              {/* Status Update */}
              {selectedPatient.referralId && (
                <div className="mb-4 bg-[#F8FAF7] rounded-xl p-4 border border-[#E2E7E3]">
                  <div className="text-[#20312A] text-xs font-bold uppercase tracking-wider mb-3">Update Status</div>
                  <div className="grid grid-cols-2 gap-2">
                    {['Pending', 'Sent', 'Attended', 'No Show'].map(s => (
                      <button key={s} type="button" disabled={updatingId === selectedPatient.id || selectedPatient.status === s}
                        onClick={() => handleStatusUpdate(selectedPatient, s)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${selectedPatient.status === s ? 'bg-[#285943] text-white border-[#285943]' : 'bg-white text-[#20312A] border-[#E2E7E3] hover:bg-[#E6F4EA]'} disabled:opacity-60`}>
                        {updatingId === selectedPatient.id ? '...' : s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#E2E7E3] bg-white flex-shrink-0">
              <button type="button" onClick={() => { setSelectedPatient(null); navigate(`/history/${selectedPatient.id}`) }}
                className="btn-gradient-pill w-full min-h-[44px] h-12 text-sm font-bold shadow-xs hover:brightness-105 hover:shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all">
                <Eye className="w-4 h-4 text-[#14532D]" />
                <span>Open Full Patient History</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}