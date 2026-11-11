CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,

    number TEXT,

    vendor_id TEXT,

    customer_id TEXT,

    customer_name TEXT,

    order_id TEXT,

    lines JSONB,

    discount_type TEXT,

    discount_value NUMERIC(15, 2),

    tax_rate NUMERIC(15, 2),

    subtotal NUMERIC(15, 2),

    discount NUMERIC(15, 2),

    taxable NUMERIC(15, 2),

    tax NUMERIC(15, 2),

    total NUMERIC(15, 2),

    amount_paid NUMERIC(15, 2),

    status TEXT,

    due_date TEXT,

    payment_terms TEXT,

    issued_at TEXT,

    created_at TEXT,

    issued_by TEXT,

    payments JSONB,

    activity JSONB,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON invoices (vendor_id);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices (customer_id);

CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices (order_id);
