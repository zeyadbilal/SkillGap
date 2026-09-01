const { query } = require('../config/database');

async function create(userId, status = 'generating') {
  const result = await query(
    `INSERT INTO analytics.reports (user_id, status) VALUES ($1, $2) RETURNING *`,
    [userId, status]
  );
  return result.rows[0];
}

async function complete(reportId, { skillGaps, recommendations, learningRoadmap, pdfUrl, generationTimeMs }) {
  const result = await query(
    `UPDATE analytics.reports
     SET skill_gaps = $2, recommendations = $3, learning_roadmap = $4,
         pdf_url = $5, status = 'generated', generation_time_ms = $6
     WHERE id = $1
     RETURNING *`,
    [reportId, JSON.stringify(skillGaps), JSON.stringify(recommendations),
      JSON.stringify(learningRoadmap), pdfUrl, generationTimeMs]
  );
  return result.rows[0];
}

async function markError(reportId) {
  await query(`UPDATE analytics.reports SET status = 'error' WHERE id = $1`, [reportId]);
}

async function findById(id) {
  const result = await query('SELECT * FROM analytics.reports WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function findLatestForUser(userId) {
  const result = await query(
    `SELECT * FROM analytics.reports WHERE user_id = $1 ORDER BY generated_at DESC LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

module.exports = { create, complete, markError, findById, findLatestForUser };
