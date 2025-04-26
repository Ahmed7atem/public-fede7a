const mongoose = require('mongoose');
const { Employee } = require('../../models');

/**
 * @desc    Get all employees
 * @route   GET /api/employees
 * @access  Public
 */
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().limit(10).lean();
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ 
      message: 'Error fetching employees',
      error: error.message 
    });
  }
};

/**
 * @desc    Get employee by ID
 * @route   GET /api/employees/:id
 * @access  Public
 */
const getEmployeeById = async (req, res) => {
  try {
    const id = req.params.id;
    console.log('Looking up employee with ID:', id);
    
    // Simple direct approach - try both employeeId and Policy_ID
    let employee = await Employee.findOne({ employeeId: id }).lean();
    
    // If not found by employeeId, try Policy_ID
    if (!employee) {
      employee = await Employee.findOne({ Policy_ID: id }).lean();
    }
    
    // If still not found, try ObjectId if valid
    if (!employee && mongoose.Types.ObjectId.isValid(id)) {
      employee = await Employee.findById(id).lean();
    }
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Error fetching employee', error: error.message });
  }
};

/**
 * @desc    Create a new employee
 * @route   POST /api/employees
 * @access  Private/Admin
 */
const createEmployee = async (req, res) => {
  try {
    const employee = new Employee(req.body);
    const savedEmployee = await employee.save();
    res.status(201).json(savedEmployee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Error creating employee', error: error.message });
  }
};

/**
 * @desc    Update an employee
 * @route   PUT /api/employees/:id
 * @access  Private/Admin
 */
const updateEmployee = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    
    // Simple query for the main ID fields
    let employee = null;
    
    // Try each ID type in sequence
    if (mongoose.Types.ObjectId.isValid(id)) {
      employee = await Employee.findByIdAndUpdate(id, updates, { new: true });
    }
    
    if (!employee) {
      employee = await Employee.findOneAndUpdate({ employeeId: id }, updates, { new: true });
    }
    
    if (!employee) {
      employee = await Employee.findOneAndUpdate({ Policy_ID: id }, updates, { new: true });
    }
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Error updating employee', error: error.message });
  }
};

/**
 * @desc    Delete an employee
 * @route   DELETE /api/employees/:id
 * @access  Private/Admin
 */
const deleteEmployee = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Simple query for the main ID fields
    let employee = null;
    
    // Try each ID type in sequence
    if (mongoose.Types.ObjectId.isValid(id)) {
      employee = await Employee.findByIdAndDelete(id);
    }
    
    if (!employee) {
      employee = await Employee.findOneAndDelete({ employeeId: id });
    }
    
    if (!employee) {
      employee = await Employee.findOneAndDelete({ Policy_ID: id });
    }
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({ message: 'Employee removed' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Error deleting employee', error: error.message });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
}; 