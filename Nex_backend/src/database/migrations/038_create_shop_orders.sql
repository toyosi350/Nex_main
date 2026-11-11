CREATE TABLE IF NOT EXISTS shop_orders (
    id TEXT PRIMARY KEY,

    number TEXT,

    shopper_id TEXT,

    email TEXT,

    name TEXT,

    phone TEXT,

    items JSONB,

    address JSONB,

    delivery_method TEXT,

    delivery_fee NUMERIC(15, 2),

    subtotal NUMERIC(15, 2),

    discount NUMERIC(15, 2),

    total NUMERIC(15, 2),

    payment_method TEXT,

    payment_status TEXT,

    status TEXT,

    timeline JSONB,

    erp_orders JSONB,

    note TEXT,

    created_at TEXT,

    estimated_delivery TEXT,

    channel TEXT,

    auto_advance BOOLEAN,

    cancelled_at TEXT,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_shopper_id ON shop_orders (shopper_id);
