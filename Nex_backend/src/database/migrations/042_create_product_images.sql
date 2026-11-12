CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY,

    product_id TEXT NOT NULL,

    vendor_id TEXT NOT NULL,

    url TEXT NOT NULL,

    position INTEGER NOT NULL DEFAULT 0,

    created_at TEXT,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images (product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_vendor_id ON product_images (vendor_id);
