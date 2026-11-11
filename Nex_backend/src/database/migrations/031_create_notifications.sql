CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,

    vendor_id TEXT,

    source TEXT,

    title TEXT,

    body TEXT,

    read BOOLEAN,

    created_at TEXT,

    link TEXT,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_notifications_vendor_id ON notifications (vendor_id);
