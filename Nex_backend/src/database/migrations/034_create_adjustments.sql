CREATE TABLE IF NOT EXISTS adjustments (
    id TEXT PRIMARY KEY,

    number TEXT,

    vendor_id TEXT,

    product_id TEXT,

    warehouse_id TEXT,

    type TEXT,

    quantity INTEGER,

    reason TEXT,

    created_by TEXT,

    created_at TEXT,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_adjustments_vendor_id ON adjustments (vendor_id);

CREATE INDEX IF NOT EXISTS idx_adjustments_product_id ON adjustments (product_id);

CREATE INDEX IF NOT EXISTS idx_adjustments_warehouse_id ON adjustments (warehouse_id);
