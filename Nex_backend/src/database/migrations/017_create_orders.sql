CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,

    number TEXT,

    vendor_id TEXT,

    customer_id TEXT,

    customer_name TEXT,

    quote_id TEXT,

    lines JSONB,

    status TEXT,

    subtotal NUMERIC(15, 2),

    discount NUMERIC(15, 2),

    taxable NUMERIC(15, 2),

    tax NUMERIC(15, 2),

    total NUMERIC(15, 2),

    created_at TEXT,

    ordered_at TEXT,

    expected_delivery TEXT,

    issued_by TEXT,

    payments JSONB,

    activity JSONB,

    tax_rate NUMERIC(15, 2),

    discount_type TEXT,

    discount_value NUMERIC(15, 2),

    shop_order_id TEXT,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders (vendor_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_quote_id ON orders (quote_id);

CREATE INDEX IF NOT EXISTS idx_orders_shop_order_id ON orders (shop_order_id);
