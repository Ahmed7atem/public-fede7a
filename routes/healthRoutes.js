const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const {
  getHealthData,
  createHealthData,
  updateHealthData,
  deleteHealthData
} = require('../controllers/healthController');

// Apply authentication to all routes
router.use(authenticateToken);

// Get health data
router.get('/', getHealthData);

// Create health data
router.post('/', validate(schemas.healthData), createHealthData);

// Update health data
router.put('/', validate(schemas.healthData), updateHealthData);

// Delete health data
router.delete('/', deleteHealthData);

module.exports = router; 