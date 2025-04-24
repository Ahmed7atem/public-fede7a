const express = require('express');
const cors = require('cors');
const { getAllEmployeesData } = require('../services/dataService');
const { getCurrentTimestamp } = require('../utils');
const connectDB = require('../config/database');
const { apiLimiter, authLimiter, dataSubmissionLimiter } = require('../middleware/rateLimiter');
const { auth, adminAuth } = require('../middleware/auth');
const mongoose = require('mongoose');
const predictionRoutes = require('../routes/predictionRoutes');

const app = express();

// Load environment variables
require('dotenv').config();

// Trust the proxy - this is needed for Vercel
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL_PROD, 'https://*.vercel.app'] 
    : [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());

// Connect to MongoDB
let dbConnection;
let dbConnectionAttempted = false;

const initializeDB = async () => {
  if (!dbConnectionAttempted) {
    try {
      console.log('Initializing database connection...');
      const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_CONNECT_URI;
      if (!mongoUri) {
        console.error('MongoDB connection URI is missing');
        dbConnectionAttempted = true;
        return null;
      }
      dbConnection = await connectDB();
      dbConnectionAttempted = true;
      console.log('Database connection initialized:', !!dbConnection);
      
      // Ensure connection is ready before proceeding
      if (dbConnection) {
        await new Promise((resolve) => {
          if (mongoose.connection.readyState === 1) {
            resolve();
          } else {
            mongoose.connection.once('connected', resolve);
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      dbConnectionAttempted = true;
    }
  }
  return dbConnection;
};

// Initialize database connection before starting the server
const startServer = async () => {
  try {
    const dbStatus = await initializeDB();
    if (!dbStatus) {
      console.error('Failed to establish database connection');
    }

    // Only start the server if we're not in a serverless environment
    if (process.env.NODE_ENV !== 'production') {
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer().catch(console.error);

// Apply general rate limiting to all routes
app.use(apiLimiter);

// Import routes
const employeeRoutes = require('../routes/employeeRoutes');
const healthDataRoutes = require('../routes/healthDataRoutes');
const wearableLogRoutes = require('../routes/wearableLogRoutes');
const reportRoutes = require('../routes/reportRoutes');
const authRoutes = require('../routes/authRoutes');
const feedbackRoutes = require('../routes/feedbackRoutes');
const policyRoutes = require('../routes/policyRoutes');
const claimRoutes = require('../routes/claimRoutes');
const providerRoutes = require('../routes/providerRoutes');
const ticketRoutes = require('../routes/ticketRoutes');
const fileRoutes = require('../routes/fileRoutes');
const attachmentRoutes = require('../routes/attachmentRoutes');
const adminRoutes = require('../routes/adminRoutes');

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await initializeDB();
  res.status(200).json({ 
    status: 'ok', 
    dbConnection: !!dbStatus,
    dbConnectionAttempted,
    environment: process.env.NODE_ENV,
    mongoUriExists: !!(process.env.MONGODB_URI || process.env.MONGODB_CONNECT_URI)
  });
});

// Add alias for health endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = await initializeDB();
  res.status(200).json({ 
    status: 'ok', 
    dbConnection: !!dbStatus,
    dbConnectionAttempted,
    environment: process.env.NODE_ENV,
    mongoUriExists: !!(process.env.MONGODB_URI || process.env.MONGODB_CONNECT_URI)
  });
});

// Root endpoint
app.get('/', async (req, res) => {
  const dbStatus = await initializeDB();
  res.status(200).json({ 
    status: 'ok', 
    message: 'Health Prediction API is running',
    dbConnection: !!dbStatus,
    dbConnectionAttempted,
    environment: process.env.NODE_ENV,
    mongoUriExists: !!(process.env.MONGODB_URI || process.env.MONGODB_CONNECT_URI)
  });
});

// Use routes with appropriate rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/health-data', auth, dataSubmissionLimiter, healthDataRoutes);
app.use('/api/wearable-logs', auth, dataSubmissionLimiter, wearableLogRoutes);
app.use('/api/employees', auth, employeeRoutes);
app.use('/api/reports', auth, reportRoutes);
app.use('/api/feedback', auth, feedbackRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/claims', auth, claimRoutes);
app.use('/api/providers', auth, providerRoutes);
app.use('/api/tickets', auth, ticketRoutes);
app.use('/api/files', auth, fileRoutes);
app.use('/api/attachments', auth, attachmentRoutes);
app.use('/api/admin', auth, adminRoutes);
app.use('/api/predictions', auth, predictionRoutes);

// Add a route for getting health data by employee ID
app.get('/api/health-data/:id', auth, (req, res, next) => {
  req.params.id = req.params.id;
  next();
}, healthDataRoutes);

// API to fetch all data (admin only)
app.get('/api/all-data', adminAuth, async (req, res) => {
  try {
    const data = await getAllEmployeesData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching all data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

module.exports = app;