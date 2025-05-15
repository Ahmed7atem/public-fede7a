// Remove model imports since we're using static tokens
// const jwt = require('jsonwebtoken');
// const { Employee, Admin } = require('../models');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'No authorization header' });
    }

    // Handle both "Bearer token" and direct token formats
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Check for admin or employee token
    if (token === 'ADMIN_TOKEN') {
      req.user = { role: 'admin' };
      return next();
    } else if (token === 'EMPLOYEE_TOKEN') {
      req.user = { role: 'employee' };
      return next();
    }

    return res.status(401).json({ message: 'Invalid token' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

const employee = (req, res, next) => {
  if (req.user && req.user.role === 'employee') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as employee' });
  }
};

module.exports = { protect, admin, employee }; 