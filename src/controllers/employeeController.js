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
    
    // First try direct match on employeeId
    let employee = await Employee.findOne({ employeeId: id }).lean();
    
    if (!employee) {
      console.log('No employee found with employeeId:', id);
      // Try matching against Policy_ID
      employee = await Employee.findOne({ Policy_ID: id }).lean();
      
      if (!employee) {
        console.log('No employee found with Policy_ID:', id);
        // Try converting to ObjectId if valid
        if (mongoose.Types.ObjectId.isValid(id)) {
          console.log('Trying ObjectId match for:', id);
          employee = await Employee.findOne({ _id: new mongoose.Types.ObjectId(id) }).lean();
        }
      }
    }
    
    if (!employee) {
      console.log('Employee not found with any ID type');
      return res.status(404).json({ message: 'Employee not found' });
    }

    console.log('Found employee:', employee.employeeId);
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
    
    // Find employee by any of the ID types
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query = { $or: [{ employeeId: id }, { Policy_ID: id }] };
    }
    
    const employee = await Employee.findOneAndUpdate(query, updates, { new: true });
    
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
    
    // Find employee by any of the ID types
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query = { $or: [{ employeeId: id }, { Policy_ID: id }] };
    }
    
    const employee = await Employee.findOneAndDelete(query);
    
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