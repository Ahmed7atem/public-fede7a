const express = require('express');
const cors = require('cors');
const { getAllEmployeesData } = require('../services/dataService');
const { getCurrentTimestamp } = require('../utils');
const connectDB = require('../config/database');
const { apiLimiter, authLimiter, dataSubmissionLimiter } = require('../middleware/rateLimiter');
const { auth, adminAuth } = require('../middleware/auth');
const mongoose = require('mongoose');
const predictionRoutes = require('../routes/predictionRoutes');
const jwt = require('jsonwebtoken');
const { Employee } = require('../models/schemas');

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
const complaintRoutes = require('../routes/complaintRoutes');
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

// Debug endpoint for JWT testing
app.post('/api/debug/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find employee by email
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found',
        debug: { email }
      });
    }
    
    // Check password
    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Password incorrect',
        debug: { email }
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { employee: employee._id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' } // Default 24h if not set
    );
    
    // Return detailed debug info
    res.json({
      success: true,
      token,
      tokenDecoded: jwt.decode(token),
      employee: {
        _id: employee._id,
        id: employee.id,
        role: employee.role,
        email: employee.email
      },
      debug: {
        mongooseId: mongoose.Types.ObjectId.isValid(employee._id) ? 'valid ObjectId' : 'not ObjectId',
        idMatch: employee._id === employee.id ? 'matching' : 'different',
        tokenPayload: { employee: employee._id, role: employee.role }
      }
    });
  } catch (error) {
    console.error('Debug login error:', error);
    res.status(500).json({ 
      success: false,
      message: `Server error: ${error.message}`,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

// Debug endpoint to test token verification
app.get('/api/debug/verify', async (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No auth header' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find employee and return details
      const employee = await Employee.findById(decoded.employee);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Token valid but employee not found',
          decoded
        });
      }
      
      return res.json({
        success: true,
        decoded,
        employee: {
          _id: employee._id,
          id: employee.id,
          role: employee.role,
          email: employee.email
        },
        roleMatch: decoded.role === employee.role
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: jwtError.name,
        message: jwtError.message
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

// Debug endpoint for admin auth testing
app.get('/api/debug/admin-test', async (req, res) => {
  try {
    // First do standard auth
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No auth header' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find employee
      const employee = await Employee.findById(decoded.employee);
      if (!employee) {
        return res.status(404).json({
          success: false, 
          stage: 'employee-lookup',
          message: 'Employee not found with that ID',
          debug: { 
            decodedId: decoded.employee,
            objectIdValid: mongoose.Types.ObjectId.isValid(decoded.employee)
          }
        });
      }
      
      // Check role match
      if (decoded.role !== employee.role) {
        return res.status(401).json({
          success: false,
          stage: 'role-match',
          message: 'Role mismatch between token and database',
          debug: {
            tokenRole: decoded.role,
            dbRole: employee.role
          }
        });
      }
      
      // Now check admin role
      if (!employee.role || employee.role !== 'admin') {
        return res.status(403).json({
          success: false,
          stage: 'admin-check',
          message: 'Not an admin user',
          debug: {
            role: employee.role,
            isAdmin: employee.role === 'admin',
            userId: employee._id
          }
        });
      }
      
      // If we get here, all checks passed
      return res.json({
        success: true,
        message: 'Authentication successful, user is admin',
        employee: {
          _id: employee._id,
          id: employee.id,
          role: employee.role,
          email: employee.email
        }
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        stage: 'jwt-verify',
        error: jwtError.name,
        message: jwtError.message
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

// Direct admin user check endpoint
app.get('/api/debug/check-admin', async (req, res) => {
  await initializeDB();
  
  try {
    // Find admin by email
    const adminEmail = 'admin@medbond.com';
    const adminUser = await Employee.findOne({ email: adminEmail }).lean();
    
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found',
        debug: { email: adminEmail }
      });
    }
    
    // Check admin properties
    return res.json({
      success: true,
      admin: {
        _id: adminUser._id,
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        idMatch: adminUser._id === adminUser.id ? 'matching' : 'different',
        objectIdValid: mongoose.Types.ObjectId.isValid(adminUser._id)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

// Repair admin user endpoint 
app.get('/api/debug/repair-admin', async (req, res) => {
  await initializeDB();
  
  try {
    // Find admin by email
    const adminEmail = 'admin@medbond.com';
    const adminUser = await Employee.findOne({ email: adminEmail });
    
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found to repair',
        debug: { email: adminEmail }
      });
    }
    
    // Ensure role is 'admin'
    const roleUpdated = adminUser.role !== 'admin';
    if (roleUpdated) {
      adminUser.role = 'admin';
    }
    
    // Ensure _id and id match
    const idUpdated = adminUser._id !== adminUser.id;
    if (idUpdated) {
      adminUser.id = adminUser._id;
    }
    
    // Only save if changes were made
    if (roleUpdated || idUpdated) {
      await adminUser.save();
      return res.json({
        success: true,
        message: 'Admin user repaired successfully',
        changesApplied: {
          roleUpdated,
          idUpdated
        },
        admin: {
          _id: adminUser._id,
          id: adminUser.id,
          role: adminUser.role,
          email: adminUser.email
        }
      });
    } else {
      return res.json({
        success: true,
        message: 'Admin user already correctly configured',
        admin: {
          _id: adminUser._id,
          id: adminUser.id,
          role: adminUser.role,
          email: adminUser.email
        }
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
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
app.use('/api/complaints', auth, complaintRoutes);
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
app.get('/api/all-data', auth, adminAuth, async (req, res) => {
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