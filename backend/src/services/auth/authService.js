const bcrypt = require('bcryptjs');
const config = require('../../config');
const tokenService = require('../token/tokenService');
const logger = require('../../utils/logger');
const User = require('../../models/User');
const revokedRefreshTokens = new Set();

/** Convert a user to public data (hides sensitive fields). */
const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  fieldOfStudy: user.fieldOfStudy,
  graduationYear: user.graduationYear,
});

/** Generate access and refresh tokens for a user. */
const generateTokens = (user) => {
  const payload = { sub: user.id, email: user.email };
  return {
    accessToken: tokenService.signAccessToken(payload),
    refreshToken: tokenService.signRefreshToken(payload),
  };
};

/**
 * Register a new user.
 * @param {{email: string, password: string, fullName?: string, fieldOfStudy?: string, graduationYear?: number}} input
 * @returns {Promise<{user: object, tokens: {accessToken: string, refreshToken: string}}>}
 * @throws {Error} statusCode 409 if email already registered
 */
const register = async ({ email, password, fullName, fieldOfStudy, graduationYear }) => {
  const startedAt = Date.now();
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    error.errorCode = 'EMAIL_TAKEN';
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const user = await User.create({
    email,
    passwordHash,
    fullName,
    fieldOfStudy,
    graduationYear,
  });

  const tokens = generateTokens(user);
  logger.info('User registered', { userId: user.id, email, hashingTimeMs: Date.now() - startedAt });
  return { user: toPublicUser(user), tokens };
};

/**
 * Log a user in by email and password.
 * @param {{email: string, password: string}} input
 * @returns {Promise<{user: object, tokens: {accessToken: string, refreshToken: string}}>}
 * @throws {Error} statusCode 401 on invalid credentials
 */
const login = async ({ email, password }) => {
  const startedAt = Date.now();
  const user = await User.findOne({ where: { email } });
  if (!user) {
    logger.warn('Login failed: unknown user', { email });
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    error.errorCode = 'INVALID_CREDENTIALS';
    throw error;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    logger.warn('Login failed: wrong password', { email, userId: user.id });
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    error.errorCode = 'INVALID_CREDENTIALS';
    throw error;
  }

  const tokens = generateTokens(user);
  logger.info('User logged in', {
    userId: user.id,
    email: user.email,
    verifyTimeMs: Date.now() - startedAt,
  });
  return { user: toPublicUser(user), tokens };
};

/**
 * Exchange a refresh token for new tokens (rotates the refresh token).
 * @param {string} refreshToken
 * @returns {Promise<{accessToken: string, refreshToken: string, expiresIn: number}>}
 * @throws {Error} statusCode 401 on invalid, revoked, or expired token
 */
const refresh = async (refreshToken) => {
  const startedAt = Date.now();
  if (revokedRefreshTokens.has(refreshToken)) {
    logger.warn('Refresh failed: token already revoked', { tokenPrefix: refreshToken.slice(0, 10) });
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    error.errorCode = 'INVALID_REFRESH_TOKEN';
    throw error;
  }

  let payload;
  try {
    payload = tokenService.verifyRefreshToken(refreshToken);
  } catch (err) {
    logger.warn('Refresh failed: invalid token', { error: err.message });
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    error.errorCode = 'INVALID_REFRESH_TOKEN';
    throw error;
  }

  const user = await User.findByPk(payload.sub);
  if (!user) {
    logger.warn('Refresh failed: user not found', { userId: payload.sub });
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    error.errorCode = 'INVALID_REFRESH_TOKEN';
    throw error;
  }

  revokedRefreshTokens.add(refreshToken);
  const tokens = generateTokens(user);
  logger.info('Tokens refreshed', {
    userId: user.id,
    email: user.email,
    durationMs: Date.now() - startedAt,
  });
  return { ...tokens, expiresIn: 86400 };
};

/** 
 * Revoke a refresh token. 
 * @param {string} refreshToken 
 */
const logout = (refreshToken) => {
  logger.info('User logged out', { tokenPrefix: refreshToken.slice(0, 10) });
  revokedRefreshTokens.add(refreshToken);
};

/**
 * Get the public profile of a user.
 * @param {string} userId
 * @returns {Promise<object>}
 * @throws {Error} statusCode 404 if user not found
 */
const getMe = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    logger.warn('getMe failed: user not found', { userId });
    const error = new Error('User not found');
    error.statusCode = 404;
    error.errorCode = 'USER_NOT_FOUND';
    throw error;
  }
  logger.info('User profile fetched', { userId: user.id, email: user.email });
  return toPublicUser(user);
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
