const rateLimit = require('express-rate-limit');
const config = require('../../config');

const registerLimiter = rateLimit({
  windowMs: config.rateLimit.register.windowMs,
  max: config.rateLimit.register.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many registration attempts. Please try again later.',
    errorCode: 'RATE_LIMITED',
  },
});

const loginLimiter = rateLimit({
  windowMs: config.rateLimit.login.windowMs,
  max: config.rateLimit.login.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again later.',
    errorCode: 'RATE_LIMITED',
  },
});

const publicLimiter = rateLimit({
  windowMs: config.rateLimit.public.windowMs,
  max: config.rateLimit.public.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    errorCode: 'RATE_LIMITED',
  },
});

const authenticatedLimiter = rateLimit({
  windowMs: config.rateLimit.authenticated.windowMs,
  max: config.rateLimit.authenticated.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    errorCode: 'RATE_LIMITED',
  },
});

module.exports = {
  registerLimiter,
  loginLimiter,
  publicLimiter,
  authenticatedLimiter,
};
