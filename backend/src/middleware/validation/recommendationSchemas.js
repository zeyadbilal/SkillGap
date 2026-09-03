const Joi = require('joi');
const { getSupportedTracks } = require('../../services/recommendationService');

const analyzeSchema = Joi.object({
  cvText: Joi.string().trim().min(20),
  filePath: Joi.string().trim(),
  originalName: Joi.string().trim(),
  track: Joi.string().valid(...getSupportedTracks()),
  topSkillsLimit: Joi.number().integer().min(3).max(20).default(12),
  roadmapMonths: Joi.number().integer().min(1).max(6).default(3),
  skillsPerMonth: Joi.number().integer().min(1).max(6).default(3),
})
  .or('cvText', 'filePath')
  .and('filePath', 'originalName');

module.exports = { analyzeSchema };
