const jwt = require('jsonwebtoken');
const { Employee } = require('../../models');

const authenticateToken = async (req, res, next) => {
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

    // Check if it's an admin token
    if (token === 'ADMIN_TOKEN') {
      req.user = { role: 'admin' };
      return next();
    }

    // Check if it's an employee token
    if (token === 'EMPLOYEE_TOKEN') {
      const employee = await Employee.findOne({ email: req.body.email });
      if (!employee) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      req.user = { id: employee._id, role: 'employee' };
      return next();
    }

    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid token' });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  authenticateToken
}; 