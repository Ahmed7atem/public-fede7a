const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('../controllers/authController'));
app.use('/api/employees', require('../controllers/employeeController'));
app.use('/api/health', require('../controllers/healthDataController'));
app.use('/api/wearables', require('../controllers/wearableController'));
app.use('/api/predictions', require('../controllers/predictionController'));
app.use('/api/policies', require('../controllers/policyController'));
app.use('/api/claims', require('../controllers/claimController'));
app.use('/api/providers', require('../controllers/providerController'));
app.use('/api/complaints', require('../controllers/complaintController'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;