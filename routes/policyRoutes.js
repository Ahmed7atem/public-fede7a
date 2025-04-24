const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy
} = require('../controllers/policyController');

router.use(auth);

// Admin routes
router.post('/', adminAuth, createPolicy);
router.put('/:id', adminAuth, updatePolicy);
router.delete('/:id', adminAuth, deletePolicy);

// Employee routes
router.get('/', getAllPolicies);
router.get('/:id', getPolicyById);

module.exports = router;