CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,

    vendor_id TEXT,

    name TEXT,

    code TEXT,

    product_count INTEGER,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_categories_vendor_id ON categories (vendor_id);
