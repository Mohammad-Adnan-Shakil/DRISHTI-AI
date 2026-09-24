import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, ChevronDown, Building2, Eye } from 'lucide-react'
import { clearSession } from '../lib/auth'
import { useTranslation } from 'react-i18next'

/**
 * AdminNavbar – System Administrator variant
 * Global Medical Chrome matching Forest & Teal design tokens:
 * - Slim top navbar with DRISHTI logo + "CLINICAL AI" pill + tagline
 * - Online/Offline pill (navigator.onLine aware)
 * - Language selector including मराठी (MR)
 * - Role identity block (Admin User • System Administrator)
 * - Logout icon -> /login
 */
export default function AdminNavbar({
  adminName = 'Admin User',
  adminRole = 'System Administrator',
  adminInitials = 'AU',
  facility = 'District Health Office • Analytics Hub',
}) {
  const { t, i18n } = useTranslation()
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
      {/* Top 3px vibrant gradient accent bar */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#D9F99D] via-[#DCFCE7] to-[#CCFBF1]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Logo, Wordmark & Tagline */}
          <div className="flex items-center gap-3">
            <Link to="/analytics" className="flex items-center focus:outline-none focus:ring-2 focus:ring-[#16866A] rounded-md p-1">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#16866A] to-[#285943] text-white shadow-sm">
                <Eye size={18} strokeWidth={2.5} />
              </div>
              <span className="ml-2 text-xl font-extrabold tracking-tight text-[#20312A]">DRISHTI</span>
              <span className="bg-[#E6F4EA] text-[#047857] text-[10px] font-bold px-2 py-0.5 rounded-md ml-2">CLINICAL AI</span>
            </Link>
          </div>

          {/* Center: Facility context badge */}
          <div className="hidden md:flex items-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8FAF7] text-[#20312A] border border-[#E2E7E3] text-xs font-medium">
              <Building2 className="w-3.5 h-3.5 text-[#66756D]" strokeWidth={2} />
              <span>{facility}</span>
            </div>
          </div>

          {/* Right: Connectivity, Language, Admin Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dynamic Online/Offline Indicator */}
            <div
              aria-live="polite"
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isOnline ? 'bg-[#E6F4EA] text-[#047857] border-[#047857]/30' : 'bg-[#FEE2E2] text-[#B91C1C] border-[#B91C1C]/30'
              }`}
            >
              {isOnline ? (
                <span className="relative flex h-2.5 w-2.5 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#059669]" />
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#B91C1C] mr-1.5" />
              )}
              <span>{isOnline ? t('common.online') : t('common.offline')}</span>
            </div>

            {/* Language Selector */}
            <div className="relative hidden sm:block">
              <select
                aria-label={t('nav.selectInterfaceLanguage')}
                className="text-xs bg-[#F8FAF7] border border-[#E2E7E3] text-[#20312A] py-1.5 pl-2.5 pr-7 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-[#16866A] appearance-none cursor-pointer"
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="mr">मराठी (MR)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#66756D] absolute right-2 top-2.5 pointer-events-none" strokeWidth={2} />
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-[#E2E7E3] to-transparent hidden sm:block" />

            {/* Admin Profile */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#285943] to-[#16866A] text-white border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs" title={`${adminName} (${adminRole})`}>
                {adminInitials}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#20312A] leading-none">{adminName}</span>
                <span className="text-[11px] text-[#66756D] leading-tight">{adminRole}</span>
              </div>
            </div>

            {/* Logout Button */}
            <Link
              to="/login"
              onClick={clearSession}
              aria-label={t('nav.signOut')}
              title={t('nav.signOut')}
              className="p-1.5 text-[#66756D] hover:text-[#20312A] hover:bg-[#F8FAF7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#16866A] transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
