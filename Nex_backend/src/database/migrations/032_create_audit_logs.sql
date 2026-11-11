CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,

    vendor_id TEXT,

    user_id TEXT,

    user_name TEXT,

    role TEXT,

    action TEXT,

    entity TEXT,

    entity_id TEXT,

    detail TEXT,

    ip TEXT,

    device TEXT,

    at TEXT,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_vendor_id ON audit_logs (vendor_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs (entity_id);
