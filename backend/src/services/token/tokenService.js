const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const config = require('../../config');

const signAccessToken = (payload) =>
  jwt.sign({ ...payload, tokenType: 'access' }, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
    jwtid: randomUUID(),
  });

const signRefreshToken = (payload) =>
  jwt.sign({ ...payload, tokenType: 'refresh' }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
    jwtid: randomUUID(),
  });

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
