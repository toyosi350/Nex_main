CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    name VARCHAR(255),

    vendor_id TEXT,

    role VARCHAR(100) NOT NULL DEFAULT 'EMPLOYEE',

    account_type VARCHAR(50) NOT NULL DEFAULT 'STAFF',

    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',

    phone VARCHAR(100),

    last_login TEXT,

    permissions JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
