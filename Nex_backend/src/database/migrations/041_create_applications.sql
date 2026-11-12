CREATE TABLE IF NOT EXISTS vendor_applications (
    id TEXT PRIMARY KEY,

    business_name TEXT NOT NULL,

    contact_name TEXT NOT NULL,

    email TEXT NOT NULL,

    phone TEXT,

    category TEXT,

    details TEXT,

    status TEXT NOT NULL DEFAULT 'PENDING',

    created_at TEXT,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_vendor_applications_email ON vendor_applications (email);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_status ON vendor_applications (status);

CREATE TABLE IF NOT EXISTS career_applications (
    id TEXT PRIMARY KEY,

    full_name TEXT NOT NULL,

    email TEXT NOT NULL,

    phone TEXT,

    role TEXT NOT NULL,

    link TEXT,

    note TEXT,

    status TEXT NOT NULL DEFAULT 'PENDING',

    created_at TEXT,

    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_career_applications_email ON career_applications (email);
CREATE INDEX IF NOT EXISTS idx_career_applications_status ON career_applications (status);
CREATE INDEX IF NOT EXISTS idx_career_applications_role ON career_applications (role);
