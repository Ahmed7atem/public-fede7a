const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  getAllProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider
} = require('../controllers/providerController');

router.use(auth);

// Admin routes
router.post('/', adminAuth, createProvider);
router.put('/:id', adminAuth, updateProvider);
router.delete('/:id', adminAuth, deleteProvider);

// Employee routes
router.get('/', getAllProviders);
router.get('/:id', getProviderById);

module.exports = router; 