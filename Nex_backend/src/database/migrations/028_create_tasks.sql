CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,

    vendor_id TEXT,

    project_id TEXT,

    title TEXT,

    description TEXT,

    status TEXT,

    priority TEXT,

    assignee_id TEXT,

    due_date TEXT,

    "order" INTEGER,

    created_at TEXT,

    activity JSONB,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_tasks_vendor_id ON tasks (vendor_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks (project_id);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks (assignee_id);
