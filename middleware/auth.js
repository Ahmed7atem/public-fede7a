const jwt = require('jsonwebtoken');
const { Employee } = require('../models/schemas');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        detail: 'No Authorization header provided' 
      });
    }

    // Extract token from Bearer scheme
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        detail: 'No token provided in Authorization header' 
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Ensure decoded object has required properties
      if (!decoded || !decoded.employee) {
        return res.status(401).json({ 
          error: 'Invalid token', 
          detail: 'Token payload is invalid' 
        });
      }
      
      // Find employee using either _id or id
      const employee = await Employee.findOne({ 
        $or: [
          { _id: decoded.employee },
          { id: decoded.employee }
        ]
      });

      if (!employee) {
        console.error('Employee not found for ID:', decoded.employee);
        return res.status(401).json({ 
          error: 'Invalid authentication token', 
          detail: 'Employee not found in database' 
        });
      }

      // Attach employee to request
      req.employee = employee;
      req.token = token;
      
      // Add debug info (remove in production)
      req.tokenInfo = {
        id: decoded.employee,
        role: decoded.role,
        exp: new Date(decoded.exp * 1000).toISOString()
      };

      next();
    } catch (jwtError) {
      // Handle specific JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Authentication expired', 
          detail: 'Token has expired, please login again' 
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token', 
          detail: 'Token signature verification failed' 
        });
      }
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ 
        error: 'Authentication failed', 
        detail: jwtError.message 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication error', 
      detail: error.message 
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    if (!req.employee || req.employee.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied', 
        detail: 'Admin privileges required' 
      });
    }
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication failed', 
      detail: error.message 
    });
  }
};

module.exports = {
  auth,
  adminAuth
}; 