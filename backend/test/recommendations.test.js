const request = require('supertest');
const app = require('../src/app');

describe('Recommendations API', () => {
  test('analyzes CV text and returns ranked recommendations', async () => {
    const response = await request(app)
      .post('/api/v1/recommendations/analyze')
      .send({
        cvText: [
          'Machine Learning Engineer with 2 years experience building computer vision systems.',
          'Skills: Python, TensorFlow, PyTorch, FastAPI, Docker, Git, Linux, Azure.',
          'Built traffic sign detection using YOLO and deployed with FastAPI.',
        ].join(' '),
        track: 'Machine Learning / AI',
        topSkillsLimit: 12,
        roadmapMonths: 3,
        skillsPerMonth: 3,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.profileSummary.track).toBe('Machine Learning / AI');
    expect(Array.isArray(response.body.data.currentSkills)).toBe(true);
    expect(Array.isArray(response.body.data.skillGaps)).toBe(true);
    expect(response.body.data.learningRoadmap.length).toBeGreaterThan(0);
    expect(response.body.data.pipeline).toEqual(
      expect.objectContaining({ extractor: expect.any(String) })
    );
  });
});
