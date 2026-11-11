import { cn } from '../../utils/misc.js'

export function ProgressBar({ value = 0, tone = 'brand', className, showLabel = false, max = 100 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={cn('progress', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin="0" aria-valuemax={max} aria-label={showLabel ? `${Math.round(pct)}%` : undefined}>
      <div className={cn('progress-fill', `progress-${tone}`)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function ProgressCell({ value = 0, max = 100, tone, className }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div className={cn('progress-cell', className)}>
      <ProgressBar value={value} max={max} tone={tone} />
      <span className="progress-cell-label">{pct}%</span>
    </div>
  )
}

export default ProgressBar