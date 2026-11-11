CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,

    vendor_id TEXT,

    employee_id VARCHAR(100),

    user_id TEXT,

    name VARCHAR(255),

    email VARCHAR(255),

    phone VARCHAR(100),

    department_id TEXT,

    position VARCHAR(100),

    manager_id TEXT,

    salary NUMERIC(15, 2),

    employment_date TEXT,

    status VARCHAR(50),

    avatar_color VARCHAR(50),

    activity JSONB,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_employees_vendor_id ON employees (vendor_id);
