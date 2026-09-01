const express = require('express');
const { register, login, refresh, logout, me } = require('../controllers/auth/authController');
const { registerSchema, loginSchema, refreshSchema } = require('../middleware/validation/authSchemas');
const validate = require('../middleware/validation/validate');
const verifyToken = require('../middleware/auth/verifyToken');
const { registerLimiter, loginLimiter, publicLimiter } = require('../middleware/auth/rateLimiter');

const router = express.Router();

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', publicLimiter, validate(refreshSchema), refresh);
router.post('/logout', publicLimiter, validate(refreshSchema), logout);
router.get('/me', verifyToken, me);

module.exports = router;
