import { cn } from '../lib/utils'

const gradeConfig = {
  0: {
    label: '✓ Grade 0 · No DR',
    bg: '#064E3B',
    color: '#A7F3D0',
    border: '#059669',
    borderWidth: '1px',
  },
  1: {
    label: 'Grade 1 · Mild NPDR',
    bg: '#78350F',
    color: '#FDE68A',
    border: '#D97706',
    borderWidth: '1px',
  },
  2: {
    label: 'Grade 2 · Moderate NPDR',
    bg: '#7C2D12',
    color: '#FFEDD5',
    border: '#EA580C',
    borderWidth: '1px',
  },
  3: {
    label: 'Grade 3 · Severe NPDR',
    bg: '#991B1B',
    color: '#FCA5A5',
    border: '#DC2626',
    borderWidth: '1px',
  },
  4: {
    label: 'Grade 4 · Proliferative DR',
    bg: '#450A0A',
    color: '#FECDD3',
    border: '#EF4444',
    borderWidth: '2px',
  },
}

export default function GradeBadge({ grade, confidence, className }) {
  // Normalize grade strictly to numeric 0, 1, 2, 3, 4
  const numericGrade = typeof grade === 'string' ? parseInt(grade.replace(/\D/g, ''), 10) : Number(grade)
  const safeGrade = Number.isFinite(numericGrade) && gradeConfig[numericGrade] ? numericGrade : 0
  const config = gradeConfig[safeGrade]

  return (
    <span
      style={{
        backgroundColor: config.bg,
        color: config.color,
        borderColor: config.border,
        borderWidth: config.borderWidth,
        borderStyle: 'solid',
      }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-2xs whitespace-nowrap tracking-tight',
        config.borderWidth === '2px' ? 'border-2' : 'border',
        className
      )}
    >
      {safeGrade !== 0 && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: config.color }}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
      {confidence != null && (
        <span className="font-mono text-[11px] font-normal ml-0.5 opacity-80">
          {typeof confidence === 'number' ? `${confidence}%` : confidence.toString().includes('%') ? confidence : `${confidence}%`}
        </span>
      )}
    </span>
  )
}
