CREATE TABLE IF NOT EXISTS transfers (
    id TEXT PRIMARY KEY,

    reference TEXT,

    vendor_id TEXT,

    product_id TEXT,

    from_warehouse_id TEXT,

    to_warehouse_id TEXT,

    quantity INTEGER,

    status TEXT,

    requested_by TEXT,

    created_at TEXT,

    updated_at TEXT,

    history JSONB,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_transfers_vendor_id ON transfers (vendor_id);

CREATE INDEX IF NOT EXISTS idx_transfers_product_id ON transfers (product_id);

CREATE INDEX IF NOT EXISTS idx_transfers_from_warehouse_id ON transfers (from_warehouse_id);

CREATE INDEX IF NOT EXISTS idx_transfers_to_warehouse_id ON transfers (to_warehouse_id);
