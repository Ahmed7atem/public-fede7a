const jwt = require('jsonwebtoken');
const { Employee } = require('../models/schemas');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const employee = await Employee.findById(decoded.id);

    if (!employee) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    req.token = token;
    req.employee = employee;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
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
    res.status(403).json({ error: 'Admin access required' });
  }
};

module.exports = { auth, adminAuth }; 