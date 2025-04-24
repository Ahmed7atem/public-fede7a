const { Provider } = require('../models/schemas');

// Get all healthcare providers
const getAllProviders = async (req, res) => {
  try {
    const providers = await Provider.find({ isActive: true });
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching providers', error: error.message });
  }
};

// Search providers with filters (location, category, type)
const searchProviders = async (req, res) => {
  try {
    const { location, category, type } = req.query;
    
    let query = { isActive: true };
    
    if (location) {
      query['location.city'] = { $regex: location, $options: 'i' };
    }
    
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }
    
    if (type) {
      query.type = type;
    }
    
    const providers = await Provider.find(query);
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: 'Error searching providers', error: error.message });
  }
};

// Get provider by ID
const getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    if (!provider.isActive) {
      return res.status(404).json({ message: 'Provider is not active' });
    }
    
    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching provider details', error: error.message });
  }
};

// Admin only: Add a new provider
const addProvider = async (req, res) => {
  try {
    // Only admins can add providers
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const {
      name,
      type,
      category,
      location,
      availability,
      experienceYears,
      contactInformation
    } = req.body;
    
    if (!name || !type || !category || !location) {
      return res.status(400).json({ message: 'Missing required provider information' });
    }
    
    const newProvider = new Provider({
      name,
      type,
      category,
      location,
      availability,
      experienceYears,
      contactInformation
    });
    
    await newProvider.save();
    
    res.status(201).json({
      message: 'Provider added successfully',
      provider: newProvider
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding provider', error: error.message });
  }
};

// Admin only: Update provider
const updateProvider = async (req, res) => {
  try {
    // Only admins can update providers
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    // Fields that can be updated
    const updatableFields = [
      'name', 'type', 'category', 'location', 'availability', 
      'ratings', 'experienceYears', 'contactInformation', 'isActive'
    ];
    
    // Update only allowed fields
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        provider[field] = req.body[field];
      }
    });
    
    await provider.save();
    
    res.json({
      message: 'Provider updated successfully',
      provider: provider
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating provider', error: error.message });
  }
};

module.exports = {
  getAllProviders,
  searchProviders,
  getProviderById,
  addProvider,
  updateProvider
}; 