const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const {
  getDashboardStats,
  getEmployeeStats,
  getSystemHealth
} = require('../controllers/adminController');

// Apply authentication and admin role check to all routes
router.use(authenticateToken, isAdmin);

// Dashboard statistics
router.get('/dashboard', getDashboardStats);

// Employee statistics
router.get('/employee/:id', getEmployeeStats);

// System health check
router.get('/system-health', getSystemHealth);

module.exports = router;