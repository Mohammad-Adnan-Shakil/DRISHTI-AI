import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

export default function StatCard({ title, value, subtitle, icon: Icon, accentColor = 'forest', href, to, className, children }) {
  const accentBorderMap = {
    teal: 'border-l-[#0D9488]',
    coral: 'border-l-[#DC2626]',
    red: 'border-l-[#DC2626]',
    slate: 'border-l-[#64748B]',
    forest: 'border-l-[#285943]',
    amber: 'border-l-[#D97706]',
    orange: 'border-l-[#EA580C]',
    rose: 'border-l-[#DC2626]',
    emerald: 'border-l-[#059669]',
  }

  const accentTextColorMap = {
    teal: 'text-[#0D9488]',
    coral: 'text-[#DC2626]',
    red: 'text-[#DC2626]',
    slate: 'text-[#64748B]',
    forest: 'text-[#285943]',
    amber: 'text-[#D97706]',
    orange: 'text-[#EA580C]',
    rose: 'text-[#DC2626]',
    emerald: 'text-[#059669]',
  }

  const iconBgMap = {
    teal: 'bg-teal-50 text-[#0D9488]',
    coral: 'bg-red-50 text-[#DC2626]',
    red: 'bg-red-50 text-[#DC2626]',
    slate: 'bg-slate-100 text-[#64748B]',
    forest: 'bg-[#E6F4EA] text-[#285943]',
    amber: 'bg-amber-50 text-[#D97706]',
    orange: 'bg-orange-50 text-[#EA580C]',
    rose: 'bg-red-50 text-[#DC2626]',
    emerald: 'bg-emerald-50 text-[#059669]',
  }

  const target = to || href
  const isInternal = Boolean(target && target.startsWith('/'))
  const isLink = Boolean(target)

  const cardContent = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-medium text-[#475569]">{title}</span>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-2xs', iconBgMap[accentColor] || iconBgMap.forest)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'text-3xl sm:text-4xl font-extrabold tracking-tight font-heading',
              accentTextColorMap[accentColor] || 'text-[#285943]'
            )}
            style={{ lineHeight: 1, letterSpacing: '-0.02em' }}
          >
            {value}
          </span>
          {children}
        </div>
        {subtitle && (
          <p className="text-[11px] text-[#475569] mt-1 font-normal">{subtitle}</p>
        )}
      </div>
    </>
  )

  const sharedClasses = cn(
    'stat-card bg-white rounded-2xl border border-[#E2E7E3] border-l-4 p-4 sm:p-5 shadow-[0_2px_12px_rgba(40,89,67,0.04)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden text-inherit no-underline',
    accentBorderMap[accentColor] || accentBorderMap.forest,
    isLink && 'hover:border-r-[#16866A] hover:border-b-[#16866A] group cursor-pointer block',
    !isLink && 'hover:border-[#285943]/30',
    className
  )

  if (isInternal) {
    return (
      <Link to={target} className={sharedClasses}>
        {cardContent}
      </Link>
    )
  }

  if (target) {
    return (
      <a href={target} className={sharedClasses}>
        {cardContent}
      </a>
    )
  }

  return (
    <div className={sharedClasses}>
      {cardContent}
    </div>
  )
}

