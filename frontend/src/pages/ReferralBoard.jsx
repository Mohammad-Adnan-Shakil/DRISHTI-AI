import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ClipboardList,
  Download,
  MapPin,
  RefreshCw,
  Send,
  Users,
} from 'lucide-react'
import AdminNavbar from '../components/AdminNavbar'
import Skeleton from '../components/Skeleton'
import StatusBadge from '../components/StatusBadge'
import { exportReferralsToCSV } from '../lib/csvExport'
import { getPendingReferrals, getReferralStats, updateReferral } from '../lib/api'

const REFERRAL_STATUSES = ['pending', 'sent', 'attended', 'no_show']

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className={`bg-white rounded-xl border border-[#E2E7E3] border-l-4 ${accent} shadow-[0_2px_12px_rgba(40,89,67,0.04)] p-4 sm:p-5`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[#66756D] uppercase tracking-wider">{label}</span>
        <span className="p-1.5 rounded-lg bg-[#F8FAF7] border border-[#E2E7E3]"><Icon className="w-4 h-4 text-[#285943]" /></span>
      </div>
      <div className="mt-2 text-3xl font-extrabold text-[#20312A] font-heading">{value}</div>
    </div>
  )
}

function ReferralFields({ referral }) {
  return (
    <div>
      <div className="font-semibold text-[#20312A]">{referral.patient_name || 'Unnamed patient'}</div>
      <div className="text-xs text-[#66756D] font-mono">Patient #{referral.patient_id}</div>
    </div>
  )
}

function DirectionsButton({ phcId }) {
  const query = encodeURIComponent(`ophthalmology eye hospital near ${phcId || 'Bengaluru'} Karnataka India`)
  const url = `https://www.google.com/maps/search/${query}`
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#285943] text-white text-xs font-semibold hover:bg-[#1e4232] transition-colors"
    >
      <MapPin className="w-3.5 h-3.5" /> Directions
    </a>
  )
}

