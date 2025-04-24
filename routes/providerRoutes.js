const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');
const auth = require('../middleware/auth');

// GET /api/providers - List providers with filters
router.get('/', auth, async (req, res) => {
  try {
    const { specialty, city, state, insurance } = req.query;
    let query = { isActive: true };
    
    if (specialty) {
      query.specialty = specialty;
    }
    
    if (city) {
      query['address.city'] = city;
    }
    
    if (state) {
      query['address.state'] = state;
    }
    
    if (insurance) {
      query.insuranceAccepted = insurance;
    }
    
    const providers = await Provider.find(query);
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching providers', error: error.message });
  }
});

module.exports = router; 