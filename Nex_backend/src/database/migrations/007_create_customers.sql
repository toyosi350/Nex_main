CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,

    vendor_id TEXT,

    first_name VARCHAR(100),

    last_name VARCHAR(100),

    company VARCHAR(255),

    email VARCHAR(255),

    phone VARCHAR(100),

    address TEXT,

    credit_limit NUMERIC(15, 2),

    payment_terms VARCHAR(100),

    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',

    created_at TEXT,

    total_purchases NUMERIC(15, 2),

    total_paid NUMERIC(15, 2),

    outstanding NUMERIC(15, 2),

    notes JSONB,

    activity JSONB,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_customers_vendor_id ON customers (vendor_id);
