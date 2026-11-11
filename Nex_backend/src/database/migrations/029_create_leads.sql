CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,

    vendor_id TEXT,

    name TEXT,

    company TEXT,

    email TEXT,

    phone TEXT,

    stage TEXT,

    value NUMERIC(15, 2),

    assigned_user TEXT,

    source TEXT,

    next_action TEXT,

    last_activity TEXT,

    created_at TEXT,

    activity JSONB,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_leads_vendor_id ON leads (vendor_id);
