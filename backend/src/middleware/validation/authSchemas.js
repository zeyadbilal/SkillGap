const Joi = require("joi");

const fieldsOfStudy = [
  "Backend Development",
  "Frontend Development",
  "Full-Stack Development",
  "Mobile Development",
  "DevOps & Cloud Engineering",
  "Network Administration",
  "Network Security",
  "Machine Learning / AI",
];

const registerSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/[a-z]/, "lowercase")
    .pattern(/[A-Z]/, "uppercase")
    .pattern(/\d/, "number")
    .required(),
  fullName: Joi.string().min(2).max(255).required(),
  fieldOfStudy: Joi.string()
    .valid(...fieldsOfStudy)
    .required(),
  graduationYear: Joi.number()
    .integer()
    .min(2000)
    .max(new Date().getFullYear() + 1)
    .required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = {
  fieldsOfStudy,
  registerSchema,
  loginSchema,
  refreshSchema,
};
