const { query } = require('../config/database');
const skillRepository = require('../repositories/skillRepository');
const cacheService = require('./cacheService');

// Check if skill is trending up, down, or staying stable
// Up = 10%+ increase, Down = 10%+ decrease, otherwise stable
function computeTrendDirection(current, previous) {
  if (previous === 0 || previous == null) return 'stable';
  if (current > previous * 1.1) return 'up';
  if (current < previous * 0.9) return 'down';
  return 'stable';
}

// Daily job: Update how much each skill is mentioned and what salary it gets
// Run this once per day to track skill popularity over time
async function recomputeDailyTrends() {
  const today = new Date().toISOString().slice(0, 10);

  const sectors = await getDistinctSectors();
  const scopes = [null, ...sectors]; // null = all-sectors aggregate

  for (const sector of scopes) {
    const rows = await getSkillMentionStats(sector);
    for (const row of rows) {
      await upsertSkillTrend(row.skill_id, sector, today, row);
    }
  }

  await updateSkillPopularityAndTrend();
}

async function getDistinctSectors() {
  const result = await query('SELECT DISTINCT sector FROM jobs.jobs WHERE sector IS NOT NULL');
  return result.rows.map((r) => r.sector);
}

async function getSkillMentionStats(sector) {
  const params = [];
  let sectorClause = '';
  if (sector) {
    params.push(sector);
    sectorClause = `AND j.sector = $${params.length}`;
  }

  const result = await query(
    `SELECT js.skill_id,
            COUNT(DISTINCT js.job_id) AS mention_count,
            AVG((j.salary_min + j.salary_max) / 2.0) AS avg_salary,
            MIN(j.salary_min) AS min_salary,
            MAX(j.salary_max) AS max_salary
     FROM jobs.job_skills js
     JOIN jobs.jobs j ON j.id = js.job_id AND j.is_active = true ${sectorClause}
     GROUP BY js.skill_id`,
    params
  );
  return result.rows;
}

async function upsertSkillTrend(skillId, sector, period, stats) {
  await query(
    `INSERT INTO analytics.skill_trends (skill_id, sector, period, mention_count, avg_salary, min_salary, max_salary)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (skill_id, sector, period) DO UPDATE SET
       mention_count = EXCLUDED.mention_count,
       avg_salary = EXCLUDED.avg_salary,
       min_salary = EXCLUDED.min_salary,
       max_salary = EXCLUDED.max_salary`,
    [skillId, sector, period, stats.mention_count, stats.avg_salary, stats.min_salary, stats.max_salary]
  );
}

// Compare skill mentions from today vs 30 days ago
// Update popularity score and trend direction for each skill
async function updateSkillPopularityAndTrend() {
  const result = await query(
    `SELECT skill_id, mention_count, period
     FROM analytics.skill_trends
     WHERE sector IS NULL
     ORDER BY skill_id, period DESC`
  );

  const bySkill = new Map();
  for (const row of result.rows) {
    if (!bySkill.has(row.skill_id)) bySkill.set(row.skill_id, []);
    bySkill.get(row.skill_id).push(row);
  }

  const maxMention = Math.max(...result.rows.map((r) => r.mention_count), 1);

  for (const [skillId, history] of bySkill.entries()) {
    const current = history[0];
    const thirtyDaysAgo = history.find((r) => {
      const daysDiff = (new Date(current.period) - new Date(r.period)) / (1000 * 60 * 60 * 24);
      return daysDiff >= 29 && daysDiff <= 31;
    });

    const trendDirection = computeTrendDirection(
      current.mention_count,
      thirtyDaysAgo ? thirtyDaysAgo.mention_count : current.mention_count
    );
    const popularityScore = Math.min(1, current.mention_count / maxMention);

    await skillRepository.updatePopularity(skillId, popularityScore, trendDirection);
  }
}

async function getTrends(sector, days = 30) {
  const cacheKey = cacheService.keys.trends(sector, days);
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const params = [days];
  let sectorClause = '';
  if (sector) {
    params.push(sector);
    sectorClause = `AND sector = $${params.length}`;
  } else {
    sectorClause = 'AND sector IS NULL';
  }

  const result = await query(
    `SELECT st.*, s.name AS skill_name
     FROM analytics.skill_trends st
     JOIN skills.skills s ON s.id = st.skill_id
     WHERE st.period >= (CURRENT_DATE - $1::int) ${sectorClause}
     ORDER BY st.period DESC`,
    params
  );

  await cacheService.set(cacheKey, result.rows, cacheService.TTL.TRENDS);
  return result.rows;
}

async function getTopSkills(limit = 10, sector) {
  return skillRepository.topSkills(limit, sector);
}

module.exports = {
  computeTrendDirection,
  recomputeDailyTrends,
  getTrends,
  getTopSkills,
};
