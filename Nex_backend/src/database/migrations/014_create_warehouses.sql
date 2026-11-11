CREATE TABLE IF NOT EXISTS warehouses (
    id TEXT PRIMARY KEY,

    vendor_id TEXT,

    name TEXT,

    code TEXT,

    city TEXT,

    is_primary BOOLEAN,

    created_at TEXT,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_warehouses_vendor_id ON warehouses (vendor_id);
