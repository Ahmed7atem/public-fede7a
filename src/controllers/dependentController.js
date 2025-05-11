const { Dependent } = require('../../models');

/**
 * @desc    Get all dependents
 * @route   GET /api/dependents
 * @access  Public
 */
const getAllDependents = async (req, res) => {
  try {
    const dependents = await Dependent.find().lean();
    res.json(dependents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dependents', error: error.message });
  }
};

/**
 * @desc    Get dependents by employee ID
 * @route   GET /api/dependents/employee/:employeeId
 * @access  Public
 */
const getDependentsByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const dependents = await Dependent.find({ employeeId }).lean();
    
    if (!dependents || dependents.length === 0) {
      return res.status(404).json({ message: 'No dependents found for this employee' });
    }
    
    res.json(dependents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dependents', error: error.message });
  }
};

module.exports = {
  getAllDependents,
  getDependentsByEmployeeId
}; 