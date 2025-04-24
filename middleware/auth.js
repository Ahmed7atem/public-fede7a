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
      if (!decoded || !decoded.employee || !decoded.role) {
        return res.status(401).json({ message: 'Invalid authentication token' });
      }
      
      // Find employee using UUID
      console.log('Looking for employee with decoded.employee:', decoded.employee);
      const employee = await Employee.findOne({ id: decoded.employee });
      
      if (!employee) {
        console.error('Employee not found for ID:', decoded.employee);
        console.error('Available employees:', await Employee.find({}, '_id id name email'));
        return res.status(401).json({ 
          error: 'Invalid authentication token', 
          detail: 'Employee not found in database' 
        });
      }
      console.log('Found employee:', { _id: employee._id, id: employee.id });

      // Verify that the role in the token matches the employee's role
      if (decoded.role !== employee.role) {
        console.error('Role mismatch:', decoded.role, 'vs', employee.role);
        return res.status(401).json({ 
          error: 'Invalid authentication token', 
          detail: 'Token role does not match employee role' 
        });
      }

      // Attach employee to request
      const employeeObj = employee.toObject();
      console.log('Employee after toObject:', employeeObj);
      req.employee = employeeObj;
      req.token = token;
      
      // Add debug info (remove in production)
      req.tokenInfo = {
        id: employeeObj.id,
        _id: employeeObj._id,
        role: employeeObj.role,
        exp: new Date(decoded.exp * 1000).toISOString()
      };

      console.log('Request employee after attach:', req.employee);

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
    return res.status(500).json({
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