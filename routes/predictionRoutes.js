const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/roleCheck');
const { validate, schemas } = require('../middleware/validate');
const {
  getAllPredictions,
  getPredictionById,
  createPrediction,
  updatePrediction,
  deletePrediction
} = require('../controllers/predictionController');

// Get all predictions (admin only)
router.get('/', isAdmin, getAllPredictions);

// Get prediction by ID (admin or self)
router.get('/:id', (req, res, next) => {
  // Allow access if admin or if the prediction belongs to the requesting employee
  if (req.employee.role === 'admin' || req.params.id === req.employee.id) {
    return next();
  }
  res.status(403).json({ error: 'Access denied' });
}, getPredictionById);

// Create new prediction
router.post('/', validate(schemas.prediction), createPrediction);

// Update prediction (admin only)
router.put('/:id', isAdmin, validate(schemas.prediction), updatePrediction);

// Delete prediction (admin only)
router.delete('/:id', isAdmin, deletePrediction);

module.exports = router; 