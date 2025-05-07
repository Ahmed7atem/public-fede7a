const mongoose = require('mongoose');

/**
 * @desc    Get all providers
 * @route   GET /api/providers
 * @access  Public
 */
const getAllProviders = async (req, res) => {
  try {
    // This is a mock response since we don't have a provider model yet
    const providers = [
      {
        id: '1',
        name: 'Dr. John Smith',
        specialty: 'Cardiologist',
        location: {
          city: 'New York',
          address: '123 Medical Center Dr'
        },
        rating: 4.8
      },
      {
        id: '2',
        name: 'Dr. Sarah Johnson',
        specialty: 'Dermatologist',
        location: {
          city: 'Los Angeles',
          address: '456 Healthcare Ave'
        },
        rating: 4.5
      }
    ];
    
    res.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ message: 'Error fetching providers', error: error.message });
  }
};

/**
 * @desc    Get provider by ID
 * @route   GET /api/providers/:id
 * @access  Public
 */
const getProviderById = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Mock provider data
    const provider = {
      id,
      name: 'Dr. John Smith',
      specialty: 'Cardiologist',
      location: {
        city: 'New York',
        address: '123 Medical Center Dr',
        coordinates: {
          lat: 40.7128,
          lng: -74.0060
        }
      },
      contactInfo: {
        phone: '(555) 123-4567',
        email: 'dr.smith@example.com',
        website: 'www.drsmith.com'
      },
      rating: 4.8,
      reviews: [
        {
          id: '101',
          patientId: 'patient-123',
          rating: 5,
          comment: 'Excellent service and very professional',
          visitDate: '2024-03-20'
        }
      ]
    };
    
    res.json(provider);
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({ message: 'Error fetching provider', error: error.message });
  }
};

/**
 * @desc    Get providers by specialty
 * @route   GET /api/providers/specialty/:specialty
 * @access  Public
 */
const getProvidersBySpecialty = async (req, res) => {
  try {
    const specialty = req.params.specialty;
    
    // Mock providers data
    const providers = [
      {
        id: '1',
        name: 'Dr. John Smith',
        specialty,
        location: {
          city: 'New York',
          address: '123 Medical Center Dr'
        },
        rating: 4.8
      },
      {
        id: '3',
        name: 'Dr. Michael Brown',
        specialty,
        location: {
          city: 'Chicago',
          address: '789 Health Street'
        },
        rating: 4.7
      }
    ];
    
    res.json(providers);
  } catch (error) {
    console.error('Error fetching providers by specialty:', error);
    res.status(500).json({ message: 'Error fetching providers', error: error.message });
  }
};

/**
 * @desc    Create a new provider
 * @route   POST /api/providers
 * @access  Private/Admin
 */
const createProvider = async (req, res) => {
  try {
    // Mock response for creating a provider
    const newProvider = {
      id: new mongoose.Types.ObjectId().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json(newProvider);
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(500).json({ message: 'Error creating provider', error: error.message });
  }
};

/**
 * @desc    Add a review for a provider
 * @route   POST /api/providers/:id/reviews
 * @access  Private
 */
const addReview = async (req, res) => {
  try {
    const providerId = req.params.id;
    
    // Mock response for adding a review
    const newReview = {
      id: new mongoose.Types.ObjectId().toString(),
      providerId,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Error adding review', error: error.message });
  }
};

/**
 * @desc    Get provider reviews
 * @route   GET /api/providers/:id/reviews
 * @access  Public
 */
const getProviderReviews = async (req, res) => {
  try {
    const providerId = req.params.id;
    
    // Mock reviews data
    const reviews = [
      {
        id: '101',
        providerId,
        patientId: 'patient-123',
        rating: 5,
        comment: 'Excellent service and very professional',
        visitDate: '2024-03-20',
        createdAt: '2024-03-22T14:30:00Z'
      },
      {
        id: '102',
        providerId,
        patientId: 'patient-456',
        rating: 4,
        comment: 'Good doctor, but had to wait a bit',
        visitDate: '2024-03-15',
        createdAt: '2024-03-16T10:15:00Z'
      }
    ];
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching provider reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

/**
 * @desc    Get all categories
 * @route   GET /api/providers/categories
 * @access  Public
 */
const getCategories = async (req, res) => {
  try {
    // Mock categories data
    const categories = [
      'Primary Care',
      'Specialist',
      'Hospital',
      'Clinic',
      'Laboratory',
      'Pharmacy'
    ];
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

/**
 * @desc    Get all specializations
 * @route   GET /api/providers/specializations
 * @access  Public
 */
const getSpecializations = async (req, res) => {
  try {
    // Mock specializations data
    const specializations = [
      'Cardiology',
      'Dermatology',
      'Neurology',
      'Orthopedics',
      'Pediatrics',
      'Psychiatry',
      'Urology'
    ];
    
    res.json(specializations);
  } catch (error) {
    console.error('Error fetching specializations:', error);
    res.status(500).json({ message: 'Error fetching specializations', error: error.message });
  }
};

module.exports = {
  getAllProviders,
  getProviderById,
  getProvidersBySpecialty,
  createProvider,
  addReview,
  getProviderReviews,
  getCategories,
  getSpecializations
}; 