const fs = require('fs');
const os = require('os');
const path = require('path');
const { randomUUID } = require('crypto');
const multer = require('multer');

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt']);

function requestError(message, errorCode, statusCode) {
  const error = new Error(message);
  error.errorCode = errorCode;
  error.statusCode = statusCode;
  return error;
}

const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `skillgap-cv-${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
    fields: 1,
    fieldSize: 256 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return callback(requestError('Only PDF, DOCX, and TXT files are supported', 'INVALID_FILE_TYPE', 400));
    }
    return callback(null, true);
  },
});

function uploadCv(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(requestError('File exceeds 10MB limit', 'FILE_TOO_LARGE', 413));
    }
    if (error instanceof multer.MulterError) {
      return next(requestError(error.message, 'INVALID_FILE_UPLOAD', 400));
    }
    return next(error);
  });
}

function cleanupUploadedCv(req, res, next) {
  if (!req.file || !req.file.path) return next();

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    fs.unlink(req.file.path, () => {});
  };

  req.cleanupUploadedCv = cleanup;
  res.once('finish', cleanup);
  res.once('close', cleanup);
  return next();
}

function requireCvInput(req, res, next) {
  if (req.file || (typeof req.body.cvText === 'string' && req.body.cvText.trim())) {
    return next();
  }
  return next(requestError('Either a CV file or cvText is required', 'REQUIRED_FIELD_MISSING', 400));
}

module.exports = {
  cleanupUploadedCv,
  requireCvInput,
  uploadCv,
};
