const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { validate, schemas } = require('../middleware/validate');
const {
  getAllPredictions,
  getPredictionById,
  createPrediction,
  updatePrediction,
  deletePrediction
} = require('../controllers/predictionController');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all predictions (admin only)
router.get('/', isAdmin, getAllPredictions);

// Get prediction by ID (admin or self)
router.get('/:id', isAdmin, getPredictionById);

// Create new prediction
router.post('/', validate(schemas.prediction), createPrediction);

// Update prediction (admin only)
router.put('/:id', isAdmin, validate(schemas.prediction), updatePrediction);

// Delete prediction (admin only)
router.delete('/:id', isAdmin, deletePrediction);

module.exports = router; 