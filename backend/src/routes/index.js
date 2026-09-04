const express = require('express');
const authRouter = require('./auth');
const recommendationsRouter = require('./recommendations');

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
     success: true, 
     data: { status: 'ok' } 
    });
});

router.use('/auth', authRouter);
router.use('/api/v1/recommendations', recommendationsRouter);

module.exports = router;
