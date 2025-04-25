const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Provider, Review } = require('../models/schemas');

// List of valid specialties
const VALID_SPECIALTIES = [
  'Allergist', 'Andrologist', 'Anesthesiologist', 'Audiologist',
  'Cardiologist', 'Cardiothoracic Surgeon', 'Dentist', 'Dermatologist',
  'Endocrinologist', 'ENT Doctor', 'Family Doctor', 'Gastroenterologist',
  'General Surgeon', 'Gynecologist', 'Hematologist', 'Hepatologist',
  'Infertility Specialist', 'Internist', 'Laboratory', 'Nephrologist',
  'Neurologist', 'Neurosurgeon', 'Nutritionist', 'Obesity Surgeon',
  'Oncologist', 'Ophthalmologist', 'Orthopedist', 'Pediatric Surgeon',
  'Pediatrician', 'Phoniater', 'Physiotherapist', 'Plastic Surgeon',
  'Psychiatrist', 'Pulmonologist', 'Rheumatologist', 'Scan Center',
  'Spinal Surgeon', 'Surgical Oncologist', 'Urologist', 'Vascular Surgeon'
];

// Helper function to handle both UUID and ObjectId
const convertToObjectId = (id) => {
  if (!id) {
    throw new Error('ID is required');
  }
  // If it's a UUID, return it as is
  if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return id;
  }
  // If it's a valid ObjectId, convert it
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  throw new Error('Invalid ID format');
};

// Get all providers with optional filtering
router.get('/', async (req, res) => {
  try {
    const { specialty, city, rating, sortBy = 'rating.average' } = req.query;
    
    // Build query
    const query = {};
    
    if (specialty) {
      query.specialty = specialty;
    }
    
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }
    
    if (rating) {
      query['rating.average'] = { $gte: parseFloat(rating) };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = -1; // Default to descending order

    const providers = await Provider.find(query)
      .sort(sort)
      .select('name specialty location contactInfo rating experience');

    res.json({
      count: providers.length,
      providers
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ 
      message: 'Error fetching providers',
      error: error.message 
    });
  }
});

// Get provider by ID with reviews
router.get('/:id', async (req, res) => {
  try {
    const providerId = convertToObjectId(req.params.id);
    
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Get reviews for this provider
    const reviews = await Review.find({ providerId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      provider,
      reviews: {
        count: reviews.length,
        averageRating: provider.rating.average,
        totalReviews: provider.rating.count,
        recentReviews: reviews
      }
    });
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({ 
      message: 'Error fetching provider',
      error: error.message 
    });
  }
});

// Get providers by specialty
router.get('/specialty/:specialty', async (req, res) => {
  try {
    const { specialty } = req.params;
    const { city, rating } = req.query;

    const query = { specialty };
    
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }
    
    if (rating) {
      query['rating.average'] = { $gte: parseFloat(rating) };
    }

    const providers = await Provider.find(query)
      .sort({ 'rating.average': -1 })
      .select('name location contactInfo rating experience');

    res.json({
      specialty,
      count: providers.length,
      providers
    });
  } catch (error) {
    console.error('Error fetching providers by specialty:', error);
    res.status(500).json({ 
      message: 'Error fetching providers by specialty',
      error: error.message 
    });
  }
});

// Create new provider
router.post('/', async (req, res) => {
  try {
    const provider = new Provider(req.body);
    const newProvider = await provider.save();
    res.status(201).json(newProvider);
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(400).json({ 
      message: 'Error creating provider',
      error: error.message 
    });
  }
});

// Add review for provider
router.post('/:id/reviews', async (req, res) => {
  try {
    const providerId = convertToObjectId(req.params.id);
    const {
      patientId,
      rating,
      comment,
      visitDate,
      treatmentType,
      waitTime,
      staffFriendliness,
      facilityCleanliness,
      wouldRecommend
    } = req.body;

    // Validate required fields
    if (!patientId || !rating) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['patientId', 'rating']
      });
    }

    // Create new review
    const review = new Review({
      providerId,
      patientId,
      rating,
      comment,
      visitDate,
      treatmentType,
      waitTime,
      staffFriendliness,
      facilityCleanliness,
      wouldRecommend
    });

    await review.save();

    // Update provider's rating
    const provider = await Provider.findById(providerId);
    if (provider) {
      const totalRating = provider.rating.average * provider.rating.count;
      provider.rating.count += 1;
      provider.rating.average = (totalRating + rating) / provider.rating.count;
      await provider.save();
    }

    res.status(201).json(review);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(400).json({ 
      message: 'Error adding review',
      error: error.message 
    });
  }
});

// Get provider reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const providerId = convertToObjectId(req.params.id);
    const { sortBy = 'createdAt', limit = 10, page = 1 } = req.query;

    const reviews = await Review.find({ providerId })
      .sort({ [sortBy]: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments({ providerId });

    res.json({
      count: reviews.length,
      total: totalReviews,
      page: parseInt(page),
      totalPages: Math.ceil(totalReviews / limit),
      reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ 
      message: 'Error fetching reviews',
      error: error.message 
    });
  }
});

// Update provider
router.put('/:id', async (req, res) => {
  try {
    const providerId = convertToObjectId(req.params.id);
    
    const provider = await Provider.findOneAndUpdate(
      { _id: providerId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    res.json(provider);
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(400).json({ 
      message: 'Error updating provider',
      error: error.message 
    });
  }
});

// Delete provider
router.delete('/:id', async (req, res) => {
  try {
    const providerId = convertToObjectId(req.params.id);
    
    const provider = await Provider.findOneAndDelete({ _id: providerId });
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    res.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({ 
      message: 'Error deleting provider',
      error: error.message 
    });
  }
});

module.exports = router; 