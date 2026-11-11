CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,

    number TEXT,

    vendor_id TEXT,

    purchase_order_id TEXT,

    supplier_id TEXT,

    supplier_name TEXT,

    lines JSONB,

    status TEXT,

    received_at TEXT,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_receipts_vendor_id ON receipts (vendor_id);

CREATE INDEX IF NOT EXISTS idx_receipts_purchase_order_id ON receipts (purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_receipts_supplier_id ON receipts (supplier_id);
