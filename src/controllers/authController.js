const { Employee, Admin } = require('../../models');
const jwt = require('jsonwebtoken');

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    
    // Check if user is an admin
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

    // Check if user is an employee
    const employee = await Employee.findOne({ email });
    console.log('Employee found:', employee ? 'yes' : 'no');
    
    if (employee) {
      // Check employee password - direct comparison
      const isMatch = employee.password === password;
      console.log('Password match:', isMatch ? 'yes' : 'no');
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: employee._id,
          email: employee.email,
          role: 'employee'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: employee._id,
          email: employee.email,
          employeeId: employee.employeeId,
          role: 'employee'
        }
      });
    }
    
    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    // Check if token exists
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = req.headers.authorization.split(' ')[1];
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
      return res.status(401).json({ message: 'Not authorized, invalid token' });
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
    // Check if token exists
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = req.headers.authorization.split(' ')[1];
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
      return res.status(401).json({ message: 'Not authorized, invalid token' });
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