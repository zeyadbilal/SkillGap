const authParameters = {
  BearerAuthHeader: {
    name: 'Authorization',
    in: 'header',
    required: true,
    description: 'Bearer access token obtained from login or register.',
    schema: { type: 'string', example: 'Bearer <accessToken>' },
  },
};

module.exports = { authParameters };
