/**
 * Centralized entity statuses and allowed state transitions.
 * These rules are shared between the UI and the mock API so invalid
 * transitions can never be triggered accidentally.
 */

export const VENDOR_STATUS = ['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE']
export const USER_STATUS = ['ACTIVE', 'INACTIVE', 'INVITED']

export const CUSTOMER_STATUS = ['ACTIVE', 'INACTIVE', 'BLOCKED']
export const SUPPLIER_STATUS = ['ACTIVE', 'INACTIVE']
export const PRODUCT_STATUS = ['ACTIVE', 'INACTIVE', 'DISCONTINUED']

export const QUOTE_STATUS = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']
export const ORDER_STATUS = [
  'DRAFT',
  'PENDING',
  'CONFIRMED',
  'RESERVED',
  'FULFILLED',
  'CANCELLED',
]
export const INVOICE_STATUS = [
  'DRAFT',
  'SENT',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
]
export const PAYMENT_STATUS = ['PENDING', 'PAID', 'FAILED', 'CANCELLED']

export const PURCHASE_REQUEST_STATUS = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'CONVERTED',
  'REJECTED',
]
export const PURCHASE_ORDER_STATUS = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'SENT',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
]
export const GOODS_RECEIPT_STATUS = ['DRAFT', 'RECEIVED', 'POSTED']

export const STOCK_TRANSFER_STATUS = ['REQUESTED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'REJECTED']
export const ADJUSTMENT_TYPES = ['ADD', 'REMOVE', 'DAMAGED', 'EXPIRED', 'LOST', 'CORRECTION']

export const EXPENSE_STATUS = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PROCESSED', 'PAID']
export const EXPENSE_PAYMENT_STATUS = ['UNPAID', 'PARTIAL', 'PAID']

export const EMPLOYEE_STATUS = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED']
export const ATTENDANCE_STATUS = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE']
export const LEAVE_TYPE = ['ANNUAL', 'SICK', 'MATERNITY', 'EMERGENCY']
export const LEAVE_STATUS = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']

export const PROJECT_STATUS = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']
export const TASK_STATUS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
export const MILESTONE_STATUS = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

export const LEAD_STAGE = [
  'LEADS',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
]

export const TICKET_STATUS = ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED']
export const TICKET_PRIORITY = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
export const TICKET_SOURCE = ['EMAIL', 'PHONE', 'WEB', 'CHAT', 'CRM']

/* ---------------- State transition maps ---------------- */

export const INVOICE_TRANSITIONS = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
  PARTIALLY_PAID: ['PAID', 'OVERDUE'],
  PAID: [],
  OVERDUE: ['PARTIALLY_PAID', 'PAID'],
  CANCELLED: [],
}

export const PURCHASE_ORDER_TRANSITIONS = {
  DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED_APPROVAL', 'CANCELLED'],
  APPROVED: ['SENT', 'CANCELLED'],
  SENT: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  PARTIALLY_RECEIVED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: [],
  CANCELLED: [],
}

export const STOCK_TRANSFER_TRANSITIONS = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['RECEIVED'],
  RECEIVED: [],
  REJECTED: [],
}

export const LEAVE_TRANSITIONS = {
  PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: [],
  REJECTED: [],
  CANCELLED: [],
}

export const TICKET_TRANSITIONS = {
  OPEN: ['IN_PROGRESS', 'WAITING', 'CLOSED'],
  IN_PROGRESS: ['WAITING', 'RESOLVED', 'CLOSED'],
  WAITING: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
}

export const EXPENSE_TRANSITIONS = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['PROCESSED', 'PAID'],
  REJECTED: [],
  PROCESSED: ['PAID'],
  PAID: [],
}

export const QUOTE_TRANSITIONS = {
  DRAFT: ['SENT', 'REJECTED'],
  SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
}

export const ORDER_TRANSITIONS = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['RESERVED', 'FULFILLED', 'CANCELLED'],
  RESERVED: ['FULFILLED', 'CANCELLED'],
  FULFILLED: [],
  CANCELLED: [],
}

/** Returns allowed next states for a workflow, or [] when unknown. */
export function nextTransitions(stateMap, current) {
  return stateMap[current] || []
}

/** Notifies the caller with a reason if a transition is not allowed. */
export function canTransition(stateMap, current, next) {
  const allowed = nextTransitions(stateMap, current)
  return allowed.includes(next)
}

export const STATUS_LABELS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
  SUSPENDED: 'Suspended',
  BLOCKED: 'Blocked',
  INVITED: 'Invited',
  DISCONTINUED: 'Discontinued',
  DRAFT: 'Draft',
  SENT: 'Sent',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  CONFIRMED: 'Confirmed',
  RESERVED: 'Reserved',
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  FAILED: 'Failed',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  PARTIALLY_RECEIVED: 'Partially Received',
  RECEIVED: 'Received',
  CONVERTED: 'Converted',
  REQUESTED: 'Requested',
  IN_TRANSIT: 'In Transit',
  SUBMITTED: 'Submitted',
  PROCESSED: 'Processed',
  UNPAID: 'Unpaid',
  PARTIAL: 'Partial',
  ON_LEAVE: 'On Leave',
  TERMINATED: 'Terminated',
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  LEAVE: 'Leave',
  ANNUAL: 'Annual',
  SICK: 'Sick',
  MATERNITY: 'Maternity',
  EMERGENCY: 'Emergency',
  PLANNING: 'Planning',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  IN_REVIEW: 'In Review',
  TODO: 'To Do',
  DONE: 'Done',
  LEADS: 'Leads',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
  OPEN: 'Open',
  WAITING: 'Waiting',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
  EMAIL: 'Email',
  PHONE: 'Phone',
  WEB: 'Web',
  CHAT: 'Chat',
  CRM: 'CRM',
  ADD: 'Stock Added',
  REMOVE: 'Stock Removed',
  DAMAGED: 'Damaged',
  CORRECTION: 'Correction',
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || '—'
}