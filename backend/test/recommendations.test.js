const request = require('supertest');
const fs = require('fs');
const os = require('os');
const tokenService = require('../src/services/token/tokenService');

const mockAnalyzeModel = jest.fn();

jest.mock('../src/services/model/modelClient', () => ({
  analyze: (...args) => mockAnalyzeModel(...args),
}));

const app = require('../src/app');

const authorization = (fieldOfStudy = 'Full-Stack Development') =>
  `Bearer ${tokenService.signAccessToken({
    sub: 'recommendation-test-user',
    email: 'recommendation-test@example.com',
    fieldOfStudy,
  })}`;

const tempUploads = () => fs.readdirSync(os.tmpdir())
  .filter((name) => name.startsWith('skillgap-cv-'));

const waitForCleanup = async (previousFiles) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const leaked = tempUploads().filter((name) => !previousFiles.has(name));
    if (!leaked.length) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

describe('Recommendations API', () => {
  afterEach(() => {
    mockAnalyzeModel.mockReset();
  });

  test('analyzes CV text and returns ranked recommendations', async () => {
    mockAnalyzeModel.mockResolvedValueOnce({
      profileSummary: { track: 'Machine Learning / AI' },
      currentSkills: [{ skill: 'python' }],
      skillGaps: [{ skill: 'sql' }],
      learningRoadmap: [{ month: 1, skills: ['sql'] }],
      pipeline: { extractor: 'python-spacy' },
    });

    const requestBody = {
      cvText: [
        'Machine Learning Engineer with 2 years experience building computer vision systems.',
        'Skills: Python, TensorFlow, PyTorch, FastAPI, Docker, Git, Linux, Azure.',
        'Built traffic sign detection using YOLO and deployed with FastAPI.',
      ].join(' '),
    };

    const response = await request(app)
      .post('/recommendations/analyze')
      .set('Authorization', authorization('Machine Learning / AI'))
      .send(requestBody)
      .expect(200);

    expect(mockAnalyzeModel).toHaveBeenCalledWith({
      ...requestBody,
      track: 'Machine Learning / AI',
    });
    expect(response.body.success).toBe(true);
    expect(response.body.data.profileSummary.track).toBe('Machine Learning / AI');
    expect(Array.isArray(response.body.data.currentSkills)).toBe(true);
    expect(Array.isArray(response.body.data.skillGaps)).toBe(true);
    expect(response.body.data.learningRoadmap.length).toBeGreaterThan(0);
    expect(response.body.data.pipeline).toEqual(
      expect.objectContaining({ extractor: expect.any(String) })
    );
  });

  test('extracts a TXT upload, derives the track, and removes the temp file', async () => {
    const before = new Set(tempUploads());
    mockAnalyzeModel.mockResolvedValueOnce({
      profileSummary: { track: 'Full-Stack Development' },
      currentSkills: [],
      skillGaps: [],
      learningRoadmap: [],
      pipeline: { extractor: 'python-spacy' },
    });

    await request(app)
      .post('/recommendations/analyze')
      .set('Authorization', authorization())
      .attach(
        'file',
        Buffer.from('Backend engineer with Node.js, Express, PostgreSQL, Redis, Docker and Linux.'),
        'resume.txt'
      )
      .expect(200);

    expect(mockAnalyzeModel).toHaveBeenCalledWith({
      cvText: 'Backend engineer with Node.js, Express, PostgreSQL, Redis, Docker and Linux.',
      track: 'Full-Stack Development',
    });
    await waitForCleanup(before);
    expect(tempUploads().filter((name) => !before.has(name))).toEqual([]);
  });

  test('rejects a file with a forged PDF extension and cleans it up', async () => {
    const before = new Set(tempUploads());

    const response = await request(app)
      .post('/recommendations/analyze')
      .set('Authorization', authorization())
      .attach('file', Buffer.from('This is not a PDF document.'), 'resume.pdf')
      .expect(400);

    expect(response.body.errorCode).toBe('INVALID_FILE_TYPE');
    expect(mockAnalyzeModel).not.toHaveBeenCalled();
    await waitForCleanup(before);
    expect(tempUploads().filter((name) => !before.has(name))).toEqual([]);
  });

  test('requires either cvText or a file', async () => {
    const response = await request(app)
      .post('/recommendations/analyze')
      .set('Authorization', authorization())
      .send({})
      .expect(400);

    expect(response.body.errorCode).toBe('REQUIRED_FIELD_MISSING');
    expect(mockAnalyzeModel).not.toHaveBeenCalled();
  });

  test.each(['topSkillsLimit', 'roadmapMonths', 'skillsPerMonth'])(
    'rejects the removed %s option',
    async (removedOption) => {
      const response = await request(app)
        .post('/recommendations/analyze')
        .set('Authorization', authorization())
        .send({
          cvText: 'Backend engineer with enough production experience for CV analysis.',
          [removedOption]: 3,
        })
        .expect(400);

      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
      expect(mockAnalyzeModel).not.toHaveBeenCalled();
    }
  );

  test('rejects a client-supplied track and cleans the uploaded file', async () => {
    const before = new Set(tempUploads());

    const response = await request(app)
      .post('/recommendations/analyze')
      .set('Authorization', authorization())
      .field('track', 'Backend Development')
      .attach(
        'file',
        Buffer.from('Backend engineer with Node.js, Express, PostgreSQL, Redis and Docker.'),
        'resume.txt'
      )
      .expect(400);

    expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    expect(mockAnalyzeModel).not.toHaveBeenCalled();
    await waitForCleanup(before);
    expect(tempUploads().filter((name) => !before.has(name))).toEqual([]);
  });

  test('rejects an empty extracted CV and cleans the temp file', async () => {
    const before = new Set(tempUploads());

    const response = await request(app)
      .post('/recommendations/analyze')
      .set('Authorization', authorization())
      .attach('file', Buffer.from('   \n\t  '), 'resume.txt')
      .expect(422);

    expect(response.body.errorCode).toBe('CV_TEXT_EMPTY');
    expect(mockAnalyzeModel).not.toHaveBeenCalled();
    await waitForCleanup(before);
    expect(tempUploads().filter((name) => !before.has(name))).toEqual([]);
  });

  test('requires authentication before accepting CV input', async () => {
    await request(app)
      .post('/recommendations/analyze')
      .send({ cvText: 'Backend engineer with enough experience for model analysis.' })
      .expect(401);

    expect(mockAnalyzeModel).not.toHaveBeenCalled();
  });

  test('leaves the track to the model when fieldOfStudy is not an available track', async () => {
    mockAnalyzeModel.mockResolvedValueOnce({
      profileSummary: { track: 'Machine Learning / AI' },
      currentSkills: [],
      skillGaps: [],
      learningRoadmap: [],
      pipeline: { extractor: 'python-spacy' },
    });
    const cvText = 'Product manager with analytics and software delivery experience.';

    await request(app)
      .post('/recommendations/analyze')
      .set('Authorization', authorization('Product Management'))
      .send({ cvText })
      .expect(200);

    expect(mockAnalyzeModel).toHaveBeenCalledWith({ cvText });
  });
});
