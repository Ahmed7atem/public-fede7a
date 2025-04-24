const { Provider } = require('../models/schemas');

// Get all healthcare providers
const getAllProviders = async (req, res) => {
  try {
    const providers = await Provider.find();
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

// Get provider by ID
const getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

// Create a new provider
const createProvider = async (req, res) => {
  try {
    const {
      name,
      type,
      category,
      location,
      availability,
      ratings,
      experienceYears,
      contactInformation,
      isActive
    } = req.body;

    if (!name || !type || !category || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const provider = new Provider({
      name,
      type,
      category,
      location,
      availability: availability || {
        days: [],
        hours: ''
      },
      ratings: ratings || 0,
      experienceYears,
      contactInformation: contactInformation || {
        phone: '',
        email: '',
        website: ''
      },
      isActive: isActive !== undefined ? isActive : true
    });

    await provider.save();

    res.status(201).json(provider);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

// Update a provider
const updateProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const {
      name,
      type,
      category,
      location,
      availability,
      ratings,
      experienceYears,
      contactInformation,
      isActive
    } = req.body;

    if (name) provider.name = name;
    if (type) provider.type = type;
    if (category) provider.category = category;
    if (location) provider.location = location;
    if (availability) provider.availability = availability;
    if (ratings !== undefined) provider.ratings = ratings;
    if (experienceYears) provider.experienceYears = experienceYears;
    if (contactInformation) provider.contactInformation = contactInformation;
    if (isActive !== undefined) provider.isActive = isActive;

    await provider.save();

    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

// Delete a provider
const deleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    await provider.deleteOne();

    res.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

module.exports = {
  getAllProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider
}; 