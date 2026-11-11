CREATE TABLE IF NOT EXISTS searches (
    id TEXT PRIMARY KEY,

    term TEXT,

    at TEXT,

    extra JSONB
);
