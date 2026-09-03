const express = require('express');
const { analyze, tracks } = require('../controllers/recommendationController');
const validate = require('../middleware/validation/validate');
const { analyzeSchema } = require('../middleware/validation/recommendationSchemas');

const router = express.Router();

router.get('/tracks', tracks);
router.post('/analyze', validate(analyzeSchema), analyze);

module.exports = router;
