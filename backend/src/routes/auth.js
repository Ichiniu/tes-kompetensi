const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/captcha', authController.generateCaptcha);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticateToken, authController.me);
router.put('/me', authenticateToken, authController.updateMe);

module.exports = router;
