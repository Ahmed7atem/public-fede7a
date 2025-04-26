const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');

// @route   GET /api/employees
// @desc    Get all employees
// @access  Public
router.get('/', getAllEmployees);

// @route   GET /api/employees/:id
// @desc    Get employee by ID
// @access  Public
router.get('/:id', getEmployeeById);

// @route   POST /api/employees
// @desc    Create a new employee
// @access  Private/Admin
router.post('/', createEmployee);

// @route   PUT /api/employees/:id
// @desc    Update an employee
// @access  Private/Admin
router.put('/:id', updateEmployee);

// @route   DELETE /api/employees/:id
// @desc    Delete an employee
// @access  Private/Admin
router.delete('/:id', deleteEmployee);

module.exports = router; 