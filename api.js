// This file serves as the main entry point for Vercel deployments
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Employee } = require('./models/schemas');

// Create the app
const app = express();

// Use essential middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  console.log('Request headers:', JSON.stringify(req.headers));
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// API info route
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API endpoints available from api.js',
    endpoints: [
      '/api/auth',
      '/api/employees',
      '/api/health',
      '/api/wearables',
      '/api/sleep',
      '/api/policies',
      '/api/claims',
      '/api/providers',
      '/api/analytics',
      '/api/complaints'
    ]
  });
});

// Query-based employee endpoint
app.get('/api/employees-query', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ message: 'Employee ID is required as a query parameter' });
    }
    
    console.log('Looking up employee with ID:', id);
    
    // First try direct match on employeeId
    let employee = await Employee.findOne({ employeeId: id }).select('-password').lean();
    
    if (!employee) {
      console.log('No employee found with employeeId:', id);
      // Try matching against Policy_ID
      employee = await Employee.findOne({ Policy_ID: id }).select('-password').lean();
      
      if (!employee) {
        console.log('No employee found with Policy_ID:', id);
        // Try converting to ObjectId if valid
        if (mongoose.Types.ObjectId.isValid(id)) {
          console.log('Trying ObjectId match for:', id);
          employee = await Employee.findOne({ _id: new mongoose.Types.ObjectId(id) }).select('-password').lean();
        }
      }
    }
    
    if (!employee) {
      console.log('Employee not found with any ID type');
      return res.status(404).json({ message: 'Employee not found' });
    }

    console.log('Found employee:', employee.employeeId);
    res.json({
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        email: employee.email,
        policy: employee.Policy_ID
      },
      message: 'Employee found via query parameter'
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ 
      message: 'Error fetching employee',
      error: error.message
    });
  }
});

// Special direct debug endpoint with query parameter
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Debug endpoint working directly from api.js',
    id: req.query.id || 'No ID provided',
    path: req.path,
    query: req.query,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Import the original app
const mainApp = require('./api/index.js');

// Use the original app for all other routes
app.use('/', mainApp);

// Export the app for Vercel
module.exports = app; 