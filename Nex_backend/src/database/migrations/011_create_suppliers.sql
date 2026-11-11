CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,

    vendor_id TEXT,

    name TEXT,

    contact_person TEXT,

    email TEXT,

    phone TEXT,

    address TEXT,

    payment_terms TEXT,

    payment_method TEXT,

    status TEXT,

    products JSONB,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_suppliers_vendor_id ON suppliers (vendor_id);
