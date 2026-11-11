import { cn } from '../../../utils/misc.js'

export function ErrorState({ title = 'Something went wrong', message, onRetry, error, className }) {
  const detail = error?.data?.message || error?.message || message
  return (
    <div className={cn('state state-center', className)}>
      <div className="state-emoji" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 10h.01M15 10h.01M9 15c.8.8 1.9 1.2 3 1.2s2.2-.4 3-1.2" />
        </svg>
      </div>
      <h3 className="state-title">{title}</h3>
      {detail && <p className="state-label">{detail}</p>}
      {onRetry && (
        <button className="btn btn-outline btn-sm mt-4" onClick={onRetry} type="button">
          Try again
        </button>
      )}
    </div>
  )
}