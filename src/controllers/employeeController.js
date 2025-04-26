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
    console.log(`Found ${employees.length} total employees`);
    
    // Log one employee to see its structure
    if (employees.length > 0) {
      console.log('Sample employee ID fields:', {
        _id: employees[0]._id,
        employeeId: employees[0].employeeId,
        Policy_ID: employees[0].Policy_ID
      });
    }
    
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
    
    // We now know the field is definitely 'employeeId' in the employees collection
    // Build a targeted query with variations of the ID format
    const query = {
      $or: [
        // Primary match on employeeId
        { employeeId: id },
        
        // Fall back to Policy_ID as an alternative
        { Policy_ID: id },
        
        // Try without dashes
        { employeeId: id.replace(/-/g, '') },
        { Policy_ID: id.replace(/-/g, '') },
        
        // Try case-insensitive regex as last resort
        { employeeId: { $regex: new RegExp(id, 'i') } }
      ]
    };
    
    // Add ObjectId check if valid
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or.push({ _id: new mongoose.Types.ObjectId(id) });
    }
    
    console.log('Executing targeted query for employee on employeeId field');
    const employee = await Employee.findOne(query).lean();
    console.log('Employee found:', employee ? 'Yes' : 'No');
    
    // Always return the result, even if null (status 200)
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
    
    // Use the specific field names we know are in the collection
    const query = {
      $or: [
        { employeeId: id },
        { Policy_ID: id }
      ]
    };
    
    // Include ObjectId check
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or.push({ _id: new mongoose.Types.ObjectId(id) });
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
    
    // Use the specific field names we know are in the collection
    const query = {
      $or: [
        { employeeId: id },
        { Policy_ID: id }
      ]
    };
    
    // Include ObjectId check
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or.push({ _id: new mongoose.Types.ObjectId(id) });
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