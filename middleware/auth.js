// const jwt = require('jsonwebtoken');
const { Employee } = require('../models/schemas');
const mongoose = require('mongoose');

exports.verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Simple token check
  if (token !== 'ADMIN_TOKEN' && token !== 'EMPLOYEE_TOKEN') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Set user role based on token
  req.user = {
    role: token === 'ADMIN_TOKEN' ? 'admin' : 'employee'
  };

  next();
};

exports.adminAuth = (req, res, next) => {
  const token = req.header('Authorization');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Only allow admin token
  if (token !== 'ADMIN_TOKEN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  req.user = { role: 'admin' };
  next();
};

module.exports = {
  verifyToken,
  adminAuth
}; 