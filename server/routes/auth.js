const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { changePassword } = require('../controllers/changePasswordController');
const { auth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { validateRequired } = require('../middleware/validator');

router.post('/login', loginLimiter, validateRequired(['username', 'password']), authController.login);
router.post('/logout', authController.logout);
router.get('/me', auth, authController.me);
router.post('/change-password', auth, changePassword);

module.exports = router;
