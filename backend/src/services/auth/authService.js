const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');
const tokenService = require('../token/tokenService');
const userStore = require('./userStore');

const revokedRefreshTokens = new Set();

const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  fieldOfStudy: user.fieldOfStudy,
  graduationYear: user.graduationYear,
});

const generateTokens = (user) => {
  const payload = { sub: user.id, email: user.email };
  return {
    accessToken: tokenService.signAccessToken(payload),
    refreshToken: tokenService.signRefreshToken(payload),
  };
};

const register = async ({ email, password, fullName, fieldOfStudy, graduationYear }) => {
  const existing = userStore.findByEmail(email);
  if (existing) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    error.errorCode = 'EMAIL_TAKEN';
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const user = {
    id: uuidv4(),
    email,
    passwordHash: hashedPassword,
    fullName,
    fieldOfStudy,
    graduationYear,
    createdAt: new Date().toISOString(),
  };

  const saved = userStore.save(user);
  const tokens = generateTokens(saved);
  return { user: toPublicUser(saved), tokens };
};

const login = async ({ email, password }) => {
  const user = userStore.findByEmail(email);
  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    error.errorCode = 'INVALID_CREDENTIALS';
    throw error;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    error.errorCode = 'INVALID_CREDENTIALS';
    throw error;
  }

  const tokens = generateTokens(user);
  return { user: toPublicUser(user), tokens };
};

const refresh = async (refreshToken) => {
  if (revokedRefreshTokens.has(refreshToken)) {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    error.errorCode = 'INVALID_REFRESH_TOKEN';
    throw error;
  }

  let payload;
  try {
    payload = tokenService.verifyRefreshToken(refreshToken);
  } catch (err) {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    error.errorCode = 'INVALID_REFRESH_TOKEN';
    throw error;
  }

  const user = userStore.findById(payload.sub);
  if (!user) {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    error.errorCode = 'INVALID_REFRESH_TOKEN';
    throw error;
  }

  revokedRefreshTokens.add(refreshToken);
  const tokens = generateTokens(user);
  return { ...tokens, expiresIn: 86400 };
};

const logout = (refreshToken) => {
  revokedRefreshTokens.add(refreshToken);
};

const getMe = (userId) => {
  const user = userStore.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.errorCode = 'USER_NOT_FOUND';
    throw error;
  }
  return toPublicUser(user);
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
