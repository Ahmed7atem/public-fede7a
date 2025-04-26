const jwt = require('jsonwebtoken');
const { Employee } = require('../models/schemas');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware running');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('Token received:', token ? 'Token present' : 'No token');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    // Simple token validation for development
    if (token !== 'ADMIN_TOKEN' && token !== 'EMPLOYEE_TOKEN') {
      console.log('Invalid token provided:', token);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // For development, we'll use a default user ID
    req.user = { id: 'default_user_id', role: token === 'ADMIN_TOKEN' ? 'admin' : 'employee' };
    console.log('User role set:', req.user.role);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Admin role check middleware
const adminAuth = async (req, res, next) => {
  try {
    console.log('Admin auth middleware running');
    console.log('User object:', req.user ? JSON.stringify(req.user) : 'No user object');
    
    if (!req.user || req.user.role !== 'admin') {
      console.log('Admin access required but user is not admin');
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    console.log('Admin access granted');
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(403).json({ message: 'Admin access required' });
  }
};

module.exports = { auth, adminAuth }; 