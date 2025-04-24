const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const policyController = require('../controllers/policyController');

// GET /api/policy/documents - List all policy PDFs
router.get('/documents', auth, policyController.getDocuments);

module.exports = router;