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
    console.log('Direct match on employeeId:', employee ? 'Found' : 'Not found');
    
    // If not found, try other fields and formats
    if (!employee) {
      // Try Policy_ID
      console.log('Trying Policy_ID match');
      employee = await Employee.findOne({ Policy_ID: id }).lean();
      console.log('Policy_ID match:', employee ? 'Found' : 'Not found');
      
      // Try the _id field if it's a valid ObjectId
      if (!employee && mongoose.Types.ObjectId.isValid(id)) {
        console.log('Trying ObjectId match');
        employee = await Employee.findById(id).lean();
        console.log('ObjectId match:', employee ? 'Found' : 'Not found');
      }
      
      // Try employeeId without dashes
      if (!employee && id.includes('-')) {
        const idWithoutDashes = id.replace(/-/g, '');
        console.log('Trying employeeId without dashes:', idWithoutDashes);
        employee = await Employee.findOne({ employeeId: idWithoutDashes }).lean();
        console.log('Without dashes match:', employee ? 'Found' : 'Not found');
      }
      
      // Try case-insensitive regex match
      if (!employee) {
        console.log('Trying regex match');
        const regex = new RegExp(id, 'i');
        employee = await Employee.findOne({
          $or: [
            { employeeId: { $regex: regex } },
            { Policy_ID: { $regex: regex } }
          ]
        }).lean();
        console.log('Regex match:', employee ? 'Found' : 'Not found');
      }
    }
    
    if (!employee) {
      console.log('Employee not found with any ID format');
      return res.status(404).json({ 
        message: 'Employee not found',
        debug: { idProvided: id }
      });
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