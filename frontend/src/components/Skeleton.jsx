import { cn } from '../lib/utils'

export default function Skeleton({ className }) {
  return <div className={cn('animate-pulse bg-slate-200/80 rounded', className)} />
}
