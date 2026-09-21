import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, ScanEye, UserPlus, Send, Users, AlertTriangle, Clock, ChevronRight, Calendar, ScanLine } from 'lucide-react'
import Navbar from '../components/Navbar'
import OfflineBanner from '../components/OfflineBanner'
import GradeBadge from '../components/GradeBadge'
import StatusBadge from '../components/StatusBadge'
import StatCard from '../components/StatCard'
import Skeleton from '../components/Skeleton'
import { cn } from '../lib/utils'
import { getScreeningStats, getPendingScreenings } from '../lib/api'
import { getQueueCount } from '../lib/db'
import { useTranslation } from 'react-i18next'

function getConfidenceBarColor(confidence) {
  if (confidence >= 90) return 'bg-[#059669]'
  if (confidence >= 70) return 'bg-[#F59E0B]'
  return 'bg-[#EF4444]'
}

// Card for a single patient in the "Needs Attention" section — styled red for
// urgent (grade >= 3) referrals, amber for routine referral review.
function NeedsAttentionCard({ item }) {
  const { t } = useTranslation()
  const isPriority = item.grade >= 3
  const Icon = isPriority ? AlertTriangle : Send

  return (
    <div className={cn(
      'border border-[#E2E7E3] border-l-4 rounded-2xl p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] flex flex-col justify-between transition-colors gap-4',
      isPriority ? 'bg-red-50/50 border-l-[#EF4444] hover:border-[#EF4444]/40' : 'bg-amber-50/50 border-l-[#F59E0B] hover:border-[#F59E0B]/40'
    )}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base text-[#20312A]">{item.name}</span>
            <span className="text-xs font-medium text-[#475569] font-mono">{item.id}</span>
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-[#475569] border border-slate-200">{item.eye === 'OS' ? t('dashboard.leftEye') : t('dashboard.rightEye')}</span>
            {isPriority && <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#EF4444] text-white uppercase tracking-wider">{t('dashboard.priority')}</span>}
          </div>
          <span className="text-xs font-medium text-[#475569] whitespace-nowrap">{item.time}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GradeBadge grade={item.grade} confidence={item.confidence} />
          <span className={cn(
            'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border',
            isPriority ? 'text-[#DC2626] bg-red-100/80 border-[#EF4444]/30' : 'text-[#B45309] bg-amber-100/80 border-[#F59E0B]/30'
          )}>
            <Icon className={cn('w-3.5 h-3.5', isPriority ? 'text-[#DC2626]' : 'text-[#D97706]')} />
            {isPriority ? t('dashboard.urgentReferral') : t('dashboard.referralPendingDoctorReview')}
          </span>
        </div>
        <div className={cn('flex items-center gap-1.5 text-xs font-medium', isPriority ? 'text-[#DC2626]' : 'text-[#B45309]')}>
          <Clock className={cn('w-3.5 h-3.5', isPriority ? 'text-[#EF4444]' : 'text-[#D97706]')} />
          <span>{isPriority ? t('dashboard.actionNeededToday') : t('dashboard.awaitingTeleOphthalmology')}</span>
        </div>
      </div>
      <div className={cn('flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t gap-2 mt-auto', isPriority ? 'border-[#EF4444]/20' : 'border-[#F59E0B]/20')}>
        <span className="text-xs text-[#475569] hidden sm:inline">{isPriority ? t('dashboard.escalationTarget') : t('dashboard.talukHospital')}</span>
        <Link to={`/history/${item.id}`} className={cn(
          'min-h-[36px] inline-flex items-center justify-center px-4 py-2 text-xs font-semibold bg-white active:scale-[0.98] rounded-xl border focus:outline-none transition-colors cursor-pointer shadow-2xs',
          isPriority ? 'text-[#EF4444] hover:bg-red-50 border-[#EF4444]/35' : 'text-[#D97706] hover:bg-amber-50 border-[#F59E0B]/35'
        )}>
          {t('dashboard.viewPatient')} →
        </Link>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useTranslation();
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })

  const [stats, setStats] = useState(null)
  const [recentScreenings, setRecentScreenings] = useState([])
  const [needsAttention, setNeedsAttention] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      setStats(null)
      setRecentScreenings([])
      setNeedsAttention([])
      try {
        const [statsData, pendingData, queueCount] = await Promise.allSettled([
          getScreeningStats(),
          getPendingScreenings(),
          getQueueCount()
        ])

        if (statsData.status === 'fulfilled' && statsData.value) {
          setStats({
            total_screenings: statsData.value.total_screenings,
            total_referrals: statsData.value.referrals_recommended,
            pending_sync: queueCount.status === 'fulfilled' ? queueCount.value : null,
            total_patients: statsData.value.total_patients,
          })
        }

        if (pendingData.status === 'fulfilled') {
          // Map /api/screenings/pending response to display format
          const mapped = pendingData.value.map(s => ({
            id: s.patient_id ?? s.screening_id,
            name: s.patient_name || t('dashboard.unnamedPatient'),
            time: s.created_at ? new Date(s.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
            eye: s.eye || 'N/A',
            grade: s.dr_grade ?? 0,
            confidence: s.dr_confidence ?? null,
            status: s.referral_recommended ? 'referral-created' : 'screening-complete'
          }))
          setRecentScreenings(mapped.slice(0, 5))
          setNeedsAttention(mapped.slice(0, 2))
        }
        const failures = [
          statsData.status === 'rejected' ? t('dashboard.statsFailedLabel') : null,
          pendingData.status === 'rejected' ? t('dashboard.pendingFailedLabel') : null,
          queueCount.status === 'rejected' ? t('dashboard.queueFailedLabel') : null,
        ].filter(Boolean)
        if (failures.length > 0) {
          setError(`${t('dashboard.couldNotLoad')} ${failures.join(` ${t('common.and')} `)}. ${t('dashboard.pleaseRetry')}`)
        }
      } catch (err) {
        console.error('Dashboard fetch failed:', err)
        setError(t('dashboard.dashboardDataUnavailableMessage'))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [reloadToken])

  // Live-update the "Pending Sync" count as screenings are queued offline or
  // synced back, without waiting for a full dashboard refresh.
  useEffect(() => {
    const refreshQueueCount = async () => {
      try {
        const count = await getQueueCount()
        setStats(prev => prev ? { ...prev, pending_sync: count } : prev)
      } catch (err) {
        console.error('Failed to refresh offline queue count:', err)
      }
    }
    const handleQueued = () => refreshQueueCount()
    const handleDequeued = () => refreshQueueCount()
    window.addEventListener('drishti:offline-queued', handleQueued)
    window.addEventListener('drishti:offline-dequeued', handleDequeued)
    return () => {
      window.removeEventListener('drishti:offline-queued', handleQueued)
      window.removeEventListener('drishti:offline-dequeued', handleDequeued)
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A]">
        <Navbar />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div role="alert" className="bg-white rounded-xl border border-amber-200 p-8 text-center">
            <AlertTriangle className="w-10 h-10 mx-auto text-amber-600 mb-3" />
            <h1 className="text-lg font-bold">{t('dashboard.dashboardDataUnavailable')}</h1>
            <p className="text-sm text-[#66756D] mt-2">{error}</p>
            <button type="button" onClick={() => setReloadToken(value => value + 1)} className="btn-secondary mt-5 text-sm">{t('common.retry')}</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A] pb-16 md:pb-0">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden hidden sm:block">
        <svg className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.025 }} viewBox="0 0 1440 900">
          <defs>
            <linearGradient id="retina-accent-fundus" x1="1" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#20312A" />
            </linearGradient>
          </defs>
          <circle cx="1280" cy="120" r="80" stroke="url(#retina-accent-fundus)" strokeWidth="1.5" strokeDasharray="4 6" />
          <circle cx="1280" cy="120" r="280" stroke="url(#retina-accent-fundus)" strokeWidth="0.75" opacity="0.4" />
        </svg>
      </div>

      <Navbar />
      <OfflineBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pt-8 sm:pb-12 space-y-6 relative">

        {/* WELCOME HERO */}
        <div className="bg-gradient-to-br from-[#E6F4EA] via-white to-[#CCFBF1]/40 rounded-2xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Eye className="absolute -right-4 -bottom-8 w-48 h-48 text-[#16866A] opacity-[0.03] rotate-[-10deg] pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading" style={{ fontSize: 'clamp(26px, 2.5vw, 32px)', letterSpacing: '-0.02em' }}>
              {t('dashboard.welcomeBack')}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#285943] to-[#16866A] font-extrabold">{t('dashboard.userName')}</span>
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-[#16866A] to-transparent rounded-full mt-3" />
            <p className="text-sm font-medium text-[#475569] flex items-center gap-1.5 pt-0.5">
              <span>{t('dashboard.phcRuralUnit')}</span>
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap items-center gap-2.5 self-start sm:self-center">
            <div className="flex items-center gap-2 text-xs text-[#475569] bg-white border border-[#E2E7E3] shadow-[0_2px_8px_rgba(40,89,67,0.06)] rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-[#16866A]" />
              <span className="font-medium text-[#20312A]">{dateStr}</span>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              <span className="relative flex h-2.5 w-2.5 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#059669]" />
              </span>
              <span>{t('dashboard.shiftActive')}</span>
            </div>
          </div>
        </div>

        {/* PRIMARY ACTION */}
        <section className="bg-white rounded-2xl border border-[#E2E7E3] p-5 sm:p-6 shadow-[0_2px_12px_rgba(40,89,67,0.04)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#E6F4EA] border border-[#285943]/20 flex items-center justify-center text-[#285943] shrink-0">
                <ScanLine className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-[#20312A] font-heading">{t('dashboard.startNewScreening')}</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F4EA] text-[#047857] border border-[#047857]/20">{t('dashboard.primaryFlow')}</span>
                </div>
                <p className="text-sm text-[#475569] mt-1 max-w-2xl leading-relaxed">{t('dashboard.screeningDescription')}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link to="/screening" className="min-h-[44px] px-5 py-2.5 rounded-xl btn-gradient-pill text-[#14532D] font-bold shadow-xs hover:brightness-105 hover:shadow-md transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer focus:outline-none">
                <ScanEye className="w-4 h-4 text-[#14532D]" />
                <span>+ {t('nav.newScreening')}</span>
              </Link>
              <Link to="/register" className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white hover:bg-[#E6F4EA] border border-[#E2E7E3] text-[#20312A] text-sm font-semibold transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-xs">
                <UserPlus className="w-4 h-4 text-[#475569]" />
                <span>{t('dashboard.registerPatient')}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* STAT CARDS */}
        <section aria-label={t('dashboard.clinicalMetricsOverview')}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <StatCard title={t('dashboard.todaysScreenings')} value={loading ? <Skeleton className="h-8 w-12" /> : String(stats?.total_screenings ?? 'N/A')} subtitle={t('dashboard.completedAtPHC')} icon={Eye} accentColor="teal" />
            <StatCard title={t('dashboard.referralsToday')} value={loading ? <Skeleton className="h-8 w-12" /> : String(stats?.total_referrals ?? 'N/A')} subtitle={t('dashboard.sentToDistrictEyeHospital')} icon={Send} accentColor="amber">
              <span className="text-xs font-semibold text-[#B45309] bg-amber-50 px-2 py-0.5 rounded-full border border-[#F59E0B]/30">{t('dashboard.requiresFollowUp')}</span>
            </StatCard>
            <StatCard title={t('dashboard.pendingSync')} value={loading ? <Skeleton className="h-8 w-12" /> : String(stats?.pending_sync ?? 'N/A')} subtitle={t('dashboard.screeningsWaitingToSync')} icon={Users} accentColor="slate" />
            <StatCard title={t('dashboard.totalPatients')} value={loading ? <Skeleton className="h-8 w-12" /> : String(stats?.total_patients ?? 'N/A')} subtitle={t('dashboard.registeredAtPHC')} icon={Users} accentColor="forest" />
          </div>
        </section>

        {/* NEEDS ATTENTION */}
        <section aria-labelledby="needs-attention-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="needs-attention-heading" className="text-base sm:text-lg font-bold text-[#20312A] font-heading">{t('dashboard.needsAttention')}</h2>
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
              </div>
              <p className="text-xs sm:text-sm text-[#475569]">{t('dashboard.patientsRequiringFollowUp')}</p>
            </div>
            {!loading && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-[#EF4444] border border-[#EF4444]/25">{needsAttention.length} {t('dashboard.actionItems')}</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              [0, 1].map(i => (
                <div key={i} className="border border-[#E2E7E3] rounded-2xl p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            ) : (
              needsAttention.map(item => <NeedsAttentionCard key={item.id} item={item} />)
            )}
          </div>
        </section>

        {/* RECENT SCREENINGS TABLE */}
        <section aria-labelledby="recent-screenings-heading" className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 id="recent-screenings-heading" className="text-base sm:text-lg font-bold text-[#20312A] font-heading">{t('dashboard.recentScreenings')}</h2>
              <p className="text-xs sm:text-sm text-[#475569]">{t('dashboard.recentlyScreenedPatients')}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-medium text-[#475569] hidden sm:inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{loading ? t('common.loading') : t('dashboard.liveFromDatabase')}</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <Link to="/doctor-dashboard" className="text-xs sm:text-sm font-semibold text-[#285943] hover:text-[#16866A] flex items-center gap-1 focus:outline-none rounded px-2 py-1 transition-colors">
                <span>{t('dashboard.viewAll')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-[#E2E7E3] rounded-2xl shadow-[0_2px_12px_rgba(40,89,67,0.04)] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAF7] border-b border-[#E2E7E3] text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
                  <th className="py-4 px-6 font-semibold" scope="col">{t('dashboard.patient')}</th>
                  <th className="py-4 px-4 font-semibold" scope="col">{t('common.time')}</th>
                  <th className="py-4 px-4 font-semibold" scope="col">{t('dashboard.eye')}</th>
                  <th className="py-4 px-5 font-semibold" scope="col">{t('dashboard.aiScreeningResult')}</th>
                  <th className="py-4 px-4 font-semibold" scope="col">{t('dashboard.confidence')}</th>
                  <th className="py-4 px-5 font-semibold" scope="col">{t('common.status')}</th>
                  <th className="py-4 px-6 text-right font-semibold" scope="col">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7E3] text-sm">
                {loading ? (
                  [0, 1, 2, 3, 4].map(i => (
                    <tr key={i} className="h-16">
                      <td className="py-4 px-6"><Skeleton className="h-4 w-32 mb-1.5" /><Skeleton className="h-3 w-20" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-3 w-14" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-5 w-10" /></td>
                      <td className="py-4 px-5"><Skeleton className="h-5 w-16" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-4 px-5"><Skeleton className="h-5 w-20" /></td>
                      <td className="py-4 px-6 text-right"><Skeleton className="h-6 w-12 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  recentScreenings.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F8FAF7] transition-colors group cursor-pointer h-16">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-[#20312A] text-sm">{s.name}</div>
                        <div className="text-xs text-[#475569] font-mono">{s.id}</div>
                      </td>
                      <td className="py-4 px-4 text-xs text-[#475569] whitespace-nowrap">{s.time}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#F8FAF7] text-[#20312A] border border-[#E2E7E3]">{s.eye}</span>
                      </td>
                      <td className="py-4 px-5"><GradeBadge grade={s.grade} /></td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#20312A] font-mono min-w-[32px]">{s.confidence != null ? `${s.confidence}%` : 'N/A'}</span>
                          <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden shrink-0">
                            <div className={cn('h-full rounded-full transition-all duration-300', s.confidence > 90 ? 'bg-[#10B981]' : 'bg-[#F59E0B]')} style={{ width: s.confidence != null ? `${s.confidence}%` : '0%' }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5"><StatusBadge status={s.status} /></td>
                      <td className="py-4 px-6 text-right">
                        <Link to={`/history/${s.id}`} className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-transparent text-[#66756D] hover:text-[#285943] hover:bg-[#F3F6F1] border border-transparent hover:border-[#E2E7E3] transition-colors cursor-pointer">
                          {t('common.view')}
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {loading ? (
              [0, 1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-[#E2E7E3] p-4 shadow-[0_2px_12px_rgba(40,89,67,0.04)] space-y-3">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            ) : recentScreenings.map((s) => (
              <Link key={s.id} to={`/history/${s.id}`} className="bg-white rounded-2xl border border-[#E2E7E3] p-4 shadow-[0_2px_12px_rgba(40,89,67,0.04)] space-y-3 block text-inherit no-underline hover:border-[#16866A] transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-sm text-[#20312A]">{s.name}</span>
                    <div className="text-xs text-[#475569] font-mono">{s.id}</div>
                  </div>
                  <span className="text-xs text-[#475569]">{s.time}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#F8FAF7] text-[#20312A] border border-[#E2E7E3]">{s.eye}</span>
                  <GradeBadge grade={s.grade} />
                  <StatusBadge status={s.status} />
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-[#E2E7E3]/60">
                  <span className="text-[11px] font-medium text-[#475569]">{t('dashboard.confidence')}:</span>
                  <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden shrink-0">
                    <div className={cn('h-full rounded-full', getConfidenceBarColor(s.confidence ?? 0))} style={{ width: s.confidence != null ? `${s.confidence}%` : '0%' }} />
                  </div>
                  <span className="text-xs font-semibold text-[#20312A] font-mono">{s.confidence != null ? `${s.confidence}%` : 'N/A'}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}