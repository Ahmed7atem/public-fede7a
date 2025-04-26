// This file serves as the main entry point for Vercel deployments

const express = require('express');
const app = express();

// Special direct debug endpoint
app.get('/api/debug/:id', (req, res) => {
  res.json({
    message: 'Debug endpoint working directly from api.js',
    id: req.params.id,
    path: req.path,
    method: req.method,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Import the existing app
const mainApp = require('./api/index.js');

// Use the main app for all other routes
app.use('/', mainApp);

// Export the app for Vercel
module.exports = app; 