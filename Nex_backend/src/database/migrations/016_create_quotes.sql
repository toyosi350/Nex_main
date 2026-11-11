CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,

    number TEXT,

    vendor_id TEXT,

    customer_id TEXT,

    customer_name TEXT,

    lines JSONB,

    discount_type TEXT,

    discount_value NUMERIC(15, 2),

    tax_rate NUMERIC(15, 2),

    status TEXT,

    subtotal NUMERIC(15, 2),

    discount NUMERIC(15, 2),

    taxable NUMERIC(15, 2),

    tax NUMERIC(15, 2),

    total NUMERIC(15, 2),

    valid_until TEXT,

    created_at TEXT,

    issued_by TEXT,

    activity JSONB,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_quotes_vendor_id ON quotes (vendor_id);

CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes (customer_id);
