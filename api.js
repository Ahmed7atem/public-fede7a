// This file serves as the main entry point for Vercel deployments
// It imports and re-exports the existing Express app from api/index.js

const app = require('./api/index.js');

// Export the app for Vercel
module.exports = app; 