const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validate');
const {
  getHealthData,
  addHealthData,
  updateHealthData,
  deleteHealthData
} = require('../controllers/healthDataController');

// Get health data
router.get('/', getHealthData);

// Add health data
router.post('/', validate(schemas.healthData), addHealthData);

// Update health data
router.put('/:id', validate(schemas.healthData), updateHealthData);

// Delete health data
router.delete('/:id', deleteHealthData);

module.exports = router;