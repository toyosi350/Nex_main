CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,

    number TEXT,

    vendor_id TEXT,

    subject TEXT,

    customer_id TEXT,

    customer_name TEXT,

    priority TEXT,

    status TEXT,

    source TEXT,

    assigned_to TEXT,

    created_by TEXT,

    created_at TEXT,

    updated_at TEXT,

    comments JSONB,

    activity JSONB,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_tickets_vendor_id ON tickets (vendor_id);

CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets (customer_id);
