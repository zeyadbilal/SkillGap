const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  const message =
    err.statusCode ? err.message : 'Internal server error';

  if (!err.statusCode) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    errorCode,
  });
};

module.exports = errorHandler;
