const { systemSchemas } = require('./schemas');

const systemPaths = {
  '/health': {
    get: {
      summary: 'Health check',
      description: 'Returns the health status of the server.',
      tags: ['System'],
      responses: {
        200: {
          description: 'Server is healthy',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HealthResponse' },
            },
          },
        },
      },
    },
  },
};

module.exports = { systemPaths };
