jest.mock('axios');

const axios = require('axios');

describe('modelClient', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('posts CV text and optional track and returns the model result', async () => {
    const modelResult = {
      profileSummary: { track: 'Backend Development' },
      currentSkills: [],
      skillGaps: [],
      learningRoadmap: [],
      generatedAt: '2026-09-05T00:00:00.000Z',
      pipeline: { extractor: 'python-spacy' },
    };
    axios.post.mockResolvedValue({ data: modelResult });
    const { analyze } = require('../src/services/model/modelClient');
    const input = {
      cvText: 'A sufficiently long CV body for model analysis.',
      track: 'Backend Development',
    };

    await expect(analyze(input)).resolves.toEqual(modelResult);
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:5001/analyze',
      input,
      expect.objectContaining({ timeout: expect.any(Number) })
    );
  });

  test('maps a network failure to MODEL_UNAVAILABLE', async () => {
    axios.post.mockRejectedValue(Object.assign(new Error('connect ECONNREFUSED'), { isAxiosError: true }));
    const { analyze } = require('../src/services/model/modelClient');

    await expect(analyze({ cvText: 'A sufficiently long CV body.' })).rejects.toMatchObject({
      statusCode: 503,
      errorCode: 'MODEL_UNAVAILABLE',
    });
  });
});