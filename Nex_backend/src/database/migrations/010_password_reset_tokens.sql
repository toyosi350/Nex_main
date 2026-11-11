CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,

    user_id TEXT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    token TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMP NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);