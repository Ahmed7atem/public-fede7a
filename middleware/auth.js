const jwt = require('jsonwebtoken');
const { Employee } = require('../models/schemas');
const mongoose = require('mongoose');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication required - No Authorization header provided' });
    }

    // Extract token from Bearer scheme
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required - No token provided' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Log decoded token for debugging
      console.log('Decoded token:', decoded);
      
      // Ensure decoded object has required properties
      if (!decoded || !decoded.employee || !decoded.role) {
        return res.status(401).json({ message: 'Invalid authentication token - Missing required token data' });
      }
      
      // Find employee by _id
      const employee = await Employee.findById(decoded.employee);

      if (!employee) {
        console.error(`Employee not found for ID: ${decoded.employee}`);
        return res.status(401).json({ message: 'Invalid authentication token - Employee not found' });
      }
      
      // Verify the role matches
      if (decoded.role !== employee.role) {
        console.warn(`Role mismatch in token. Token role: ${decoded.role}, Employee role: ${employee.role}`);
        return res.status(401).json({ message: 'Invalid authentication token - Role mismatch' });
      }

      // Attach employee and token to request
      req.employee = employee;
      req.token = token;
      
      console.log(`Authentication successful for employee: ${employee._id}, role: ${employee.role}`);
      next();
    } catch (jwtError) {
      // Handle specific JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Authentication expired - Please login again' });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token - Verification failed' });
      }
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ message: `Authentication failed - ${jwtError.message}` });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    // Make sure we have a valid employee from previous auth
    if (!req.employee) {
      console.error('No employee object in request for adminAuth');
      return res.status(401).json({ message: 'Authentication required - No employee information' });
    }
    
    // Log employee role information for debugging
    console.log(`Admin auth check for employee: ${req.employee._id}, role: ${req.employee.role}`);
    
    // Check if role is admin
    if (!req.employee.role || req.employee.role !== 'admin') {
      console.error(`Admin access denied for: ${req.employee.email}`);
      return res.status(403).json({ message: 'Access denied - Admin privileges required' });
    }
    
    // If we reach here, the user is an admin
    console.log(`Admin access granted to: ${req.employee.email}`);
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

module.exports = {
  auth,
  adminAuth
}; 