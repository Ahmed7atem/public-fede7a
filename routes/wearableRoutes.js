const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const {
  getWearableData,
  createWearableData,
  getAggregatedData,
  updateWearableData,
  deleteWearableData
} = require('../controllers/wearableController');

// Apply authentication to all routes
router.use(authenticateToken);

// Get wearable data
router.get('/', getWearableData);

// Create wearable data
router.post('/', validate(schemas.wearableData), createWearableData);

// Get aggregated wearable data
router.get('/aggregated', getAggregatedData);

// Update wearable data
router.put('/', validate(schemas.wearableData), updateWearableData);

// Delete wearable data
router.delete('/', deleteWearableData);

module.exports = router; 