const mongoose = require('mongoose');
const Provider = require('../../models/Provider');

// Helper function to transform provider data
const transformProviderData = (provider) => {
  const transformed = provider.toObject();
  
  // Transform coordinates
  if (transformed.coordinates?.coordinates) {
    transformed.latitude = transformed.coordinates.coordinates[1];
    transformed.longitude = transformed.coordinates.coordinates[0];
    delete transformed.coordinates;
  }

  // Convert arrays to comma-separated strings
  const arrayFields = [
    'phone',
    'specialties',
    'departments',
    'diagnosticServices',
    'acceptedPlans',
    'paymentMethods',
    'languages',
    'amenities'
  ];

  arrayFields.forEach(field => {
    if (Array.isArray(transformed[field])) {
      // Format phone numbers specially
      if (field === 'phone') {
        transformed[field] = transformed[field].map(phone => {
          const digits = phone.replace(/\D/g, '');
          if (digits.length === 12) {
            return `+${digits.slice(0,2)} ${digits.slice(2,4)} ${digits.slice(4,7)} ${digits.slice(7)}`;
          }
          return phone;
        }).join(', ');
      } else {
        transformed[field] = transformed[field].join(', ');
      }
    }
  });

  // Format boolean fields
  const booleanFields = [
    'emergencyAvailable',
    'icu',
    'parking',
    'internationalServices',
    'medicalTourism',
    'translationServices',
    'isInNetwork'
  ];
  
  booleanFields.forEach(field => {
    if (field in transformed) {
      transformed[field] = transformed[field] ? 'Yes' : 'No';
    }
  });

  // Format currency values
  if (transformed.averageClaimAmount) {
    transformed.averageClaimAmount = `EGP ${transformed.averageClaimAmount.toLocaleString()}`;
  }

  // Format rating display
  if (transformed.rating && transformed.ratingCount) {
    transformed.ratingDisplay = `${transformed.rating.toFixed(1)} (${transformed.ratingCount} reviews)`;
  }

  // Clean up MongoDB specific fields
  delete transformed.__v;
  delete transformed.createdAt;
  delete transformed.updatedAt;
  delete transformed._id;

  return transformed;
};

/**
 * @desc    Get all providers with optional filtering
 * @route   GET /api/providers
 * @access  Public
 */
const getAllProviders = async (req, res) => {
  try {
    const { type, specialty, city, rating, longitude, latitude, radius } = req.query;
    const query = {};

    // Basic filters
    if (type) query.type = { $regex: type, $options: 'i' };
    if (specialty) query.specialties = { $regex: specialty, $options: 'i' };
    if (city) query.city = { $regex: city, $options: 'i' };
    if (rating) query.rating = { $gte: parseFloat(rating) };

    let providers;
    
    // If location parameters are provided, use $geoNear aggregation
    if (longitude && latitude && radius) {
      providers = await Provider.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            distanceField: 'distance', // Distance in meters
            maxDistance: parseFloat(radius) * 1000, // Convert km to meters
            spherical: true,
            query: query // Apply other filters
          }
        },
        {
          $addFields: {
            distanceInKm: { $divide: ['$distance', 1000] } // Convert meters to kilometers
          }
        }
      ]);
    } else {
      // Regular find query without geospatial search
      providers = await Provider.find(query);
    }

    // Transform the results
    const transformedProviders = providers.map(provider => {
      const transformed = provider.toObject ? provider.toObject() : provider;
      
      // Transform coordinates if they exist
      if (transformed.location?.coordinates) {
        transformed.latitude = transformed.location.coordinates[1];
        transformed.longitude = transformed.location.coordinates[0];
        delete transformed.location;
      }

      // Add distance if it exists
      if (transformed.distanceInKm) {
        transformed.distance = `${transformed.distanceInKm.toFixed(2)} km`;
      }

      // Format arrays as comma-separated strings
      const arrayFields = [
        'phone',
        'specialties',
        'departments',
        'diagnosticServices',
        'acceptedPlans',
        'paymentMethods',
        'languages',
        'amenities'
      ];

      arrayFields.forEach(field => {
        if (Array.isArray(transformed[field])) {
          transformed[field] = transformed[field].join(', ');
        }
      });

      // Format boolean fields
      const booleanFields = [
        'emergencyAvailable',
        'icu',
        'parking',
        'internationalServices',
        'medicalTourism',
        'translationServices',
        'isInNetwork'
      ];
      
      booleanFields.forEach(field => {
        if (field in transformed) {
          transformed[field] = transformed[field] ? 'Yes' : 'No';
        }
      });

      // Format currency values
      if (transformed.averageClaimAmount) {
        transformed.averageClaimAmount = `EGP ${transformed.averageClaimAmount.toLocaleString()}`;
      }

      // Format rating display
      if (transformed.rating && transformed.ratingCount) {
        transformed.ratingDisplay = `${transformed.rating.toFixed(1)} (${transformed.ratingCount} reviews)`;
      }

      return transformed;
    });

    res.json({
      success: true,
      count: transformedProviders.length,
      data: transformedProviders
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching providers', 
      error: error.message 
    });
  }
};

