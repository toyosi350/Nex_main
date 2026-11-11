/*
|--------------------------------------------------------------------
| Port of the frontend's src/constants/statuses.js — the entity status
| vocabularies and state-transition maps shared by the React UI and
| this API.
|
| The UI enforces the same rules client-side; the API enforces them
| here so an out-of-date tab cannot produce an illegal state.
|--------------------------------------------------------------------
*/

export const VENDOR_STATUS = ["ACTIVE", "PENDING", "SUSPENDED", "INACTIVE"];
export const USER_STATUS = ["ACTIVE", "INACTIVE", "INVITED"];

export const CUSTOMER_STATUS = ["ACTIVE", "INACTIVE", "BLOCKED"];
export const SUPPLIER_STATUS = ["ACTIVE", "INACTIVE"];
export const PRODUCT_STATUS = ["ACTIVE", "INACTIVE", "DISCONTINUED"];

export const QUOTE_STATUS = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];
export const ORDER_STATUS = [
    "DRAFT",
    "PENDING",
    "CONFIRMED",
    "RESERVED",
    "FULFILLED",
    "CANCELLED",
];
export const INVOICE_STATUS = [
    "DRAFT",
    "SENT",
    "PARTIALLY_PAID",
    "PAID",
    "OVERDUE",
    "CANCELLED",
];
export const PAYMENT_STATUS = ["PENDING", "PAID", "FAILED", "CANCELLED"];

export const PURCHASE_REQUEST_STATUS = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "CONVERTED",
    "REJECTED",
];
export const PURCHASE_ORDER_STATUS = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "SENT",
    "PARTIALLY_RECEIVED",
    "RECEIVED",
    "CANCELLED",
];
export const GOODS_RECEIPT_STATUS = ["DRAFT", "RECEIVED", "POSTED"];

export const STOCK_TRANSFER_STATUS = [
    "REQUESTED",
    "APPROVED",
    "IN_TRANSIT",
    "RECEIVED",
    "REJECTED",
];
export const ADJUSTMENT_TYPES = [
    "ADD",
    "REMOVE",
    "DAMAGED",
    "EXPIRED",
    "LOST",
    "CORRECTION",
];

export const EXPENSE_STATUS = [
    "DRAFT",
    "SUBMITTED",
    "APPROVED",
    "REJECTED",
    "PROCESSED",
    "PAID",
];
export const EXPENSE_PAYMENT_STATUS = ["UNPAID", "PARTIAL", "PAID"];

export const EMPLOYEE_STATUS = ["ACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED"];
export const ATTENDANCE_STATUS = ["PRESENT", "ABSENT", "LATE", "LEAVE"];
export const LEAVE_TYPE = ["ANNUAL", "SICK", "MATERNITY", "EMERGENCY"];
export const LEAVE_STATUS = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export const PROJECT_STATUS = [
    "PLANNING",
    "IN_PROGRESS",
    "ON_HOLD",
    "COMPLETED",
    "CANCELLED",
];
export const TASK_STATUS = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
export const MILESTONE_STATUS = ["PENDING", "IN_PROGRESS", "COMPLETED"];

export const LEAD_STAGE = [
    "LEADS",
    "CONTACTED",
    "QUALIFIED",
    "PROPOSAL",
    "NEGOTIATION",
    "WON",
    "LOST",
];

export const TICKET_STATUS = ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"];
export const TICKET_PRIORITY = ["LOW", "MEDIUM", "HIGH", "URGENT"];
export const TICKET_SOURCE = ["EMAIL", "PHONE", "WEB", "CHAT", "CRM"];

export const INVOICE_TRANSITIONS = {
    DRAFT: ["SENT", "CANCELLED"],
    SENT: ["PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"],
    PARTIALLY_PAID: ["PAID", "OVERDUE"],
    PAID: [],
    OVERDUE: ["PARTIALLY_PAID", "PAID"],
    CANCELLED: [],
};

export const PURCHASE_ORDER_TRANSITIONS = {
    DRAFT: ["PENDING_APPROVAL", "CANCELLED"],
    PENDING_APPROVAL: ["APPROVED", "REJECTED_APPROVAL", "CANCELLED"],
    APPROVED: ["SENT", "CANCELLED"],
    SENT: ["PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
    PARTIALLY_RECEIVED: ["RECEIVED", "CANCELLED"],
    RECEIVED: [],
    CANCELLED: [],
};

export const STOCK_TRANSFER_TRANSITIONS = {
    REQUESTED: ["APPROVED", "REJECTED"],
    APPROVED: ["IN_TRANSIT", "CANCELLED"],
    IN_TRANSIT: ["RECEIVED"],
    RECEIVED: [],
    REJECTED: [],
};

export const LEAVE_TRANSITIONS = {
    PENDING: ["APPROVED", "REJECTED", "CANCELLED"],
    APPROVED: [],
    REJECTED: [],
    CANCELLED: [],
};

export const TICKET_TRANSITIONS = {
    OPEN: ["IN_PROGRESS", "WAITING", "CLOSED"],
    IN_PROGRESS: ["WAITING", "RESOLVED", "CLOSED"],
    WAITING: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
    RESOLVED: ["CLOSED"],
    CLOSED: [],
};

export const EXPENSE_TRANSITIONS = {
    DRAFT: ["SUBMITTED"],
    SUBMITTED: ["APPROVED", "REJECTED"],
    APPROVED: ["PROCESSED", "PAID"],
    REJECTED: [],
    PROCESSED: ["PAID"],
    PAID: [],
};

export const QUOTE_TRANSITIONS = {
    DRAFT: ["SENT", "REJECTED"],
    SENT: ["ACCEPTED", "REJECTED", "EXPIRED"],
    ACCEPTED: [],
    REJECTED: [],
    EXPIRED: [],
};

export const ORDER_TRANSITIONS = {
    DRAFT: ["PENDING", "CANCELLED"],
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["RESERVED", "FULFILLED", "CANCELLED"],
    RESERVED: ["FULFILLED", "CANCELLED"],
    FULFILLED: [],
    CANCELLED: [],
};

/** Allowed next states for a workflow, or [] when unknown. */
export function nextTransitions(stateMap, current) {
    return stateMap[current] || [];
}

export function canTransition(stateMap, current, next) {
    return nextTransitions(stateMap, current).includes(next);
}

export function statusLabel(status) {
    if (!status) return "\u2014";
    return String(status)
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
