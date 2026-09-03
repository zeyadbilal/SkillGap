const userSchemas = {
  User: {
    type: 'object',
    description: 'Public user profile (sensitive fields are never exposed).',
    required: ['id', 'email', 'fullName', 'fieldOfStudy', 'graduationYear'],
    properties: {
      id: { type: 'string', format: 'uuid', description: 'Unique user identifier.' },
      email: { type: 'string', format: 'email' },
      fullName: { type: 'string' },
      fieldOfStudy: { type: 'string' },
      graduationYear: { type: 'integer', minimum: 2000 },
    },
  },

  Tokens: {
    type: 'object',
    description: 'Access and refresh JWT pair.',
    required: ['accessToken', 'refreshToken'],
    properties: {
      accessToken: {
        type: 'string',
        description: 'Short-lived access token used for authenticated requests (24h).',
      },
      refreshToken: {
        type: 'string',
        description: 'Longer-lived refresh token used to obtain new tokens (7d).',
      },
    },
  },
};

module.exports = { userSchemas };
