const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const {
  login,
  register,
  getProfile,
  updateProfile
} = require('../controllers/authController');

// Public routes
router.post('/login', validate(schemas.login), login);
router.post('/register', validate(schemas.register), register);

// Protected routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, validate(schemas.updateProfile), updateProfile);

module.exports = router;