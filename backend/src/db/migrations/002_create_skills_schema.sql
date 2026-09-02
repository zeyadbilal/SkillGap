CREATE SCHEMA IF NOT EXISTS skills;

CREATE TABLE IF NOT EXISTS skills.skills (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(100) NOT NULL,
    normalized_name   VARCHAR(100) UNIQUE NOT NULL,
    category          VARCHAR(50),
    description       TEXT,
    icon_url          VARCHAR(500),
    popularity_score  FLOAT DEFAULT 0,
    trend_direction   VARCHAR(10) DEFAULT 'stable' CHECK (trend_direction IN ('up','down','stable')),
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_normalized_name ON skills.skills (normalized_name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills.skills (category);
CREATE INDEX IF NOT EXISTS idx_skills_popularity ON skills.skills (popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_skills_trend ON skills.skills (trend_direction);

CREATE TABLE IF NOT EXISTS skills.user_skills (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id             UUID NOT NULL REFERENCES skills.skills(id) ON DELETE CASCADE,
    proficiency_level    VARCHAR(20) CHECK (proficiency_level IN ('Beginner','Intermediate','Advanced','Expert')),
    years_of_experience  FLOAT,
    endorsed_count       INT DEFAULT 0,
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP,
    UNIQUE (user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON skills.user_skills (user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON skills.user_skills (skill_id);
