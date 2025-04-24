const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const providerController = require('../controllers/providerController');

// GET /api/providers - Get all healthcare providers
router.get('/', auth, providerController.getAllProviders);

// GET /api/providers/search - Search healthcare providers with filters
router.get('/search', auth, providerController.searchProviders);

// GET /api/providers/:id - Get provider by ID
router.get('/:id', auth, providerController.getProviderById);

// Admin-only routes
// POST /api/providers - Add a new provider
router.post('/', auth, providerController.addProvider);

// PUT /api/providers/:id - Update a provider
router.put('/:id', auth, providerController.updateProvider);

module.exports = router; 