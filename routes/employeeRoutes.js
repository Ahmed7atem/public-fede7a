const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const employeeController = require('../controllers/employeeController');

// Apply authentication to all routes
router.use(auth);

// Test route that bypasses the controller
router.get('/direct-test/:id', (req, res) => {
  res.json({
    message: 'Direct test employee route working',
    receivedId: req.params.id,
    timestamp: new Date().toISOString(),
    userRole: req.user ? req.user.role : 'unknown'
  });
});

// Admin routes
router.get('/', adminAuth, employeeController.getAllEmployees);
router.put('/:id', adminAuth, employeeController.updateEmployee);
router.delete('/:id', adminAuth, employeeController.deleteEmployee);

// Employee routes - must be after the more specific routes
router.get('/:id', employeeController.getEmployeeById);

module.exports = router;