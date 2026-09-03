const { ERROR_CODES } = require('../../constants');

const commonSchemas = {
  ErrorResponse: {
    type: 'object',
    description: 'Standard error response body returned for any failed request.',
    required: ['success', 'error', 'errorCode'],
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'string',
        description: 'Human-readable error message.',
      },
      errorCode: {
        type: 'string',
        description: 'Machine-readable error code.',
        enum: ERROR_CODES,
      },
    },
  },

  MessageResponse: {
    type: 'object',
    description: 'Generic success response containing a message.',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Operation successful' },
        },
      },
    },
  },
};

module.exports = { commonSchemas };
