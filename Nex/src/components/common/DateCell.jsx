import { formatDate, formatRelativeTime } from '../../utils/format.js'

export function DateCell({ value }) {
  if (!value) return <span className="muted">—</span>
  return <span>{formatDate(value)}</span>
}

export function DateTimeCell({ value }) {
  if (!value) return <span className="muted">—</span>
  return (
    <span>
      {formatDate(value)}
      <span className="muted"> · {formatRelativeTime(value)}</span>
    </span>
  )
}

export default DateCell