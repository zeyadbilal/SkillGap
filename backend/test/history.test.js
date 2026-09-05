const request = require('supertest');
const bcrypt = require('bcryptjs');
const tokenService = require('../src/services/token/tokenService');

require('dotenv').config();

const { sequelize, User, Analysis } = require('../src/models');

const app = require('../src/app');

const USER_ID = '2f6e60d8-9f5c-4f5b-8c1a-000000000002';
const OTHER_USER_ID = '2f6e60d8-9f5c-4f5b-8c1a-000000000003';

const authorization = () =>
  `Bearer ${tokenService.signAccessToken({
    sub: USER_ID,
    email: 'history-test@example.com',
    fieldOfStudy: 'Full-Stack Development',
  })}`;

const createAnalysis = async ({
  userId = USER_ID,
  track = 'Full-Stack Development',
  source = 'text',
  result = {
    profileSummary: { track, matchScore: 82, detectedSkills: 9, missingSkills: 4 },
    currentSkills: [{ skill: 'node.js' }],
    skillGaps: [{ skill: 'docker' }],
    learningRoadmap: [{ month: 1, skills: ['docker'] }],
    pipeline: { extractor: 'python-spacy' },
  },
} = {}) =>
  Analysis.create({
    userId,
    track,
    source,
    matchScore: result.profileSummary.matchScore,
    detectedSkills: result.profileSummary.detectedSkills,
    missingSkills: result.profileSummary.missingSkills,
    result,
  });

const createUser = (id, email) =>
  User.create({
    id,
    email,
    passwordHash: bcrypt.hashSync('password123', 10),
  });

describe('Analysis History API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await createUser(USER_ID, 'history-test@example.com');
    await createUser(OTHER_USER_ID, 'history-other@example.com');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('lists the most recent analyses for the authenticated user', async () => {
    await createAnalysis();
    await createAnalysis({ track: 'Data Science & Analytics' });

    const response = await request(app)
      .get('/recommendations/history')
      .set('Authorization', authorization())
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);

    const first = response.body.data[0];
    expect(first).toEqual(
      expect.objectContaining({
        track: 'Data Science & Analytics',
        source: 'text',
        matchScore: 82,
        detectedSkills: 9,
        missingSkills: 4,
      })
    );
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('createdAt');
    expect(first).not.toHaveProperty('result');
  });

  test('does not leak another user\'s analyses into the list', async () => {
    await createAnalysis({ userId: OTHER_USER_ID, track: 'Machine Learning / AI' });

    const response = await request(app)
      .get('/recommendations/history')
      .set('Authorization', authorization())
      .expect(200);

    expect(response.body.data.every((item) => item.userId === undefined)).toBe(true);
    expect(response.body.data.some((item) => item.track === 'Machine Learning / AI')).toBe(false);
  });

  test('returns the full result for a single analysis by id', async () => {
    const analysis = await createAnalysis();

    const response = await request(app)
      .get(`/recommendations/history/${analysis.id}`)
      .set('Authorization', authorization())
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      id: analysis.id,
      track: 'Full-Stack Development',
      source: 'text',
      result: expect.objectContaining({
        profileSummary: expect.objectContaining({ matchScore: 82 }),
        currentSkills: [{ skill: 'node.js' }],
        skillGaps: [{ skill: 'docker' }],
      }),
      createdAt: expect.any(String),
    });
  });

  test('respects a limit query parameter', async () => {
    await request(app)
      .get('/recommendations/history?limit=1')
      .set('Authorization', authorization())
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveLength(1);
      });
  });

  test('returns 404 for an analysis owned by another user', async () => {
    const analysis = await createAnalysis({ userId: OTHER_USER_ID });

    const response = await request(app)
      .get(`/recommendations/history/${analysis.id}`)
      .set('Authorization', authorization())
      .expect(404);

    expect(response.body.errorCode).toBe('NOT_FOUND');
  });

  test('returns 404 for a malformed or unknown analysis id', async () => {
    await request(app)
      .get('/recommendations/history/not-a-uuid')
      .set('Authorization', authorization())
      .expect(404);

    const response = await request(app)
      .get('/recommendations/history/2f6e60d8-9f5c-4f5b-8c1a-000000000000')
      .set('Authorization', authorization())
      .expect(404);

    expect(response.body.errorCode).toBe('NOT_FOUND');
  });

  test('requires authentication for the history list and details', async () => {
    await request(app).get('/recommendations/history').expect(401);
    await request(app)
      .get('/recommendations/history/2f6e60d8-9f5c-4f5b-8c1a-000000000000')
      .expect(401);
  });
});