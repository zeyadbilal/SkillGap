const Joi = require('joi');

const supportedTracks = [
  'Backend Development',
  'Frontend Development',
  'Full-Stack Development',
  'Mobile Development',
  'DevOps & Cloud Engineering',
  'Network Administration',
  'Network Security',
  'Machine Learning / AI',
];

const analyzeCvSchema = Joi.object({
  cvText: Joi.string().trim().min(20).required(),
  track: Joi.string().valid(...supportedTracks).optional(),
  topSkillsLimit: Joi.number().integer().min(5).max(50).default(12),
  roadmapMonths: Joi.number().integer().min(1).max(12).default(3),
  skillsPerMonth: Joi.number().integer().min(1).max(10).default(3),
});

module.exports = {
  analyzeCvSchema,
};
