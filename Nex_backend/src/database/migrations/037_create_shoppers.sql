CREATE TABLE IF NOT EXISTS shoppers (
    id TEXT PRIMARY KEY,

    name TEXT,

    email TEXT,

    phone TEXT,

    password_hash TEXT,

    created_at TEXT,

    addresses JSONB,

    extra JSONB
);
