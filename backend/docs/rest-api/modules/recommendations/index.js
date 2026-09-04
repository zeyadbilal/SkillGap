const { recommendationsSchemas } = require('./schemas');

const err = (code) => ({
  $ref: '#/components/schemas/ErrorResponse',
  description: code,
});

const recommendationsPaths = {
  '/recommendations/analyze': {
    post: {
      summary: 'Analyze a CV and get skill-gap recommendations',
      description:
        'Extracts skills from a CV (uploaded file or raw text), infers a career track, and returns current skills, market skill gaps, and a 3-month learning roadmap. Requires a valid access token.',
      tags: ['Recommendations'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AnalyzeCvRequest' },
          },
          'multipart/form-data': {
            schema: { $ref: '#/components/schemas/AnalyzeCvRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'CV analyzed successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AnalyzeCvResponse' },
            },
          },
        },
        400: {
          description: 'Validation error, unsupported file type, or missing CV input',
          content: { 'application/json': { schema: err('VALIDATION_ERROR') } },
        },
        401: {
          description: 'Missing or invalid token',
          content: { 'application/json': { schema: err('UNAUTHORIZED') } },
        },
        413: {
          description: 'File exceeds 10MB limit',
          content: { 'application/json': { schema: err('FILE_TOO_LARGE') } },
        },
        422: {
          description: 'CV contained no extractable text or could not be parsed',
          content: { 'application/json': { schema: err('EMPTY_CV_TEXT') } },
        },
        502: {
          description: 'Model service returned an invalid response',
          content: { 'application/json': { schema: err('MODEL_BAD_RESPONSE') } },
        },
        503: {
          description: 'Model service is unavailable',
          content: { 'application/json': { schema: err('MODEL_UNAVAILABLE') } },
        },
      },
    },
  },
};

module.exports = { recommendationsPaths };