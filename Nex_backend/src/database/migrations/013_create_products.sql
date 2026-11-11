CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,

    vendor_id TEXT,

    category_id TEXT,

    type TEXT,

    sku TEXT,

    name TEXT,

    description TEXT,

    brand TEXT,

    cost_price NUMERIC(15, 2),

    selling_price NUMERIC(15, 2),

    tax_rate NUMERIC(15, 2),

    reorder_level INTEGER,

    unit TEXT,

    status TEXT,

    supplier_ids JSONB,

    base_stock JSONB,

    shop_category TEXT,

    slug TEXT,

    is_published BOOLEAN,

    short_description TEXT,

    compare_at_price NUMERIC(15, 2),

    is_deal BOOLEAN,

    deal_ends_at TEXT,

    featured BOOLEAN,

    rating DOUBLE PRECISION,

    review_count INTEGER,

    sold_count INTEGER,

    free_delivery BOOLEAN,

    image_seed TEXT,

    return_days INTEGER,

    weight_kg DOUBLE PRECISION,

    dimensions TEXT,

    tags JSONB,

    specs JSONB,

    variants JSONB,

    image_count INTEGER,

    created_at TEXT,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products (vendor_id);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);

CREATE INDEX IF NOT EXISTS idx_products_supplier_ids ON products (supplier_ids);
