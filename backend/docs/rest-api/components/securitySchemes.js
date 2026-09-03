const securitySchemes = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Access token obtained from login or register. Send as: `Bearer <accessToken>`.',
  },
};

module.exports = { securitySchemes };
