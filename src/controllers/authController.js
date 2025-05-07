const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Employee, Admin } = require('../../models');
const { authenticateToken } = require('../middleware/auth');

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // First check if user is an admin
    const admin = await Admin.findOne({ email });
    if (admin) {
      // Check admin password - direct comparison
      const isMatch = admin.password === password;
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      return res.json({
        message: 'Login successful',
        token: 'ADMIN_TOKEN',
        user: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: 'admin'
        }
      });
    }
    
    // If not admin, check employees
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check employee password - direct comparison
    const isMatch = employee.password === password;
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.json({
      message: 'Login successful',
      token: 'EMPLOYEE_TOKEN',
      user: {
        id: employee._id,
        employeeId: employee.employeeId,
        email: employee.email,
        role: 'employee'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const isAdmin = token === 'ADMIN_TOKEN';
    
    if (isAdmin) {
      // Get admin profile
      const admin = await Admin.findOne({ email: 'admin@medbond.com' });
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      
      res.json({
        message: 'Profile retrieved',
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: 'admin'
        }
      });
    } else {
      // Get employee profile from token
      const employee = await Employee.findById(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      res.json({
        message: 'Profile retrieved',
        user: {
          id: employee._id,
          employeeId: employee.employeeId,
          email: employee.email,
          role: 'employee'
        }
      });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const isAdmin = token === 'ADMIN_TOKEN';
    
    if (isAdmin) {
      // Update admin profile
      const admin = await Admin.findOneAndUpdate(
        { email: 'admin@medbond.com' },
        { $set: req.body },
        { new: true }
      );
      
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      
      res.json({
        message: 'Profile updated successfully',
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: 'admin'
        }
      });
    } else {
      // Update employee profile
      const employee = await Employee.findByIdAndUpdate(
        req.user.id,
        { $set: req.body },
        { new: true }
      );
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      res.json({
        message: 'Profile updated successfully',
        user: {
          id: employee._id,
          employeeId: employee.employeeId,
          email: employee.email,
          role: 'employee'
        }
      });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  login,
  getProfile,
  updateProfile
}; 