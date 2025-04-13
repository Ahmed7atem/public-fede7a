const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const { validate, schemas } = require('../middleware/validate');
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');

// Apply authentication to all routes
router.use(auth);

// Get all employees (admin only)
router.get('/', adminAuth, getAllEmployees);

// Get employee by ID (admin or self)
router.get('/:id', auth, getEmployeeById);

// Create new employee (admin only)
router.post('/', adminAuth, validate(schemas.employee), createEmployee);

// Update employee (admin only)
router.put('/:id', adminAuth, validate(schemas.employee), updateEmployee);

// Delete employee (admin only)
router.delete('/:id', adminAuth, deleteEmployee);

module.exports = router;