const express = require('express');
const authRouter = require('./auth');

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
     success: true, 
     data: { status: 'ok' } 
    });
});

router.use('/auth', authRouter);

module.exports = router;
