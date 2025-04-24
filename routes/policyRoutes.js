const express = require('express');
const router = express.Router();
const PolicyDocument = require('../models/PolicyDocument');
const auth = require('../middleware/auth');

// GET /api/policy/documents - List all policy PDFs
router.get('/documents', auth, async (req, res) => {
  try {
    const documents = await PolicyDocument.find({ isActive: true });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policy documents', error: error.message });
  }
});

module.exports = router; 