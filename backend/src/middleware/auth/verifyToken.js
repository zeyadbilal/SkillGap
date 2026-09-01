const tokenService = require('../../services/token/tokenService');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    error.errorCode = 'UNAUTHORIZED';
    return next(error);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = tokenService.verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    error.errorCode = 'UNAUTHORIZED';
    next(error);
  }
};

module.exports = verifyToken;
