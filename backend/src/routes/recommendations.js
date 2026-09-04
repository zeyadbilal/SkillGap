const express = require('express');
const validate = require('../middleware/validation/validate');
const { analyzeCvSchema } = require('../middleware/validation/recommendationSchemas');
const { analyzeCv } = require('../controllers/recommendationController');

const router = express.Router();

router.post('/analyze', validate(analyzeCvSchema), analyzeCv);

module.exports = router;
