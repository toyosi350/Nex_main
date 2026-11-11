CREATE TABLE IF NOT EXISTS purchase_requests (
    id TEXT PRIMARY KEY,

    number TEXT,

    vendor_id TEXT,

    supplier_id TEXT,

    supplier_name TEXT,

    lines JSONB,

    requested_by TEXT,

    department TEXT,

    status TEXT,

    note TEXT,

    created_at TEXT,

    activity JSONB,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_vendor_id ON purchase_requests (vendor_id);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_supplier_id ON purchase_requests (supplier_id);
