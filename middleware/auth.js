const jwt = require('jsonwebtoken');
const { Employee } = require('../models/schemas');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Simple token validation for development
    if (token !== 'ADMIN_TOKEN' && token !== 'EMPLOYEE_TOKEN') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // For development, we'll use a default user ID
    req.user = { id: 'default_user_id', role: token === 'ADMIN_TOKEN' ? 'admin' : 'employee' };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Admin role check middleware
const adminAuth = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(403).json({ message: 'Admin access required' });
  }
};

module.exports = { auth, adminAuth }; 