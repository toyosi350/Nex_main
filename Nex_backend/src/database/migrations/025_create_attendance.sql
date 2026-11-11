CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,

    vendor_id TEXT,

    employee_id TEXT,

    date TEXT,

    status TEXT,

    check_in TEXT,

    check_out TEXT,

    recorded_by TEXT,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_attendance_vendor_id ON attendance (vendor_id);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance (employee_id);
