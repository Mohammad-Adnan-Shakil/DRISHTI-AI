import { Link } from 'react-router-dom'
import { Eye, ScanEye, UserPlus, Send, CloudSync, Users, AlertTriangle, Clock, ChevronRight, Calendar, ScanLine } from 'lucide-react'
import Navbar from '../components/Navbar'
import OfflineBanner from '../components/OfflineBanner'
import GradeBadge from '../components/GradeBadge'
import StatusBadge from '../components/StatusBadge'
import StatCard from '../components/StatCard'
import { cn } from '../lib/utils'

const recentScreenings = [
  { id: 'DRI-2026-00421', name: 'Anitha R.', time: '10:32 AM', eye: 'OD', grade: 2, confidence: 94, status: 'referral-created' },
  { id: 'DRI-2026-00418', name: 'Ramesh B.', time: '9:48 AM', eye: 'OS', grade: 0, confidence: 97, status: 'screening-complete' },
  { id: 'DRI-2026-00415', name: 'Savithri M.', time: '9:15 AM', eye: 'OD', grade: 1, confidence: 91, status: 'screening-complete' },
  { id: 'DRI-2026-00411', name: 'Mahesh K.', time: '8:42 AM', eye: 'OS', grade: 3, confidence: 93, status: 'referral-created' },
  { id: 'DRI-2026-00407', name: 'Lakshmi P.', time: '8:10 AM', eye: 'OD', grade: 0, confidence: 96, status: 'screening-complete' },
]

function getConfidenceBarColor(confidence) {
  if (confidence >= 90) return 'bg-[#059669]' // Emerald/Green (>90%)
  if (confidence >= 70) return 'bg-[#F59E0B]' // Amber (70-90%)
  return 'bg-[#EF4444]' // Coral/Red (<70%)
}

