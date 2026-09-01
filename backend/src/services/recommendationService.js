const skillRepository = require('../repositories/skillRepository');
const userSkillRepository = require('../repositories/userSkillRepository');
const { query } = require('../config/database');
const cacheService = require('./cacheService');

// Compare what user knows vs what the market wants
// Create a priority list of skills to learn + 3-month learning plan

const PROFICIENCY_RANK = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 };

async function getMarketDemandSkills(sector, limit = 50) {
  const params = [];
  let sectorClause = '';
  if (sector) {
    params.push(sector);
    sectorClause = `AND j.sector = $${params.length}`;
  }
  params.push(limit);

  const result = await query(
    `SELECT s.id, s.name, s.category, s.popularity_score, s.trend_direction,
            COUNT(DISTINCT js.job_id) AS frequency,
            AVG((j.salary_min + j.salary_max) / 2.0) AS avg_salary,
            AVG(js.importance) AS avg_importance
     FROM skills.skills s
     JOIN jobs.job_skills js ON js.skill_id = s.id
     JOIN jobs.jobs j ON j.id = js.job_id AND j.is_active = true ${sectorClause}
     GROUP BY s.id
     ORDER BY frequency DESC
     LIMIT $${params.length}`,
    params
  );
  return result.rows;
}

// Rate how much the market wants this skill (0-1 score)
function computeDemandScore(skillRow, maxFrequency) {
  const freqComponent = maxFrequency > 0 ? skillRow.frequency / maxFrequency : 0;
  const importanceComponent = Number(skillRow.avg_importance) || 0.5;
  return Math.min(1, 0.6 * freqComponent + 0.4 * importanceComponent);
}

function computePriority(demandScore, userHasSkill, userProficiencyRank) {
  // Skills user completely lacks get higher priority to learn
  const gapSeverity = userHasSkill ? Math.max(0, (4 - userProficiencyRank) / 4) : 1;
  const raw = demandScore * 0.7 + gapSeverity * 0.3;
  return Math.max(1, Math.min(10, Math.round(raw * 10)));
}

async function analyzeGaps(userId, sector) {
  const [userSkills, marketSkills] = await Promise.all([
    userSkillRepository.findByUser(userId),
    getMarketDemandSkills(sector),
  ]);

  const userSkillMap = new Map(userSkills.map((s) => [s.skill_id, s]));
  const maxFrequency = Math.max(...marketSkills.map((s) => Number(s.frequency)), 1);

  const skillGaps = [];
  for (const marketSkill of marketSkills) {
    const owned = userSkillMap.get(marketSkill.id);
    const demandScore = computeDemandScore(marketSkill, maxFrequency);
    const userRank = owned ? PROFICIENCY_RANK[owned.proficiency_level] || 1 : 0;

    // Skip skills the user already has at Advanced/Expert level — not a gap.
    if (owned && userRank >= 3) continue;

    skillGaps.push({
      id: marketSkill.id,
      name: marketSkill.name,
      category: marketSkill.category,
      demandScore: Number(demandScore.toFixed(2)),
      frequency: Number(marketSkill.frequency),
      avgSalary: marketSkill.avg_salary ? Number(Number(marketSkill.avg_salary).toFixed(2)) : null,
      priority: computePriority(demandScore, !!owned, userRank),
      trend: marketSkill.trend_direction,
      learningResources: buildLearningResources(marketSkill.name, marketSkill.category),
    });
  }

  skillGaps.sort((a, b) => b.priority - a.priority);

  const currentSkills = userSkills.map((s) => ({
    id: s.skill_id,
    name: s.name,
    category: s.category,
    proficiencyLevel: s.proficiency_level,
    yearsOfExperience: s.years_of_experience,
  }));

  const learningRoadmap = buildRoadmap(skillGaps);

  return { currentSkills, skillGaps, learningRoadmap };
}

function buildLearningResources(skillName, category) {
  // Placeholder resource suggestions; swap for a real course-catalog lookup later.
  return [
    { title: `${skillName} Fundamentals`, type: 'course' },
    { title: `Hands-on ${skillName} project`, type: 'project' },
    { title: `${category || 'General'} community resources`, type: 'community' },
  ];
}

/**
 * Splits the top-priority gaps into a 3-month plan: ~2-3 skills/month,
 * ordered by priority, each with a suggested project and hour budget.
 */
function buildRoadmap(skillGaps, monthsCount = 3, skillsPerMonth = 3) {
  const topGaps = skillGaps.slice(0, monthsCount * skillsPerMonth);
  const roadmap = [];

  for (let month = 1; month <= monthsCount; month += 1) {
    const monthSkills = topGaps.slice((month - 1) * skillsPerMonth, month * skillsPerMonth);
    if (monthSkills.length === 0) break;

    const estimatedHours = monthSkills.length * 20; // ~20h per skill baseline
    roadmap.push({
      month,
      title: `Focus: ${monthSkills.map((s) => s.name).join(', ')}`,
      skills: monthSkills.map((s) => s.name),
      projects: monthSkills.map((s) => `Build a small project using ${s.name}`),
      estimatedHours,
      hoursPerWeek: Math.ceil(estimatedHours / 4),
    });
  }
  return roadmap;
}

async function getCachedGaps(userId, sector) {
  const cacheKey = cacheService.keys.userGaps(userId, sector);
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const result = await analyzeGaps(userId, sector);
  await cacheService.set(cacheKey, result, cacheService.TTL.USER_GAPS);
  return result;
}

async function getLearningPath(userId, sector) {
  const cacheKey = cacheService.keys.userRecommendations(userId);
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const { learningRoadmap } = await analyzeGaps(userId, sector);
  const totalHours = learningRoadmap.reduce((sum, m) => sum + m.estimatedHours, 0);
  const expectedCompletionDate = new Date();
  expectedCompletionDate.setMonth(expectedCompletionDate.getMonth() + learningRoadmap.length);

  const result = {
    learningRoadmap,
    totalHours,
    expectedCompletionDate: expectedCompletionDate.toISOString().slice(0, 10),
  };

  await cacheService.set(cacheKey, result, cacheService.TTL.USER_RECOMMENDATIONS);
  return result;
}

module.exports = { analyzeGaps, getCachedGaps, getLearningPath, getMarketDemandSkills };
