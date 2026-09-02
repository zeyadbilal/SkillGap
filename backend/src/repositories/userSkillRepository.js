const { query } = require('../config/database');

async function findByUser(userId) {
  const result = await query(
    `SELECT us.id, s.id AS skill_id, s.name, s.category, us.proficiency_level,
            us.years_of_experience, us.endorsed_count
     FROM skills.user_skills us
     JOIN skills.skills s ON s.id = us.skill_id
     WHERE us.user_id = $1
     ORDER BY s.name`,
    [userId]
  );
  return result.rows;
}

async function upsertSkill(userId, skillId, proficiencyLevel, yearsOfExperience) {
  const result = await query(
    `INSERT INTO skills.user_skills (user_id, skill_id, proficiency_level, years_of_experience)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, skill_id) DO UPDATE SET
       proficiency_level = EXCLUDED.proficiency_level,
       years_of_experience = EXCLUDED.years_of_experience,
       updated_at = NOW()
     RETURNING *`,
    [userId, skillId, proficiencyLevel, yearsOfExperience]
  );
  return result.rows[0];
}

async function bulkReplace(userId, skills) {
  // skills: [{ skillId, proficiencyLevel, yearsOfExperience }]
  const results = [];
  for (const s of skills) {
    results.push(await upsertSkill(userId, s.skillId, s.proficiencyLevel, s.yearsOfExperience));
  }
  return results;
}

async function deleteAllForUser(userId) {
  await query('DELETE FROM skills.user_skills WHERE user_id = $1', [userId]);
}

module.exports = { findByUser, upsertSkill, bulkReplace, deleteAllForUser };
