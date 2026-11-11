CREATE TABLE IF NOT EXISTS shop_views (
    id TEXT PRIMARY KEY,

    product_id TEXT,

    product_name TEXT,

    vendor_id TEXT,

    at TEXT,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_shop_views_product_id ON shop_views (product_id);

CREATE INDEX IF NOT EXISTS idx_shop_views_vendor_id ON shop_views (vendor_id);
