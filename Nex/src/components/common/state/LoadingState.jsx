import { cn } from '../../../utils/misc.js'
import { Spinner } from '../../common/Spinner.jsx'

export function LoadingState({ label = 'Loading…', className }) {
  return (
    <div className={cn('state state-center', className)}>
      <Spinner size="lg" />
      {label && <p className="state-label">{label}</p>}
    </div>
  )
}

export function LoadingBlock({ rows = 4, className }) {
  return (
    <div className={cn('skeleton-block', className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row" style={{ width: `${92 - (i % 3) * 14}%` }} />
      ))}
    </div>
  )
}