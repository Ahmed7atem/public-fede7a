const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// API root route
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'API endpoints available' });
});

// Connect to MongoDB
console.log('Connecting to MongoDB...');
console.log('Connection string:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(async () => {
  console.log('MongoDB connected');
  
  // Test the connection by trying to get the collections
  const collections = await mongoose.connection.db.collections();
  console.log('Available collections:', collections.map(c => c.collectionName));

  // Test querying the employees collection
  const employeesCollection = mongoose.connection.db.collection('employees');
  const employeeCount = await employeesCollection.countDocuments();
  console.log('Total employees in database:', employeeCount);
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Determine the base directory
const baseDir = path.join(__dirname, '..');
console.log('Base directory:', baseDir);

// Debug logging route paths
const logRoutePath = (routePath, targetPath) => {
  const resolvedPath = path.resolve(baseDir, targetPath);
  console.log(`Route ${routePath} -> ${targetPath} (${resolvedPath})`);
  return require(resolvedPath);
};

// Routes
app.use('/api/auth', logRoutePath('/api/auth', './controllers/authController'));
app.use('/api/employees', logRoutePath('/api/employees', './routes/employeeRoutes'));
app.use('/api/health', logRoutePath('/api/health', './controllers/healthDataController'));
app.use('/api/wearables', logRoutePath('/api/wearables', './controllers/wearableController'));
app.use('/api/sleep', logRoutePath('/api/sleep', './controllers/sleepDataController'));
app.use('/api/policies', logRoutePath('/api/policies', './controllers/policyController'));
app.use('/api/claims', logRoutePath('/api/claims', './controllers/claimController'));
app.use('/api/providers', logRoutePath('/api/providers', './controllers/providerController'));
app.use('/api/analytics', logRoutePath('/api/analytics', './controllers/analyticsController'));
app.use('/api/complaints', logRoutePath('/api/complaints', './controllers/complaintController'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;