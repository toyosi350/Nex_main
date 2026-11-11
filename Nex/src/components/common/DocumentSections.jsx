/* eslint-disable react-refresh/only-export-components */
import { Dropdown, DropdownItem } from './Dropdown.jsx'
import { Button } from './Button.jsx'
import { Money } from './Money.jsx'
import { nextTransitions, canTransition } from '../../constants/statuses.js'
import { formatRelativeTime } from '../../utils/format.js'
import { MdMoreVert, MdArrowForward } from 'react-icons/md'

const LABELS = {
  LINES: { ok: true },
}

/** Dropdown listing the valid next statuses for a document. */
export function TransitionMenu({ stateMap, status, onTransition, transitioning, disabled }) {
  const nexts = nextTransitions(stateMap || {}, status)
  if (!nexts || nexts.length === 0) return null
  return (
    <Dropdown
      trigger={
        <Button variant="secondary" size="sm" disabled={disabled || transitioning}>
          <MdArrowForward /> Change status
        </Button>
      }
    >
      {nexts.map((to) => (
        <DropdownItem key={to} onClick={() => onTransition(to)}>
          Set to {toLabels(to)}
        </DropdownItem>
      ))}
    </Dropdown>
  )
}

function toLabels(to) {
  return String(to).split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

export function canChange(stateMap, from, to) {
  return canTransition(stateMap, from, to)
}

/** Read-only copy of line items with totals. */
export function LinesTable({ lines, title = 'Line items' }) {
  const colProduct = 'Products & services'
  const colQty = 'Qty'
  const colPrice = 'Unit price'
  const colTotal = 'Total'
  const subtotal = (lines || []).reduce((s, l) => s + (l.quantity || 0) * (l.unitPrice ?? l.price ?? l.unitCost ?? 0), 0)
  void LABELS
  return (
    <div>
      <h4 className="mb-4">{title}</h4>
      <div className="doc-lines">
        <div className="doc-lines-head">
          <span className="doc-lines-col-product">{colProduct}</span>
          <span className="doc-lines-col-qty">{colQty}</span>
          <span className="doc-lines-col-price">{colPrice}</span>
          <span className="doc-lines-col-total">{colTotal}</span>
        </div>
        {(lines || []).map((line, i) => (
          <div key={i} className="doc-lines-row">
            <span className="doc-lines-col-product">{line.productName || line.name || line.productId}</span>
            <span className="doc-lines-col-qty">{line.quantity}</span>
            <span className="doc-lines-col-price"><Money value={line.unitPrice ?? line.price ?? line.unitCost} /></span>
            <span className="doc-lines-col-total"><Money value={(line.quantity || 0) * (line.unitPrice ?? line.price ?? line.unitCost ?? 0)} /></span>
          </div>
        ))}
      </div>
      <div className="doc-totals-preview">
        <div className="doc-total-line"><span>Subtotal</span><span className="money"><Money value={subtotal} /></span></div>
      </div>
    </div>
  )
}

/** Grey accounting breakdown used on document detail pages. */
export function TotalsPanel({ subtotal, discount, tax, total, outstanding, paid }) {
  return (
    <div className="doc-totals-preview">
      {subtotal !== undefined && <div className="doc-total-line"><span>Subtotal</span><span className="money">{fmt(subtotal)}</span></div>}
      {discount !== undefined && <div className="doc-total-line"><span>Discount</span><span className="money">− {fmt(discount)}</span></div>}
      {tax !== undefined && <div className="doc-total-line"><span>Tax</span><span className="money">{fmt(tax)}</span></div>}
      <div className="doc-total-line doc-total-grand"><span>Total</span><span className="money">{fmt(total ?? 0)}</span></div>
      {paid !== undefined && <div className="doc-total-line"><span>Paid</span><span className="money text-success">{fmt(paid)}</span></div>}
      {outstanding !== undefined && <div className="doc-total-line"><span>Outstanding</span><span className="money">{fmt(Math.max(0, outstanding))}</span></div>}
    </div>
  )
}

function fmt(v) {
  return <Money value={v} />
}

export function ActivityTimeline({ activity }) {
  if (!activity?.length) return <p className="muted">No activity yet.</p>
  return (
    <ul className="activity-list">
      {(activity || []).map((a, i) => (
        <li key={a.id || i} className="activity-item">
          <span className="activity-badge">{(a.type || '•')[0]}</span>
          <span className="activity-text">{a.title || a.action}</span>
          <span className="activity-time muted">{formatRelativeTime(a.at || a.createdAt)}</span>
        </li>
      ))}
    </ul>
  )
}

void MdMoreVert
export default TransitionMenu