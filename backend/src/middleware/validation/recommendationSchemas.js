const Joi = require('joi');

const analyzeCvSchema = Joi.object({
  cvText: Joi.string().trim().min(20).optional(),
});

module.exports = {
  analyzeCvSchema,
};
