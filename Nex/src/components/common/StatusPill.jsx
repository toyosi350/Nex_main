/* eslint-disable react-refresh/only-export-components */
import { Badge } from './Badge.jsx'

const STATUS_TONES = {
  draft: 'neutral',
  pending: 'warning',
  pending_approval: 'warning',
  approved: 'info',
  processing: 'info',
  shipped: 'info',
  in_transit: 'info',
  in_progress: 'info',
  open: 'info',
  active: 'success',
  paid: 'success',
  completed: 'success',
  delivered: 'success',
  closed: 'neutral',
  resolved: 'success',
  approved_partial: 'info',
  partially_paid: 'warning',
  partially_received: 'warning',
  awaiting_delivery: 'warning',
  awaiting_receipt: 'warning',
  received: 'success',
  overdue: 'danger',
  expired: 'danger',
  rejected: 'danger',
  cancelled: 'danger',
  canceled: 'danger',
  on_hold: 'warning',
  blocked: 'danger',
  low: 'warning',
  out_of_stock: 'danger',
  negative: 'danger',
  terminated: 'danger',
  withdrawn: 'neutral',
  declined: 'danger',
  pending_payment: 'warning',
  awaiting_approval: 'warning',
  needs_approval: 'warning',
  ready: 'success',
  paused: 'warning',
  archived: 'neutral',
  disconnected: 'neutral',
  spark: 'success',
  verified: 'success',
  suspended: 'danger',
  review: 'warning',
}

export function labelFor(status) {
  if (!status) return ''
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function StatusPill({ status, tone: forcedTone, children }) {
  const tone = forcedTone || STATUS_TONES[String(status || '').toLowerCase()] || 'neutral'
  return <Badge tone={tone}>{children || labelFor(status)}</Badge>
}

export default StatusPill