/**
 * @desc    Get providers by type (Hospital, Doctor, Lab)
 * @route   GET /api/providers/type/:type
 * @access  Public
 */
const getProvidersByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { specialty, city, rating } = req.query;
    const query = { type };

    // Add additional filters if provided
    if (specialty) query.specialties = specialty;
    if (city) query.city = city;
    if (rating) query.rating = { $gte: parseFloat(rating) };

    const providers = await Provider.find(query);
    const transformedProviders = providers.map(transformProviderData);
    res.json(transformedProviders);
  } catch (error) {
    console.error('Error fetching providers by type:', error);
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
    const provider = await Provider.findOne({ id: req.params.id });
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    const transformedProvider = transformProviderData(provider);
    res.json(transformedProvider);
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
    const { specialty } = req.params;
    const { type, city, rating } = req.query;
    const query = { specialties: specialty };

    // Add additional filters if provided
    if (type) query.type = type;
    if (city) query.city = city;
    if (rating) query.rating = { $gte: parseFloat(rating) };

    const providers = await Provider.find(query);
    const transformedProviders = providers.map(transformProviderData);
    res.json(transformedProviders);
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

/**
 * @desc    Search providers with various filters
 * @route   POST /api/providers/search
 * @access  Public
 */
const searchProviders = async (req, res) => {
  try {
    const {
      longitude,
      latitude,
      radius,
      area,
      providerName,
      type,
      speciality
    } = req.body;

    // Build query based on provided filters
    const query = {};

    // Location-based search using geospatial query
    if (longitude && latitude && radius) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      };
    }

    // Area-based search
    if (area) {
      query.area = { $regex: area, $options: 'i' };
    }

    // Provider name search
    if (providerName) {
      query.name = { $regex: providerName, $options: 'i' };
    }

    // Provider type search
    if (type) {
      query.type = { $regex: type, $options: 'i' };
    }

    // Speciality search
    if (speciality) {
      query.specialties = { $regex: speciality, $options: 'i' };
    }

    // Execute query
    const providers = await Provider.find(query)
      .select('-__v')
      .lean();

    // Transform the results
    const transformedProviders = providers.map(provider => {
      const transformed = { ...provider };
      
      // Transform coordinates if they exist
      if (transformed.location?.coordinates) {
        transformed.latitude = transformed.location.coordinates[1];
        transformed.longitude = transformed.location.coordinates[0];
        delete transformed.location;
      }

      // Format arrays as comma-separated strings
      const arrayFields = [
        'phone',
        'specialties',
        'departments',
        'diagnosticServices',
        'acceptedPlans',
        'paymentMethods',
        'languages',
        'amenities'
      ];

      arrayFields.forEach(field => {
        if (Array.isArray(transformed[field])) {
          transformed[field] = transformed[field].join(', ');
        }
      });

      // Format boolean fields
      const booleanFields = [
        'emergencyAvailable',
        'icu',
        'parking',
        'internationalServices',
        'medicalTourism',
        'translationServices',
        'isInNetwork'
      ];
      
      booleanFields.forEach(field => {
        if (field in transformed) {
          transformed[field] = transformed[field] ? 'Yes' : 'No';
        }
      });

      // Format currency values
      if (transformed.averageClaimAmount) {
        transformed.averageClaimAmount = `EGP ${transformed.averageClaimAmount.toLocaleString()}`;
      }

      // Format rating display
      if (transformed.rating && transformed.ratingCount) {
        transformed.ratingDisplay = `${transformed.rating.toFixed(1)} (${transformed.ratingCount} reviews)`;
      }

      return transformed;
    });

    res.json({
      success: true,
      count: transformedProviders.length,
      data: transformedProviders
    });
  } catch (error) {
    console.error('Error searching providers:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching providers',
      error: error.message
    });
  }
};

module.exports = {
  getAllProviders,
  getProviderById,
  getProvidersByType,
  getProvidersBySpecialty,
  createProvider,
  addReview,
  getProviderReviews,
  getCategories,
  getSpecializations,
  searchProviders
}; 