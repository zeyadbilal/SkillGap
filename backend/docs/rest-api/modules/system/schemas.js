const systemSchemas = {
  HealthResponse: {
    type: 'object',
    description: 'Health check response.',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', example: 'ok' },
        },
      },
    },
  },
};

module.exports = { systemSchemas };
