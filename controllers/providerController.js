const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Review } = require('../models/schemas');

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
    const { specialty, city, rating, sortBy = 'avg_rate' } = req.query;
    
    // Build query
    const query = {};
    
    if (specialty) {
      query.specialization = specialty;
    }
    
    if (city) {
      query.clinic_location = { $regex: city, $options: 'i' };
    }
    
    if (rating) {
      query.avg_rate = { $gte: parseFloat(rating) };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = -1; // Default to descending order

    const providers = await mongoose.connection.db.collection('doctors')
      .find(query)
      .sort(sort)
      .project({
        _id: 1,
        specialization: 1,
        clinic_location: 1,
        fees: 1,
        avg_rate: 1,
        waiting_time: 1,
        rate_count: 1
      })
      .toArray();

    res.json({
      count: providers.length,
      providers: providers.map(provider => ({
        id: provider._id,
        name: provider.specialization,
        specialty: provider.specialization,
        location: {
          city: provider.clinic_location
        },
        fees: provider.fees,
        rating: {
          average: provider.avg_rate,
          count: provider.rate_count
        },
        waitingTime: provider.waiting_time
      }))
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
    
    const provider = await mongoose.connection.db.collection('doctors')
      .findOne({ _id: providerId });
      
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Get reviews for this provider
    const reviews = await Review.find({ providerId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      provider: {
        id: provider._id,
        name: provider.specialization,
        specialty: provider.specialization,
        location: {
          city: provider.clinic_location
        },
        fees: provider.fees,
        rating: {
          average: provider.avg_rate,
          count: provider.rate_count
        },
        waitingTime: provider.waiting_time
      },
      reviews: {
        count: reviews.length,
        averageRating: provider.avg_rate,
        totalReviews: provider.rate_count,
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

    const query = { specialization: specialty };
    
    if (city) {
      query.clinic_location = { $regex: city, $options: 'i' };
    }
    
    if (rating) {
      query.avg_rate = { $gte: parseFloat(rating) };
    }

    const providers = await mongoose.connection.db.collection('doctors')
      .find(query)
      .sort({ avg_rate: -1 })
      .project({
        _id: 1,
        specialization: 1,
        clinic_location: 1,
        fees: 1,
        avg_rate: 1,
        waiting_time: 1,
        rate_count: 1
      })
      .toArray();

    res.json({
      specialty,
      count: providers.length,
      providers: providers.map(provider => ({
        id: provider._id,
        name: provider.specialization,
        specialty: provider.specialization,
        location: {
          city: provider.clinic_location
        },
        fees: provider.fees,
        rating: {
          average: provider.avg_rate,
          count: provider.rate_count
        },
        waitingTime: provider.waiting_time
      }))
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
    const provider = await mongoose.connection.db.collection('doctors')
      .insertOne(req.body);
    res.status(201).json(provider);
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(400).json({ 
      message: 'Error creating provider',
      error: error.message 
    });
  }
});

// Update provider
router.put('/:id', async (req, res) => {
  try {
    const providerId = convertToObjectId(req.params.id);
    
    const provider = await mongoose.connection.db.collection('doctors')
      .findOneAndUpdate(
        { _id: providerId },
        { $set: req.body },
        { returnDocument: 'after' }
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
    
    const provider = await mongoose.connection.db.collection('doctors')
      .findOneAndDelete({ _id: providerId });
    
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