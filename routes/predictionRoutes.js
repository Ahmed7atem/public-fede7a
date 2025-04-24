const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getAllPredictions,
  getPredictionById,
  createPrediction,
  updatePrediction
} = require('../controllers/predictionController');

router.use(auth);

router.get('/', getAllPredictions);
router.get('/:id', getPredictionById);
router.post('/', createPrediction);
router.put('/:id', updatePrediction);

module.exports = router; 