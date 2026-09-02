CREATE SCHEMA IF NOT EXISTS app_auth;

CREATE TABLE IF NOT EXISTS app_auth.users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255) UNIQUE NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    full_name         VARCHAR(255),
    field_of_study    VARCHAR(100),
    graduation_year   INT CHECK (graduation_year BETWEEN EXTRACT(YEAR FROM CURRENT_DATE) - 50 AND EXTRACT(YEAR FROM CURRENT_DATE) + 5),
    years_experience  INT CHECK (years_experience BETWEEN 0 AND 70),
    avatar_url        VARCHAR(500),
    is_active         BOOLEAN DEFAULT true,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP,
    last_login        TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON app_auth.users (email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON app_auth.users (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON app_auth.users (is_active);
CREATE INDEX IF NOT EXISTS idx_users_field_of_study ON app_auth.users (field_of_study);
