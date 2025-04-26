const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const employeeController = require('../controllers/employeeController');

// Apply authentication to all routes
router.use(auth);

// Admin routes
router.get('/', adminAuth, employeeController.getAllEmployees);
router.put('/:id', adminAuth, employeeController.updateEmployee);
router.delete('/:id', adminAuth, employeeController.deleteEmployee);

// Employee routes
router.get('/:id', employeeController.getEmployeeById);

module.exports = router;