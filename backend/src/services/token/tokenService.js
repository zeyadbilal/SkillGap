const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const config = require('../../config');

// Create access token (expires in 24 hours)
const signAccessToken = (payload) =>
  jwt.sign({ ...payload, tokenType: 'access' }, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
    jwtid: randomUUID(),
  });

// Create refresh token (expires in 7 days)
const signRefreshToken = (payload) =>
  jwt.sign({ ...payload, tokenType: 'refresh' }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
    jwtid: randomUUID(),
  });

// Check token is valid and has correct type
const verifyTokenType = (token, expectedType) => {
  const payload = jwt.verify(token, config.jwt.secret);
  if (payload.tokenType !== expectedType) {
    throw new Error(`Expected a ${expectedType} token`);
  }
  return payload;
};

const verifyAccessToken = (token) => verifyTokenType(token, 'access');
const verifyRefreshToken = (token) => verifyTokenType(token, 'refresh');

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
