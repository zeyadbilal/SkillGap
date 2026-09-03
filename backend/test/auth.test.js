const request = require('supertest');
const { randomUUID } = require('node:crypto');

const app = require('../src/app');

// 1. استدعاء ملفات قاعدة البيانات و Redis (قم بتعديل المسار حسب مشروعك)
// const prisma = require('../src/prisma'); // مثال إذا كنت تستخدم Prisma
// const redisClient = require('../src/redis'); // مثال إذا كنت تستخدم Redis

const newUser = (overrides = {}) => ({
  email: `${randomUUID()}@example.com`,
  password: 'Password1',
  fullName: 'Test User',
  fieldOfStudy: 'Software Development',
  graduationYear: 2026,
  ...overrides,
});

const register = async (overrides = {}) => {
  const response = await request(app).post('/auth/register').send(newUser(overrides));
  return response.body.data;
};

const refresh = async (refreshToken) => {
  const response = await request(app).post('/auth/refresh').send({ refreshToken });
  return response.body.data;
};

describe('Authentication API', () => {

  afterAll(async () => {
    await prisma.$disconnect();

    await sequelize.close();

    await pool.end();

     await redisClient.quit();
  });

  describe('POST /auth/register', () => {
    test('registers a user and normalizes the email address', async () => {
      const email = `${randomUUID()}@Example.COM`;

      const data = await register({ email: `  ${email}  ` });

      expect(data.user.email).toBe(email.toLowerCase());
      expect(data.tokens).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });
  });

  describe('token purpose enforcement', () => {
    test('rejects a refresh token on an access-token endpoint', async () => {
      const { tokens } = await register();

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokens.refreshToken}`)
        .expect(401);

      expect(response.body.errorCode).toBe('UNAUTHORIZED');
    });

    test('rejects an access token on the refresh endpoint', async () => {
      const { tokens } = await register();

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: tokens.accessToken })
        .expect(401);

      expect(response.body.errorCode).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('POST /auth/refresh', () => {
    test('rotates tokens and rejects reusing the consumed refresh token', async () => {
      const { tokens } = await register();
      const originalRefreshToken = tokens.refreshToken;

      const firstRefresh = await refresh(originalRefreshToken);

      expect(firstRefresh.accessToken).toEqual(expect.any(String));
      expect(firstRefresh.refreshToken).toEqual(expect.any(String));
      expect(firstRefresh.refreshToken).not.toBe(originalRefreshToken);

      const replay = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: originalRefreshToken })
        .expect(401);
      expect(replay.body.errorCode).toBe('INVALID_REFRESH_TOKEN');

      await refresh(firstRefresh.refreshToken);
    });
  });
});