export default function Dashboard() {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#20312A] pb-16 md:pb-0">
      {/* Background retinal watermark (hidden on mobile) - 2.5% opacity */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden hidden sm:block">
        <svg className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.025 }} viewBox="0 0 1440 900">
          <defs>
            <linearGradient id="retina-accent-fundus" x1="1" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#20312A" />
            </linearGradient>
          </defs>
          {/* Optic Disc and Retinal Arcs (Top Right Corner) */}
          <circle cx="1280" cy="120" r="80" stroke="url(#retina-accent-fundus)" strokeWidth="1.5" strokeDasharray="4 6" />
          <circle cx="1280" cy="120" r="160" stroke="url(#retina-accent-fundus)" strokeWidth="1" opacity="0.6" />
          <circle cx="1280" cy="120" r="280" stroke="url(#retina-accent-fundus)" strokeWidth="0.75" opacity="0.4" />
          <circle cx="1280" cy="120" r="420" stroke="url(#retina-accent-fundus)" strokeWidth="0.75" strokeDasharray="8 12" opacity="0.3" />
          {/* Superior & Inferior Temporal Arcade Vessels */}
          <g stroke="url(#retina-accent-fundus)" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Main Superior Arcade */}
            <path d="M1280,120 C1200,60 1080,40 950,70 C820,100 710,180 620,280 C540,370 480,480 440,600" strokeWidth="2" />
            <path d="M950,70 C920,40 860,20 800,25" strokeWidth="1.2" />
            <path d="M820,100 C780,70 720,60 670,80" strokeWidth="1.2" />
            <path d="M710,180 C650,150 590,150 540,180" strokeWidth="1" />
            <path d="M620,280 C560,260 500,280 460,330" strokeWidth="1" />
            {/* Main Inferior Arcade */}
            <path d="M1280,120 C1220,190 1140,260 1020,310 C900,360 760,380 640,430 C520,480 420,570 350,680" strokeWidth="2" />
            <path d="M1020,310 C980,360 920,400 860,420" strokeWidth="1.2" />
            <path d="M760,380 C700,430 630,460 570,470" strokeWidth="1" />
            {/* Nasal Vessels */}
            <path d="M1280,120 C1330,100 1390,95 1450,110" strokeWidth="1.5" />
            <path d="M1280,120 C1340,150 1400,170 1460,180" strokeWidth="1.5" />
            {/* Foveal avascular zone hint */}
            <circle cx="980" cy="210" r="30" stroke="url(#retina-accent-fundus)" strokeWidth="0.75" strokeDasharray="2 4" opacity="0.5" />
          </g>
          {/* Top Left Secondary Vessel Echo */}
          <g stroke="url(#retina-accent-fundus)" strokeLinecap="round" opacity="0.4" fill="none">
            <path d="M-40,80 C60,110 140,180 200,270 C250,350 280,450 290,560" strokeWidth="1.5" />
            <path d="M140,180 C200,170 260,190 310,240" strokeWidth="1" />
          </g>
        </svg>
      </div>

      <Navbar />
      <OfflineBanner />

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pt-8 sm:pb-12 space-y-6 relative">
        {/* WELCOME HERO CARD */}
        <div className="bg-gradient-to-br from-[#E6F4EA] via-white to-[#CCFBF1]/40 rounded-2xl border border-[#E2E7E3] shadow-[0_2px_12px_rgba(40,89,67,0.04)] p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Eye className="absolute -right-4 -bottom-8 w-48 h-48 text-[#16866A] opacity-[0.03] rotate-[-10deg] pointer-events-none" aria-hidden="true" />
          <div aria-hidden="true" className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 rounded-full blur-2xl opacity-30" style={{ background: 'radial-gradient(circle, #285943 0%, rgba(40, 89, 67, 0) 70%)' }} />
          <div className="relative z-10 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading" style={{ fontSize: 'clamp(26px, 2.5vw, 32px)', letterSpacing: '-0.02em' }}>
              <span className="text-[#20312A]">Welcome back, </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#285943] to-[#16866A] font-extrabold">Kavya N.</span>
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-[#16866A] to-transparent rounded-full mt-3" />
            <p className="text-sm font-medium text-[#475569] flex items-center gap-1.5 pt-0.5">
              <svg className="w-4 h-4 text-[#475569]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 12h4" /><path d="M10 8h4" /><path d="M14 21v-3a2 2 0 0 0-4 0v3" /><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" /><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /></svg>
              <span>PHC Hosakote • Rural Screening Unit</span>
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap items-center gap-2.5 self-start sm:self-center">
            <div className="flex items-center gap-2 text-xs text-[#475569] bg-white border border-[#E2E7E3] shadow-[0_2px_8px_rgba(40,89,67,0.06)] rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-[#16866A]" />
              <span className="font-medium text-[#20312A]">{dateStr}</span>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 shadow-clinical-sm">
              <span className="relative flex h-2.5 w-2.5 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#059669]" />
              </span>
              <span>Shift Active</span>
            </div>
          </div>
        </div>

        {/* PRIMARY ACTION — START SCREENING */}
        <section aria-labelledby="screening-action-heading" className="bg-white rounded-2xl border border-[#E2E7E3] p-5 sm:p-6 shadow-[0_2px_12px_rgba(40,89,67,0.04)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#E6F4EA] border border-[#285943]/20 flex items-center justify-center text-[#285943] shrink-0">
                <ScanLine className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="screening-action-heading" className="text-lg sm:text-xl font-bold text-[#20312A] font-heading">Start a New Screening</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F4EA] text-[#047857] border border-[#047857]/20">Primary Flow</span>
                </div>
                <p className="text-sm text-[#475569] mt-1 max-w-2xl leading-relaxed">Select or register a patient and begin retinal screening. DRISHTI will guide you through image capture, quality check and screening results.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link to="/screening" className="min-h-[44px] px-5 py-2.5 rounded-xl btn-gradient-pill text-[#14532D] font-bold shadow-xs hover:brightness-105 hover:shadow-md transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A]">
                <ScanEye className="w-4 h-4 text-[#14532D]" />
                <span>+ New Screening</span>
              </Link>
              <Link to="/register" className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white hover:bg-[#E6F4EA] border border-[#E2E7E3] active:scale-[0.98] text-[#20312A] text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16866A] cursor-pointer inline-flex items-center justify-center gap-2 shadow-xs">
                <UserPlus className="w-4 h-4 text-[#475569]" />
                <span>Register Patient</span>
              </Link>
            </div>
          </div>
        </section>

        {/* STAT CARDS - CLINICAL SEMANTICS & WEIGHT */}
        <section aria-label="Clinical Metrics Overview">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <StatCard title="Today's Screenings" value="12" subtitle="Completed at PHC Hosakote" icon={Eye} accentColor="teal" />
            <StatCard title="Referrals Today" value="3" subtitle="Sent to District Eye Hospital" icon={Send} accentColor="amber" href="/referrals">
              <span className="text-xs font-semibold text-[#B45309] bg-amber-50 px-2 py-0.5 rounded-full border border-[#F59E0B]/30">Requires follow-up</span>
            </StatCard>
            <StatCard title="Pending Sync" value="5" subtitle="Screenings waiting to sync" icon={CloudSync} accentColor="slate" />
            <StatCard title="Total Patients" value="248" subtitle="Registered at PHC Hosakote" icon={Users} accentColor="forest" />
          </div>
        </section>

        {/* NEEDS ATTENTION */}
        <section aria-labelledby="needs-attention-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="needs-attention-heading" className="text-base sm:text-lg font-bold text-[#20312A] font-heading">Needs Attention</h2>
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
              </div>
              <p className="text-xs sm:text-sm text-[#475569]">Patients requiring follow-up</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-[#EF4444] border border-[#EF4444]/25">2 action items</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Urgent Card: Mahesh K. (Coral/Red semantic styling) */}
            <div className="bg-red-50/50 border border-[#E2E7E3] border-l-4 border-l-[#EF4444] rounded-2xl p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] flex flex-col justify-between hover:border-[#EF4444]/40 transition-colors gap-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base text-[#20312A]">Mahesh K.</span>
                      <span className="text-xs font-medium text-[#475569] font-mono">DRI-2026-00411</span>
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-[#475569] border border-slate-200">OS (Left Eye)</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#EF4444] text-white uppercase tracking-wider">PRIORITY</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#475569] whitespace-nowrap">8:42 AM</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <GradeBadge grade={3} confidence={93} />
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#DC2626] bg-red-100/80 px-2.5 py-0.5 rounded-full border border-[#EF4444]/30">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                    Urgent Referral
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
                  <Clock className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>Action needed today: Contact patient &amp; organize transit</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-[#EF4444]/20 gap-2 mt-auto">
                <span className="text-xs text-[#475569] hidden sm:inline">Escalation target: District Eye Hospital</span>
                <Link to="/doctor-review/DRI-2026-00411" className="min-h-[36px] inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-[#EF4444] bg-white hover:bg-red-50 active:scale-[0.98] rounded-xl border border-[#EF4444]/35 focus:outline-none focus:ring-2 focus:ring-[#EF4444] transition-colors cursor-pointer shadow-2xs">
                  View Patient →
                </Link>
              </div>
            </div>

            {/* Attention/Pending Card: Anitha R. (Amber/Orange semantic styling) */}
            <div className="bg-amber-50/50 border border-[#E2E7E3] border-l-4 border-l-[#F59E0B] rounded-2xl p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] flex flex-col justify-between hover:border-[#F59E0B]/40 transition-colors gap-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base text-[#20312A]">Anitha R.</span>
                      <span className="text-xs font-medium text-[#475569] font-mono">DRI-2026-00421</span>
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-[#475569] border border-slate-200">OD (Right Eye)</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#475569] whitespace-nowrap">10:32 AM</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <GradeBadge grade={2} confidence={94} />
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B45309] bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-[#F59E0B]/30">
                    <Send className="w-3.5 h-3.5 text-[#D97706]" />
                    Referral Pending Doctor Review
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#B45309]">
                  <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Awaiting tele-ophthalmology verification (within 14 days)</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-[#F59E0B]/20 gap-2 mt-auto">
                <span className="text-xs text-[#475569] hidden sm:inline">Taluk Hospital / Tele-Ophthalmology</span>
                <Link to="/doctor-review/DRI-2026-00421" className="min-h-[36px] inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-[#D97706] bg-white hover:bg-amber-50 active:scale-[0.98] rounded-xl border border-[#F59E0B]/35 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] transition-colors cursor-pointer shadow-2xs">
                  View Patient →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* RECENT SCREENINGS TABLE */}
        <section aria-labelledby="recent-screenings-heading" className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 id="recent-screenings-heading" className="text-base sm:text-lg font-bold text-[#20312A] font-heading">Recent Screenings</h2>
              <p className="text-xs sm:text-sm text-[#475569]">Recently screened patients at PHC Hosakote</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-medium text-[#475569] hidden sm:inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Last updated 5 mins ago</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <Link to="/doctor-dashboard" className="text-xs sm:text-sm font-semibold text-[#285943] hover:text-[#16866A] flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#16866A] rounded px-2 py-1 transition-colors">
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-[#E2E7E3] rounded-2xl shadow-[0_2px_12px_rgba(40,89,67,0.04)] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAF7] border-b border-[#E2E7E3] text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
                  <th className="py-4 px-6 font-semibold" scope="col">PATIENT</th>
                  <th className="py-4 px-4 font-semibold" scope="col">TIME</th>
                  <th className="py-4 px-4 font-semibold" scope="col">EYE</th>
                  <th className="py-4 px-5 font-semibold" scope="col">AI SCREENING RESULT</th>
                  <th className="py-4 px-4 font-semibold" scope="col">CONFIDENCE</th>
                  <th className="py-4 px-5 font-semibold" scope="col">STATUS</th>
                  <th className="py-4 px-6 text-right font-semibold" scope="col">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7E3] text-sm">
                {recentScreenings.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F8FAF7] transition-colors group cursor-pointer h-16">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-[#20312A] text-sm">{s.name}</div>
                      <div className="text-xs text-[#475569] font-mono">{s.id}</div>
                    </td>
                    <td className="py-4 px-4 text-xs text-[#475569] whitespace-nowrap">{s.time}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#F8FAF7] text-[#20312A] border border-[#E2E7E3]">{s.eye}</span>
                    </td>
                    <td className="py-4 px-5">
                      <GradeBadge grade={s.grade} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#20312A] font-mono min-w-[32px]">{s.confidence}%</span>
                        <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden shrink-0">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              s.confidence > 90 ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                            )}
                            style={{ width: `${s.confidence}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link to={`/doctor-review/${s.id}`} className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-transparent text-[#66756D] hover:text-[#285943] hover:bg-[#F3F6F1] border border-transparent hover:border-[#E2E7E3] transition-colors cursor-pointer">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {recentScreenings.map((s) => (
              <Link key={s.id} to={`/doctor-review/${s.id}`} className="bg-white rounded-2xl border border-[#E2E7E3] p-4 shadow-[0_2px_12px_rgba(40,89,67,0.04)] space-y-3 block text-inherit no-underline hover:border-[#16866A] transition-colors">
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
                  <span className="text-[11px] font-medium text-[#475569]">Confidence:</span>
                  <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden shrink-0">
                    <div
                      className={cn('h-full rounded-full', getConfidenceBarColor(s.confidence))}
                      style={{ width: `${s.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#20312A] font-mono">{s.confidence}%</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

