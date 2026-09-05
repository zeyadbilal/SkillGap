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

  '/recommendations/history': {
    get: {
      summary: 'List previous CV analyses',
      description:
        'Returns the authenticated user\'s past CV analyses, newest first, with summary metrics (track, match score, and skill counts). Requires a valid access token.',
      tags: ['Recommendations'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          required: false,
          description: 'Maximum number of entries to return (1-100, default 50).',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        },
      ],
      responses: {
        200: {
          description: 'List of previous analyses',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HistoryListResponse' },
            },
          },
        },
        401: {
          description: 'Missing or invalid token',
          content: { 'application/json': { schema: err('UNAUTHORIZED') } },
        },
      },
    },
  },

  '/recommendations/history/{id}': {
    get: {
      summary: 'Get a previous analysis by id',
      description:
        'Returns the full stored result of one of the authenticated user\'s previous analyses. Analyses owned by other users return 404.',
      tags: ['Recommendations'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'UUID of the stored analysis.',
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        200: {
          description: 'Full stored analysis result',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HistoryDetailResponse' },
            },
          },
        },
        401: {
          description: 'Missing or invalid token',
          content: { 'application/json': { schema: err('UNAUTHORIZED') } },
        },
        404: {
          description: 'Analysis not found or not owned by the user',
          content: { 'application/json': { schema: err('NOT_FOUND') } },
        },
      },
    },
  },
};

module.exports = { recommendationsPaths };