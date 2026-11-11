CREATE TABLE IF NOT EXISTS leave_requests (
    id TEXT PRIMARY KEY,

    vendor_id TEXT,

    employee_id TEXT,

    employee_name TEXT,

    type TEXT,

    start_date TEXT,

    end_date TEXT,

    days INTEGER,

    reason TEXT,

    status TEXT,

    applied_at TEXT,

    review_by TEXT,

    reviewed_at TEXT,

    activity JSONB,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_vendor_id ON leave_requests (vendor_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests (employee_id);
