const { Employee } = require('../../models');
const bcrypt = require('bcryptjs');

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await Employee.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password - in a real app we'd use bcrypt.compare
    // For now we'll just do a simple check since the passwords might not be hashed
    const isMatch = user.password === password;
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Create mock token (in a real app this would be a JWT)
    const token = user.role === 'admin' ? 'ADMIN_TOKEN' : 'EMPLOYEE_TOKEN';
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role
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
    // In a real app, we'd get the user ID from the authenticated token
    // For this mock, we'll just check if the token is admin or employee
    const isAdmin = req.headers.authorization === 'ADMIN_TOKEN';
    
    // Mock response
    if (isAdmin) {
      res.json({
        message: 'Profile retrieved',
        user: {
          name: 'Admin User',
          email: 'admin@medbond.com',
          role: 'admin'
        }
      });
    } else {
      res.json({
        message: 'Profile retrieved',
        user: {
          name: 'Employee User',
          email: 'employee@example.com',
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
    // In a real app, we'd get the user ID from the authenticated token
    // and update their profile in the database
    
    // Mock response
    res.json({
      message: 'Profile updated successfully',
      user: {
        ...req.body,
        role: req.headers.authorization === 'ADMIN_TOKEN' ? 'admin' : 'employee'
      }
    });
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