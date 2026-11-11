CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,

    number TEXT,

    vendor_id TEXT,

    customer_id TEXT,

    customer_name TEXT,

    invoice_id TEXT,

    invoice_number TEXT,

    amount NUMERIC(15, 2),

    method TEXT,

    reference TEXT,

    status TEXT,

    paid_at TEXT,

    received_by TEXT,

    created_at TEXT,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_payments_vendor_id ON payments (vendor_id);

CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments (customer_id);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments (invoice_id);
