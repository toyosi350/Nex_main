CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,

    number TEXT,

    vendor_id TEXT,

    supplier_id TEXT,

    supplier_name TEXT,

    purchase_request_id TEXT,

    lines JSONB,

    status TEXT,

    expected_delivery TEXT,

    created_at TEXT,

    approved_by TEXT,

    received_at TEXT,

    activity JSONB,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_id ON purchase_orders (vendor_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders (supplier_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_purchase_request_id ON purchase_orders (purchase_request_id);
