const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const policyController = require('../controllers/policyController');

// GET /api/policy - Get policy details for the logged-in user
router.get('/', auth, policyController.getPolicyDetails);

// GET /api/policy/:id - Get policy by ID
router.get('/:id', auth, policyController.getPolicyById);

// GET /api/policy/:policyId/documents - Get all policy documents
router.get('/:policyId/documents', auth, policyController.getPolicyDocuments);

// GET /api/policy/:policyId/documents/:type - Get specific document type
router.get('/:policyId/documents/:type', auth, policyController.getPolicyDocumentByType);

// Legacy endpoint - GET /api/policy/documents - List all policy PDFs
router.get('/documents', auth, policyController.getDocuments);

module.exports = router;