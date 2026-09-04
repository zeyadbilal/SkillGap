const jwtSecret = process.env.JWT_SECRET;

module.exports = {
  port: process.env.PORT || 5000,

  model: {
    baseUrl: process.env.MODEL_SERVICE_URL || 'http://localhost:5001',
    timeoutMs: Number(process.env.MODEL_SERVICE_TIMEOUT_MS || 30000),
  },

  jwt: {
    secret: jwtSecret || 'dev-secret-change-in-production-min-32-chars!!',
    accessExpiresIn: '24h',
    refreshExpiresIn: '7d',
  },

  bcrypt: {
    saltRounds: 12,
  },

  rateLimit: {
    register: { windowMs: 60 * 1000, max: Number(process.env.RATE_LIMIT_REGISTER_MAX || 5) },
    login: { windowMs: 60 * 1000, max: Number(process.env.RATE_LIMIT_LOGIN_MAX || 10) },
    public: { windowMs: 60 * 1000, max: Number(process.env.RATE_LIMIT_PUBLIC_MAX || 100) },
    authenticated: { windowMs: 60 * 1000, max: Number(process.env.RATE_LIMIT_AUTHENTICATED_MAX || 1000) },
  },
};
