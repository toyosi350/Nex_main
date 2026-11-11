CREATE TABLE IF NOT EXISTS stock (
    id TEXT PRIMARY KEY,

    vendor_id TEXT,

    product_id TEXT,

    warehouse_id TEXT,

    available INTEGER,

    reserved INTEGER,

    damaged INTEGER,

    incoming INTEGER,

    reorder_level INTEGER,

    unit_cost NUMERIC(15, 2),

    updated_at TEXT,

    movements JSONB,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_stock_vendor_id ON stock (vendor_id);

CREATE INDEX IF NOT EXISTS idx_stock_product_id ON stock (product_id);

CREATE INDEX IF NOT EXISTS idx_stock_warehouse_id ON stock (warehouse_id);
