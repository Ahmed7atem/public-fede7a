const express = require('express');
const router = express.Router();
const {
  getAllProviders,
  getProviderById,
  getProvidersByType,
  getProvidersBySpecialty,
  createProvider,
  addReview,
  getProviderReviews,
  getCategories,
  getSpecializations
} = require('../controllers/providerController');

// @route   GET /api/providers
// @desc    Get all providers with optional filtering
// @access  Public
router.get('/', getAllProviders);

// @route   GET /api/providers/type/:type
// @desc    Get providers by type (Hospital, Doctor, Lab)
// @access  Public
router.get('/type/:type', getProvidersByType);

// @route   GET /api/providers/:id
// @desc    Get provider by ID
// @access  Public
router.get('/:id', getProviderById);

// @route   GET /api/providers/specialty/:specialty
// @desc    Get providers by specialty
// @access  Public
router.get('/specialty/:specialty', getProvidersBySpecialty);

// @route   POST /api/providers
// @desc    Create a new provider
// @access  Private/Admin
router.post('/', createProvider);

// @route   POST /api/providers/:id/reviews
// @desc    Add review for a provider
// @access  Private
router.post('/:id/reviews', addReview);

// @route   GET /api/providers/:id/reviews
// @desc    Get provider reviews
// @access  Public
router.get('/:id/reviews', getProviderReviews);

// @route   GET /api/providers/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', getCategories);

// @route   GET /api/providers/specializations
// @desc    Get all specializations
// @access  Public
router.get('/specializations', getSpecializations);

module.exports = router; 