CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,

    product_id TEXT,

    shopper_name TEXT,

    rating INTEGER,

    title TEXT,

    comment TEXT,

    verified BOOLEAN,

    helpful INTEGER,

    created_at TEXT,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews (product_id);
