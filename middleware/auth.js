const jwt = require('jsonwebtoken');
const { Employee } = require('../models/schemas');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required', detail: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const employee = await Employee.findById(decoded.id);

      if (!employee) {
        return res.status(401).json({ 
          error: 'Invalid authentication token', 
          detail: 'Employee not found in database' 
        });
      }

      // Add token info to response for debugging (remove in production)
      req.token = token;
      req.employee = employee;
      req.tokenInfo = {
        id: decoded.id,
        role: decoded.role,
        exp: new Date(decoded.exp * 1000).toISOString()
      };
      next();
    } catch (jwtError) {
      // Handle specific JWT errors more gracefully
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
      throw jwtError;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Please authenticate', detail: error.message });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.employee.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(403).json({ error: 'Admin access required', detail: error.message });
  }
};

module.exports = { auth, adminAuth }; 