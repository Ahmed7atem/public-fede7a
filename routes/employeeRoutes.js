const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');

// Apply authentication to all routes
router.use(auth);

// Admin routes
router.get('/', adminAuth, getAllEmployees);
router.put('/:id', adminAuth, updateEmployee);
router.delete('/:id', adminAuth, deleteEmployee);

// Employee routes
router.get('/:id', getEmployeeById);

module.exports = router;