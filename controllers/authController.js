const { Employee } = require('../models/schemas');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const employee = await Employee.findOne({ email });
    if (!employee) return res.status(401).json({ error: 'Invalid credentials' });

    const isValidPassword = await bcrypt.compare(password, employee.password);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: employee._id, role: employee.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const response = employee.toObject();
    delete response.password;
    res.json({ employee: response, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = new Employee({
      name,
      email,
      password: hashedPassword,
      role: role || 'employee'
    });

    await employee.save();

    const token = jwt.sign(
      { id: employee._id, role: employee.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const response = employee.toObject();
    delete response.password;
    res.status(201).json({ employee: response, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id).select('-password');
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    const employee = await Employee.findById(req.employee._id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    if (currentPassword && newPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, employee.password);
      if (!isValidPassword) return res.status(401).json({ error: 'Current password is incorrect' });
      employee.password = await bcrypt.hash(newPassword, 10);
    }

    employee.name = name;
    employee.email = email;
    await employee.save();

    const response = employee.toObject();
    delete response.password;
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};