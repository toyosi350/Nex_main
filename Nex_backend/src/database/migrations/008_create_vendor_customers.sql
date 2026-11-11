CREATE TABLE IF NOT EXISTS vendor_customers (
    id SERIAL PRIMARY KEY,

    vendor_id TEXT NOT NULL
        REFERENCES vendors(id)
        ON DELETE CASCADE,

    customer_id TEXT NOT NULL
        REFERENCES customers(id)
        ON DELETE CASCADE,

    credit_limit NUMERIC(15, 2) DEFAULT 0,

    payment_terms VARCHAR(100),

    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (vendor_id, customer_id)
);