CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,

    company VARCHAR(255) NOT NULL,

    registration_number VARCHAR(100),

    email VARCHAR(255) NOT NULL UNIQUE,

    phone VARCHAR(100),

    address TEXT,

    city VARCHAR(100),

    industry VARCHAR(100),

    tax_id VARCHAR(100),

    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',

    plan VARCHAR(100),

    logo TEXT,

    created_at TEXT,

    subscription JSONB,

    credit_limit NUMERIC(15, 2),

    store JSONB,

    extra JSONB
);
