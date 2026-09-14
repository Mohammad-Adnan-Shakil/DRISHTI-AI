import { cn } from '../lib/utils'

const statusConfig = {
  'screening-complete': { label: 'Screening Complete', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  'referral-created': { label: 'Referral Created', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'pending-review': { label: 'Pending Review', dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  'referred': { label: 'Referred', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'completed': { label: 'Completed', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  'pending': { label: 'Pending', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'sent': { label: 'Sent', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'declined': { label: 'Declined', dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  'attended': { label: 'Attended', dot: 'bg-teal-500', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
}

export default function StatusBadge({ status, label, className }) {
  const config = statusConfig[status] || statusConfig['pending']
  const displayLabel = label || config.label
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
      config.bg, config.text, config.border, 'border',
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {displayLabel}
    </span>
  )
}
