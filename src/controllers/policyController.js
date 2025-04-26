const mongoose = require('mongoose');
const { Policy } = require('../../models');

/**
 * @desc    Get all policies
 * @route   GET /api/policies
 * @access  Private/Admin
 */
const getAllPolicies = async (req, res) => {
  try {
    const policies = await Policy.find().limit(10).lean();
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
    const policy = await Policy.findOne({ policyId: req.params.id }).lean();
    
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    
    res.json(policy);
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ message: 'Error fetching policy', error: error.message });
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
  createPolicy,
  updatePolicy,
  deletePolicy
}; 