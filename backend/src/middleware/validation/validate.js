const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    const err = new Error(message);
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    return next(err);
  }
  req.body = value;
  next();
};

module.exports = validate;
