const mongoose = require('mongoose');
const { Policy, Employee } = require('../../models');

/**
 * @desc    Get all policies
 * @route   GET /api/policies
 * @access  Private/Admin
 */
const getAllPolicies = async (req, res) => {
  try {
    const employees = await Employee.find({}, {
      Policy_ID: 1,
      policyNumber: 1,
      Plan_Name: 1,
      Coverage_Details: 1,
      Start_Date: 1,
      End_Date: 1,
      employeeId: 1,
      email: 1
    }).lean();

    // Transform employee data into policy format
    const policies = employees.map(employee => ({
      policyId: employee.Policy_ID,
      policyNumber: employee.policyNumber,
      type: employee.Plan_Name,
      coverage: {
        details: employee.Coverage_Details
      },
      startDate: new Date(employee.Start_Date),
      endDate: new Date(employee.End_Date),
      employeeId: employee.employeeId,
      employeeEmail: employee.email
    }));

    res.json(policies);
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ message: 'Error fetching policies', error: error.message });
  }
};

/**
 * @desc    Get policy by ID
 * @route   GET /api/policies/:id
 * @access  Private
 */
const getPolicyById = async (req, res) => {
  try {
    const policyId = req.params.id;
    const employee = await Employee.findOne({ Policy_ID: policyId }, {
      Policy_ID: 1,
      policyNumber: 1,
      Plan_Name: 1,
      Coverage_Details: 1,
      Start_Date: 1,
      End_Date: 1,
      employeeId: 1,
      email: 1,
      Claimed_Amount: 1,
      Insurance_Score: 1
    }).lean();

    if (!employee) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    // Transform employee data into policy format
    const policy = {
      policyId: employee.Policy_ID,
      policyNumber: employee.policyNumber,
      type: employee.Plan_Name,
      coverage: {
        details: employee.Coverage_Details
      },
      startDate: new Date(employee.Start_Date),
      endDate: new Date(employee.End_Date),
      employeeId: employee.employeeId,
      employeeEmail: employee.email,
      claimedAmount: employee.Claimed_Amount,
      insuranceScore: employee.Insurance_Score
    };

    res.json(policy);
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ message: 'Error fetching policy', error: error.message });
  }
};

/**
 * @desc    Get policy by employee ID
 * @route   GET /api/policies/employee/:employeeId
 * @access  Private
 */
const getPolicyByEmployeeId = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const employee = await Employee.findOne({ employeeId }, {
      Policy_ID: 1,
      policyNumber: 1,
      Plan_Name: 1,
      Coverage_Details: 1,
      Start_Date: 1,
      End_Date: 1,
      employeeId: 1,
      email: 1,
      Claimed_Amount: 1,
      Insurance_Score: 1
    }).lean();

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Transform employee data into policy format
    const policy = {
      policyId: employee.Policy_ID,
      policyNumber: employee.policyNumber,
      type: employee.Plan_Name,
      coverage: {
        details: employee.Coverage_Details
      },
      startDate: new Date(employee.Start_Date),
      endDate: new Date(employee.End_Date),
      employeeId: employee.employeeId,
      employeeEmail: employee.email,
      claimedAmount: employee.Claimed_Amount,
      insuranceScore: employee.Insurance_Score
    };

    res.json(policy);
  } catch (error) {
    console.error('Error fetching employee policy:', error);
    res.status(500).json({ message: 'Error fetching employee policy', error: error.message });
  }
};

/**
 * @desc    Create a new policy
 * @route   POST /api/policies
 * @access  Private/Admin
 */
const createPolicy = async (req, res) => {
  try {
    const policyData = {
      ...req.body,
      policyId: `POL-${Date.now().toString().slice(-6)}`,
    };
    
    const policy = new Policy(policyData);
    const savedPolicy = await policy.save();
    
    res.status(201).json(savedPolicy);
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ message: 'Error creating policy', error: error.message });
  }
};

/**
 * @desc    Update a policy
 * @route   PUT /api/policies/:id
 * @access  Private/Admin
 */
const updatePolicy = async (req, res) => {
  try {
    const policy = await Policy.findOneAndUpdate(
      { policyId: req.params.id },
      req.body,
      { new: true }
    );
    
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    
    res.json(policy);
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ message: 'Error updating policy', error: error.message });
  }
};

/**
 * @desc    Delete a policy
 * @route   DELETE /api/policies/:id
 * @access  Private/Admin
 */
const deletePolicy = async (req, res) => {
  try {
    const policy = await Policy.findOneAndDelete({ policyId: req.params.id });
    
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    
    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ message: 'Error deleting policy', error: error.message });
  }
};

module.exports = {
  getAllPolicies,
  getPolicyById,
  getPolicyByEmployeeId,
  createPolicy,
  updatePolicy,
  deletePolicy
}; 