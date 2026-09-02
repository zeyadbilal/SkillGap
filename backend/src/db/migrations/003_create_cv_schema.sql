CREATE SCHEMA IF NOT EXISTS cv;

CREATE TABLE IF NOT EXISTS cv.documents (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_name     VARCHAR(255) NOT NULL,
    storage_path      VARCHAR(500) NOT NULL,
    mime_type         VARCHAR(100) NOT NULL,
    file_size         BIGINT,
    parsed_text       TEXT,
    extracted_skills  JSONB DEFAULT '[]'::jsonb,
    education         JSONB DEFAULT '{}'::jsonb,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cv_documents_user_id ON cv.documents (user_id);
CREATE INDEX IF NOT EXISTS idx_cv_documents_created_at ON cv.documents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cv_documents_updated_at ON cv.documents (updated_at DESC);
