const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  createFeedback,
  getFeedback,
  updateFeedback,
  deleteFeedback
} = require('../controllers/feedbackController');

// Get feedback
router.get('/', auth, getFeedback);

// Create feedback
router.post('/', auth, createFeedback);

// Update feedback (admin only)
router.put('/:id', adminAuth, updateFeedback);

// Delete feedback (admin only)
router.delete('/:id', adminAuth, deleteFeedback);

module.exports = router; 