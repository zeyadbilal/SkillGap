const { fieldsOfStudy } = require('../../../../src/middleware/validation/authSchemas');

const authSchemas = {
  RegisterRequest: {
    type: 'object',
    description: 'Request body for registering a new user.',
    required: ['email', 'password', 'fullName', 'fieldOfStudy', 'graduationYear'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'user@example.com',
      },
      password: {
        type: 'string',
        minLength: 8,
        description: 'Must contain at least one lowercase, one uppercase, and one digit.',
        example: 'StrongP4ss',
      },
      fullName: {
        type: 'string',
        minLength: 2,
        maxLength: 255,
        example: 'John Doe',
      },
      fieldOfStudy: {
        type: 'string',
        enum: fieldsOfStudy,
        example: fieldsOfStudy[0],
      },
      graduationYear: {
        type: 'integer',
        minimum: 2000,
        example: 2024,
      },
    },
  },

  LoginRequest: {
    type: 'object',
    description: 'Request body for logging a user in.',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'user@example.com' },
      password: { type: 'string', example: 'StrongP4ss' },
    },
  },

  RefreshRequest: {
    type: 'object',
    description: 'Request body for refreshing tokens.',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string', description: 'The refresh token to exchange for new tokens.' },
    },
  },

  AuthResponse: {
    type: 'object',
    description: 'Successful response for user registration and login.',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        required: ['user', 'tokens'],
        properties: {
          user: { $ref: '#/components/schemas/User' },
          tokens: { $ref: '#/components/schemas/Tokens' },
        },
      },
    },
  },

  RefreshResponse: {
    type: 'object',
    description: 'Successful response for token refresh (rotates the refresh token).',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        required: ['accessToken', 'refreshToken', 'expiresIn'],
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          expiresIn: {
            type: 'integer',
            description: 'Access token lifetime in seconds.',
            example: 86400,
          },
        },
      },
    },
  },

  UserResponse: {
    type: 'object',
    description: 'Successful response for the current user profile.',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      data: { $ref: '#/components/schemas/User' },
    },
  },
};

module.exports = { authSchemas };
