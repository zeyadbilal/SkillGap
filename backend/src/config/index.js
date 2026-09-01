const jwtSecret = process.env.JWT_SECRET;

module.exports = {
  port: process.env.PORT || 5000,

  jwt: {
    secret: jwtSecret || 'dev-secret-change-in-production-min-32-chars!!',
    accessExpiresIn: '24h',
    refreshExpiresIn: '7d',
  },

  bcrypt: {
    saltRounds: 12,
  },

  rateLimit: {
    register: { windowMs: 60 * 1000, max: 5 },
    login: { windowMs: 60 * 1000, max: 10 },
    public: { windowMs: 60 * 1000, max: 100 },
    authenticated: { windowMs: 60 * 1000, max: 1000 },
  },
};
