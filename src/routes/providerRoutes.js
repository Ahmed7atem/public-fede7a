const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getAllProviders,
  getProviderById,
  getProvidersByType,
  getProvidersBySpecialty,
  createProvider,
  addReview,
  getProviderReviews,
  getCategories,
  getSpecializations,
  searchProviders
} = require('../controllers/providerController');

// @route   GET /api/providers
// @desc    Get all providers with optional filtering
// @access  Private/Admin
router.get('/', protect, admin, getAllProviders);

// @route   GET /api/providers/type/:type
// @desc    Get providers by type (Hospital, Doctor, Lab)
// @access  Private/Admin
router.get('/type/:type', protect, admin, getProvidersByType);

// @route   GET /api/providers/:id
// @desc    Get provider by ID
// @access  Private/Admin
router.get('/:id', protect, admin, getProviderById);

// @route   GET /api/providers/specialty/:specialty
// @desc    Get providers by specialty
// @access  Private/Admin
router.get('/specialty/:specialty', protect, admin, getProvidersBySpecialty);

// @route   POST /api/providers
// @desc    Create a new provider
// @access  Private/Admin
router.post('/', protect, admin, createProvider);

// @route   POST /api/providers/:id/reviews
// @desc    Add review for a provider
// @access  Private
router.post('/:id/reviews', protect, addReview);

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

// @route   POST /api/providers/search
// @desc    Search providers with various filters
// @access  Public
router.post('/search', searchProviders);

module.exports = router; 