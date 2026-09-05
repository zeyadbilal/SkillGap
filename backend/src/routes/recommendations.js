const express = require('express');
const verifyToken = require('../middleware/auth/verifyToken');
const validate = require('../middleware/validation/validate');
const {
  cleanupUploadedCv,
  requireCvInput,
  uploadCv,
} = require('../middleware/cvUpload');
const { analyzeCvSchema } = require('../middleware/validation/recommendationSchemas');
const { analyzeCv } = require('../controllers/recommendationController');
const {
  listHistory,
  getHistoryDetail,
} = require('../controllers/historyController');

const router = express.Router();

router.post(
  '/analyze',
  verifyToken,
  uploadCv,
  cleanupUploadedCv,
  validate(analyzeCvSchema),
  requireCvInput,
  analyzeCv
);

router.get('/history', verifyToken, listHistory);

router.get('/history/:id', verifyToken, getHistoryDetail);

module.exports = router;
