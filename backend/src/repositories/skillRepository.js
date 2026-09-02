const { query } = require('../config/database');

async function findAll({ category, sortBy = 'name', limit = 100 }) {
  const allowedSort = { name: 'name', popularity: 'popularity_score DESC', trend: 'trend_direction' };
  const orderClause = allowedSort[sortBy] || 'name';

  const conditions = [];
  const params = [];
  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(Math.min(Number(limit) || 100, 500));
  const result = await query(
    `SELECT * FROM skills.skills ${whereClause} ORDER BY ${orderClause} LIMIT $${params.length}`,
    params
  );
  return result.rows;
}

async function findById(id) {
  const result = await query('SELECT * FROM skills.skills WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function findByNormalizedName(normalizedName) {
  const result = await query('SELECT * FROM skills.skills WHERE normalized_name = $1', [normalizedName]);
  return result.rows[0] || null;
}

async function upsert({ name, normalizedName, category, description }) {
  const result = await query(
    `INSERT INTO skills.skills (name, normalized_name, category, description)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (normalized_name) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [name, normalizedName, category, description || null]
  );
  return result.rows[0];
}

async function updatePopularity(skillId, popularityScore, trendDirection) {
  await query(
    `UPDATE skills.skills
     SET popularity_score = $2, trend_direction = $3, updated_at = NOW()
     WHERE id = $1`,
    [skillId, popularityScore, trendDirection]
  );
}

async function jobsRequiringCount(skillId) {
  const result = await query(
    `SELECT COUNT(DISTINCT js.job_id) AS count
     FROM jobs.job_skills js
     JOIN jobs.jobs j ON j.id = js.job_id AND j.is_active = true
     WHERE js.skill_id = $1`,
    [skillId]
  );
  return Number(result.rows[0].count);
}

async function avgSalaryForSkill(skillId) {
  const result = await query(
    `SELECT AVG((j.salary_min + j.salary_max) / 2.0) AS avg_salary,
            MIN(j.salary_min) AS min_salary,
            MAX(j.salary_max) AS max_salary
     FROM jobs.job_skills js
     JOIN jobs.jobs j ON j.id = js.job_id AND j.is_active = true
     WHERE js.skill_id = $1`,
    [skillId]
  );
  return result.rows[0];
}

async function topSkills(limit = 10, sector) {
  const params = [];
  let sectorJoin = '';
  if (sector) {
    params.push(sector);
    sectorJoin = `AND j.sector = $${params.length}`;
  }
  params.push(Math.min(Number(limit) || 10, 100));

  const result = await query(
    `SELECT s.*, COUNT(DISTINCT js.job_id) AS jobs_requiring_skill
     FROM skills.skills s
     JOIN jobs.job_skills js ON js.skill_id = s.id
     JOIN jobs.jobs j ON j.id = js.job_id AND j.is_active = true ${sectorJoin}
     GROUP BY s.id
     ORDER BY jobs_requiring_skill DESC, s.popularity_score DESC
     LIMIT $${params.length}`,
    params
  );
  return result.rows;
}

module.exports = {
  findAll,
  findById,
  findByNormalizedName,
  upsert,
  updatePopularity,
  jobsRequiringCount,
  avgSalaryForSkill,
  topSkills,
};
