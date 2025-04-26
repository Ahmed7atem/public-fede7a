// This file serves as the main entry point for Vercel deployments
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

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

// Import controllers and routes
const mainApp = require('./api/index.js');
const authController = require('./controllers/authController');
const employeeRoutes = require('./routes/employeeRoutes');
const healthDataController = require('./controllers/healthDataController');
const wearableController = require('./controllers/wearableController');
const sleepDataController = require('./controllers/sleepDataController');
const policyController = require('./controllers/policyController');
const claimController = require('./controllers/claimController');
const providerController = require('./controllers/providerController');
const analyticsController = require('./controllers/analyticsController');
const complaintController = require('./controllers/complaintController');

// Special direct debug endpoint
app.get('/api/debug/:id', (req, res) => {
  res.json({
    message: 'Debug endpoint working directly from api.js',
    id: req.params.id,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Direct test routes for employees
app.get('/api/employees/direct-test/:id', (req, res) => {
  res.json({
    message: 'Direct employee test route working from api.js',
    id: req.params.id,
    timestamp: new Date().toISOString()
  });
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

// Use the original app for all other routes
app.use('/', mainApp);

// Export the app for Vercel
module.exports = app; 