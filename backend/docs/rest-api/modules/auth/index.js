const { authSchemas } = require('./schemas');

const err = (code) => ({
  $ref: '#/components/schemas/ErrorResponse',
  description: code,
});

const authPaths = {
  '/auth/register': {
    post: {
      summary: 'Register a new user',
      description:
        'Creates a user account and returns the user profile alongside access/refresh tokens.',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RegisterRequest' },
          },
        },
      },
      responses: {
        201: {
          description: 'User registered successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthResponse' },
            },
          },
        },
        400: { description: 'Validation error', content: { 'application/json': { schema: err('VALIDATION_ERROR') } } },
        409: { description: 'Email already registered', content: { 'application/json': { schema: err('EMAIL_TAKEN') } } },
        429: { description: 'Too many requests (5 per minute)', content: { 'application/json': { schema: err('RATE_LIMITED') } } },
      },
    },
  },

  '/auth/login': {
    post: {
      summary: 'Log a user in',
      description: 'Authenticates a user by email and password, returning profile and tokens.',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthResponse' },
            },
          },
        },
        400: { description: 'Validation error', content: { 'application/json': { schema: err('VALIDATION_ERROR') } } },
        401: { description: 'Invalid credentials', content: { 'application/json': { schema: err('INVALID_CREDENTIALS') } } },
        429: { description: 'Too many requests (10 per minute)', content: { 'application/json': { schema: err('RATE_LIMITED') } } },
      },
    },
  },

  '/auth/refresh': {
    post: {
      summary: 'Refresh tokens',
      description:
        'Exchanges a refresh token for a new access/refresh pair. The existing refresh token is rotated (revoked).',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RefreshRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Tokens refreshed successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshResponse' },
            },
          },
        },
        400: { description: 'Validation error', content: { 'application/json': { schema: err('VALIDATION_ERROR') } } },
        401: { description: 'Invalid, revoked, or expired refresh token', content: { 'application/json': { schema: err('INVALID_REFRESH_TOKEN') } } },
        429: { description: 'Too many requests (100 per minute)', content: { 'application/json': { schema: err('RATE_LIMITED') } } },
      },
    },
  },

  '/auth/logout': {
    post: {
      summary: 'Log out a user',
      description: 'Revokes the provided refresh token, ending the session.',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RefreshRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Logout successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MessageResponse' },
            },
          },
        },
        400: { description: 'Validation error', content: { 'application/json': { schema: err('VALIDATION_ERROR') } } },
        429: { description: 'Too many requests (100 per minute)', content: { 'application/json': { schema: err('RATE_LIMITED') } } },
      },
    },
  },

  '/auth/me': {
    get: {
      summary: 'Get current user profile',
      description: 'Returns the profile of the authenticated user. Requires a valid access token.',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'User profile',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserResponse' },
            },
          },
        },
        401: { description: 'Missing or invalid token', content: { 'application/json': { schema: err('UNAUTHORIZED') } } },
        404: { description: 'User not found', content: { 'application/json': { schema: err('USER_NOT_FOUND') } } },
      },
    },
  },
};

module.exports = { authPaths };
