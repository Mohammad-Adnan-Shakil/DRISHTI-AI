import { WifiOff } from 'lucide-react'

export default function OfflineBanner({ visible = false, message, syncCount }) {
  if (!visible) return null
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-900" role="alert" aria-live="assertive">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs sm:text-sm">
            <span className="font-semibold text-amber-950">You're offline.</span>
            <span className="text-amber-800 ml-1">
              {message || 'Screening can continue. Saved data will sync when connection returns.'}
            </span>
          </div>
        </div>
        {syncCount != null && (
          <span className="text-[11px] font-medium text-amber-700 whitespace-nowrap hidden md:inline">
            {syncCount} records saved locally
          </span>
        )}
      </div>
    </div>
  )
}
