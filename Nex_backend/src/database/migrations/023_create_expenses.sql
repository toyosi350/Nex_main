CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,

    number TEXT,

    vendor_id TEXT,

    category TEXT,

    description TEXT,

    amount NUMERIC(15, 2),

    paid_to TEXT,

    payment_method TEXT,

    status TEXT,

    submitted_by TEXT,

    submitted_at TEXT,

    approved_by TEXT,

    approved_at TEXT,

    paid_at TEXT,

    activity JSONB,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_expenses_vendor_id ON expenses (vendor_id);
