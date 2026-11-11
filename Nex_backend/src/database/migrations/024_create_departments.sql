CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,

    vendor_id TEXT,

    name TEXT,

    code TEXT,

    head_id TEXT,

    description TEXT,

    employee_count INTEGER,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_departments_vendor_id ON departments (vendor_id);

CREATE INDEX IF NOT EXISTS idx_departments_head_id ON departments (head_id);
