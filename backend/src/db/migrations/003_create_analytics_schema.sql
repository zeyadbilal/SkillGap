CREATE SCHEMA IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    generated_at        TIMESTAMP DEFAULT NOW(),
    skill_gaps          JSONB,
    recommendations     JSONB,
    learning_roadmap    JSONB,
    pdf_url             VARCHAR(1000),
    status              VARCHAR(20) DEFAULT 'generating' CHECK (status IN ('generating','generated','error')),
    generation_time_ms  INT
);

CREATE INDEX IF NOT EXISTS idx_reports_user ON analytics.reports (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON analytics.reports (generated_at DESC);

CREATE TABLE IF NOT EXISTS analytics.skill_trends (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id     UUID NOT NULL REFERENCES skills.skills(id) ON DELETE CASCADE,
    sector       VARCHAR(100),
    period       DATE NOT NULL,
    mention_count INT DEFAULT 0,
    avg_salary   DECIMAL(10,2),
    min_salary   DECIMAL(10,2),
    max_salary   DECIMAL(10,2),
    created_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (skill_id, sector, period)
);

CREATE INDEX IF NOT EXISTS idx_skill_trends_skill ON analytics.skill_trends (skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_trends_period ON analytics.skill_trends (period DESC);
CREATE INDEX IF NOT EXISTS idx_skill_trends_sector_period ON analytics.skill_trends (sector, period DESC);
