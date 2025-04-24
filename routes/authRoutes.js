const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { login, register } = require('../controllers/authController');

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/verify', auth, (req, res) => res.json({ valid: true }));

module.exports = router;