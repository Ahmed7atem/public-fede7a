const express = require('express');
const router = express.Router();
const { Claim2023, Claim2024 } = require('../../models/schemas');

// GET /api/claims/2023 (using model "claims2023" (collection "claims2023"))
router.get('/2023', async (req, res) => {
  try {
    const claims = await Claim2023.find().lean();
    res.json(claims);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching 2023 claims (claims2023)', error: err.message });
  }
});

// GET /api/claims/2024 (using model "claims2024" (collection "claims2024"))
router.get('/2024', async (req, res) => {
  try {
    const claims = await Claim2024.find().lean();
    res.json(claims);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching 2024 claims (claims2024)', error: err.message });
  }
});

module.exports = router; 