CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,

    vendor_id TEXT,

    name TEXT,

    description TEXT,

    department TEXT,

    status TEXT,

    budget NUMERIC(15, 2),

    spent INTEGER,

    progress INTEGER,

    start_date TEXT,

    deadline TEXT,

    team_ids JSONB,

    created_at TEXT,

    activity JSONB,

    milestones JSONB,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_projects_vendor_id ON projects (vendor_id);

CREATE INDEX IF NOT EXISTS idx_projects_team_ids ON projects (team_ids);
