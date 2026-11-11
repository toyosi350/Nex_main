CREATE TABLE IF NOT EXISTS marketplace_products (
    id INTEGER PRIMARY KEY,

    name TEXT,

    description TEXT,

    price NUMERIC(15, 2),

    original_price NUMERIC(15, 2),

    brand TEXT,

    category TEXT,

    stock INTEGER,

    image TEXT,

    vendor TEXT,

    subcategory TEXT,

    added_at TEXT,

    rating DOUBLE PRECISION,

    stock_left INTEGER,

    sizes JSONB,

    position INTEGER,

    extra JSONB
);
