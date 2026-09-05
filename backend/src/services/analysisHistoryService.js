const { Analysis } = require('../models');

async function createForUser(userId, { result, track = null, source = 'text' }) {
  const profileSummary = result.profileSummary || {};

  return Analysis.create({
    userId,
    track: track || profileSummary.track || null,
    source,
    matchScore: profileSummary.matchScore ?? null,
    detectedSkills: profileSummary.detectedSkills ?? null,
    missingSkills: profileSummary.missingSkills ?? null,
    result,
  });
}

async function listForUser(userId, { limit = 50 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  return Analysis.findAll({
    where: { userId },
    attributes: [
      'id',
      'track',
      'source',
      'matchScore',
      'detectedSkills',
      'missingSkills',
      'createdAt',
    ],
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
  });
}

async function getByIdForUser(userId, id) {
  return Analysis.findOne({
    where: { id, userId },
  });
}

module.exports = {
  createForUser,
  listForUser,
  getByIdForUser,
};