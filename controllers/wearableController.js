const { WearableData } = require('../models/schemas');
const { getEmployeeWearableData, saveWearableData, getAggregatedWearableData } = require('../services/dataService');
const mongoose = require('mongoose');

// Helper function to normalize IDs for comparison
function normalizeId(id) {
  if (!id) return null;
  
  // If it's an ObjectId, convert to string
  if (typeof id === 'object' && id._id) {
    id = id._id.toString();
  } else if (typeof id === 'object') {
    id = id.toString();
  }

  // Remove hyphens and preserve full length
  return id.replace(/-/g, '');
}

exports.getWearableData = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days = 30 } = req.query;
    
    // If admin, allow viewing any employee's data
    if (req.employee.role === 'admin') {
      const { employeeId } = req.query;
      if (!employeeId) {
        return res.status(400).json({ error: 'Employee ID is required for admin users' });
      }
      try {
        const normalizedId = normalizeId(employeeId);
        const wearableData = await getEmployeeWearableData(normalizedId, parseInt(days));
        return res.json(wearableData);
      } catch (error) {
        return res.status(400).json({ error: `Invalid employee ID: ${error.message}` });
      }
    }
    
    // Regular employees can only view their own data
    try {
      const normalizedId = normalizeId(req.employee._id);
      const wearableData = await getEmployeeWearableData(normalizedId, parseInt(days));
      res.json(wearableData);
    } catch (error) {
      return res.status(400).json({ error: `Invalid employee ID: ${error.message}` });
    }
  } catch (error) {
    console.error('Error in getWearableData:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createWearableData = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Admin cannot create wearable data
    if (req.employee.role === 'admin') {
      return res.status(403).json({ error: 'Admin users cannot create wearable data' });
    }
    
    try {
      const normalizedId = normalizeId(req.employee._id);
      const wearableData = await saveWearableData(normalizedId, req.body);
      res.status(201).json(wearableData);
    } catch (error) {
      return res.status(400).json({ error: `Invalid employee ID: ${error.message}` });
    }
  } catch (error) {
    console.error('Error in createWearableData:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAggregatedData = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days = 30 } = req.query;
    
    // If admin, allow viewing any employee's data
    if (req.employee.role === 'admin') {
      const { employeeId } = req.query;
      if (!employeeId) {
        return res.status(400).json({ error: 'Employee ID is required for admin users' });
      }
      try {
        const normalizedId = normalizeId(employeeId);
        const aggregatedData = await getAggregatedWearableData(normalizedId, parseInt(days));
        return res.json(aggregatedData);
      } catch (error) {
        return res.status(400).json({ error: `Invalid employee ID: ${error.message}` });
      }
    }
    
    // Regular employees can only view their own data
    try {
      const normalizedId = normalizeId(req.employee._id);
      const aggregatedData = await getAggregatedWearableData(normalizedId, parseInt(days));
      res.json(aggregatedData);
    } catch (error) {
      return res.status(400).json({ error: `Invalid employee ID: ${error.message}` });
    }
  } catch (error) {
    console.error('Error in getAggregatedData:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateWearableData = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Admin cannot update wearable data
    if (req.employee.role === 'admin') {
      return res.status(403).json({ error: 'Admin users cannot update wearable data' });
    }
    
    try {
      const objectId = convertToObjectId(req.employee._id);
      const wearableData = await WearableData.findOneAndUpdate(
        { employee: objectId, _id: req.params.id },
        { $set: req.body },
        { new: true }
      );
      if (!wearableData) return res.status(404).json({ error: 'Wearable data not found' });
      res.json(wearableData);
    } catch (error) {
      return res.status(400).json({ error: `Invalid employee ID: ${error.message}` });
    }
  } catch (error) {
    console.error('Error in updateWearableData:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteWearableData = async (req, res) => {
  try {
    // Check if employee exists
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Admin cannot delete wearable data
    if (req.employee.role === 'admin') {
      return res.status(403).json({ error: 'Admin users cannot delete wearable data' });
    }
    
    try {
      const objectId = convertToObjectId(req.employee._id);
      const wearableData = await WearableData.findOneAndDelete({
        employee: objectId,
        _id: req.params.id
      });
      if (!wearableData) return res.status(404).json({ error: 'Wearable data not found' });
      res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: `Invalid employee ID: ${error.message}` });
    }
  } catch (error) {
    console.error('Error in deleteWearableData:', error);
    res.status(500).json({ error: error.message });
  }
}; 