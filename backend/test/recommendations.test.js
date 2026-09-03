const request = require('supertest');

const app = require('../src/app');

describe('Recommendations API', () => {
  test('analyzes CV text and returns ranked recommendations', async () => {
    const response = await request(app)
      .post('/api/v1/recommendations/analyze')
      .send({
        cvText:
          'Backend engineer with 4 years of experience building Node.js APIs with Express.js, PostgreSQL, Docker, AWS, Redis, CI/CD, and REST API integrations.',
        track: 'Backend Development',
        topSkillsLimit: 10,
        roadmapMonths: 3,
        skillsPerMonth: 3,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.profileSummary.track).toBe('Backend Development');
    expect(response.body.data.currentSkills.map((item) => item.skill)).toEqual(
      expect.arrayContaining(['node.js', 'express.js', 'postgresql', 'docker', 'aws'])
    );
    expect(response.body.data.skillGaps.map((item) => item.skill)).toEqual(
      expect.arrayContaining(['kubernetes'])
    );
    expect(response.body.data.learningRoadmap.length).toBeGreaterThan(0);
  });
});
