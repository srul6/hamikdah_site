-- Table for post-upload metadata (presigned upload flow).
-- Run this once on your Neon DB (e.g. in SQL Editor).
CREATE TABLE IF NOT EXISTS file_uploads (
    id          SERIAL PRIMARY KEY,
    user_id     VARCHAR(128) NOT NULL,
    object_key  VARCHAR(512) NOT NULL,
    mime_type   VARCHAR(128) NOT NULL,
    size_bytes  BIGINT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at);