export default function ReferralBoard() {
  const [referrals, setReferrals] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [exported, setExported] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    setReferrals(null)
    setStats(null)

    const [referralsResult, statsResult] = await Promise.allSettled([
      getPendingReferrals(),
      getReferralStats(),
    ])

    const failures = []
    if (referralsResult.status === 'fulfilled') setReferrals(referralsResult.value)
    else failures.push('pending referrals')
    if (statsResult.status === 'fulfilled') setStats(statsResult.value)
    else failures.push('referral statistics')

    if (failures.length > 0) {
      setError(`Could not load ${failures.join(' and ')}. Please retry.`)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleStatusChange = async (referralId, status) => {
    if (updatingId) return
    setUpdatingId(referralId)
    setError(null)
    try {
      await updateReferral(referralId, { status })
      await loadData()
      setUpdatingId(null)
    } catch (err) {
      console.error('Referral status update failed:', err)
      setError('Could not update referral status. The displayed data was not changed.')
      setUpdatingId(null)
    }
  }

  const handleExport = () => {
    if (!referrals?.length) return
    exportReferralsToCSV(referrals)
    setExported(true)
    setTimeout(() => setExported(false), 2500)
  }

  const statValue = (key) => loading ? <Skeleton className="h-9 w-12" /> : (stats?.[key] ?? 'N/A')

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8FAF7] flex flex-col antialiased text-[#20312A] pb-16">
      <AdminNavbar />

      {exported && (
        <div role="status" className="fixed top-6 right-6 z-[9999] bg-[#20312A] text-white text-xs px-4 py-3 rounded-lg shadow-xl border border-[#E2E7E3]">
          Referral CSV export ready.
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2E7E3]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#285943]/10 text-[#285943] border border-[#285943]/20 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#285943]" /> Referral Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#20312A] font-heading">Referral Board</h1>
            <p className="text-sm text-[#66756D] mt-1">Live pending referrals and referral status tracking.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={loadData} disabled={loading} className="btn-secondary text-xs disabled:opacity-50 disabled:cursor-not-allowed">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button type="button" onClick={handleExport} disabled={loading || !referrals?.length} className="btn-secondary text-xs disabled:opacity-50 disabled:cursor-not-allowed">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-amber-600" />
            <div className="flex-1">{error}</div>
            <button type="button" onClick={loadData} className="font-semibold underline">Retry</button>
          </div>
        )}

        <section aria-label="Referral statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Referrals" value={statValue('total')} icon={ClipboardList} accent="border-l-[#285943]" />
          <StatCard label="Pending" value={statValue('pending')} icon={Send} accent="border-l-[#D97706]" />
          <StatCard label="Attended" value={statValue('attended')} icon={Users} accent="border-l-[#0D9488]" />
          <StatCard label="No-show" value={statValue('no_show')} icon={AlertCircle} accent="border-l-[#DC2626]" />
        </section>

        <section className="bg-white rounded-xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E7E3] bg-[#F8FAF7] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#20312A] font-heading">Pending Referrals</h2>
              <p className="text-xs text-[#66756D] mt-0.5">Source: live referral records</p>
            </div>
            {!loading && referrals && <span className="text-xs font-semibold text-[#66756D]">{referrals.length} pending</span>}
          </div>

          {loading && (
            <div className="p-5 space-y-4" aria-label="Loading referrals">
              {[1, 2, 3].map(item => <Skeleton key={item} className="h-16 w-full" />)}
            </div>
          )}

          {!loading && !error && referrals?.length === 0 && (
            <div className="p-12 text-center">
              <ClipboardList className="w-10 h-10 mx-auto text-[#66756D] mb-3" />
              <h3 className="text-sm font-bold text-[#20312A]">No pending referrals</h3>
              <p className="text-xs text-[#66756D] mt-1">New pending referrals will appear here when created.</p>
            </div>
          )}

          {!loading && !error && referrals?.length > 0 && (
            <>
              <div className="hidden md:block">
                <div className="w-full overflow-x-auto pb-4">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F8FAF7] border-b border-[#E2E7E3] text-[11px] uppercase tracking-wider text-[#66756D]">
                      <tr>
                        <th className="py-3.5 px-5">Referral</th>
                        <th className="py-3.5 px-3">Patient</th>
                        <th className="py-3.5 px-3">Directions</th>
                        <th className="py-3.5 px-3">Screening</th>
                        <th className="py-3.5 px-3">Date</th>
                        <th className="py-3.5 px-3">Status</th>
                        <th className="py-3.5 px-5 text-right">Update</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E7E3]">
                      {referrals.map(referral => (
                        <tr key={referral.referral_id}>
                          <td className="py-4 px-5 font-mono text-xs text-[#20312A]">#{referral.referral_id}</td>
                          <td className="py-4 px-3"><ReferralFields referral={referral} /></td>
                          <td className="py-4 px-3"><DirectionsButton phcId={referral.phc_id} /></td>
                          <td className="py-4 px-3 font-mono text-xs text-[#20312A]">#{referral.screening_id}</td>
                          <td className="py-4 px-3 text-xs text-[#66756D]">N/A</td>
                          <td className="py-4 px-3"><StatusBadge status={referral.status} /></td>
                          <td className="py-4 px-5 text-right"><StatusSelect referral={referral} updatingId={updatingId} onChange={handleStatusChange} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="md:hidden p-4 space-y-3">
                {referrals.map(referral => (
                  <article key={referral.referral_id} className="border border-[#E2E7E3] rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-mono text-xs text-[#66756D]">Referral #{referral.referral_id}</div>
                      <StatusBadge status={referral.status} />
                    </div>
                    <ReferralFields referral={referral} />
                    <DirectionsButton phcId={referral.phc_id} />
                    <div className="text-xs text-[#20312A] font-mono">Screening #{referral.screening_id}</div>
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#E2E7E3]">
                      <span className="text-xs text-[#66756D]">Date unavailable</span>
                      <StatusSelect referral={referral} updatingId={updatingId} onChange={handleStatusChange} />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

function StatusSelect({ referral, updatingId, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-[#66756D]">
      <span className="sr-only">Update status for referral {referral.referral_id}</span>
      <select
        aria-label={`Update status for referral ${referral.referral_id}`}
        value={referral.status}
        disabled={updatingId != null}
        onChange={event => onChange(referral.referral_id, event.target.value)}
        className="h-9 rounded-lg border border-[#E2E7E3] bg-white px-2 text-xs font-semibold text-[#20312A] focus:outline-none focus:ring-2 focus:ring-[#16866A] disabled:opacity-60"
      >
        {REFERRAL_STATUSES.map(status => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
      </select>
    </label>
  )
}
