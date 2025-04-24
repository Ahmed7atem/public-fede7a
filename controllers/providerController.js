const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Provider } = require('../models/schemas');

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

// Helper function to convert string ID to ObjectId if needed
const convertToObjectId = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
};

// Get all providers with filtering
router.get('/', async (req, res) => {
  try {
    const { specialty, name, city, rating } = req.query;
    
    // Build query
    const query = {};
    
    if (specialty) {
      if (!VALID_SPECIALTIES.includes(specialty)) {
        return res.status(400).json({ 
          message: 'Invalid specialty',
          validSpecialties: VALID_SPECIALTIES 
        });
      }
      query.specialty = specialty;
    }
    
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    
    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    const providers = await Provider.find(query)
      .select('name specialty city rating contactInfo')
      .sort({ rating: -1, name: 1 });

    res.json({
      count: providers.length,
      providers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get provider by name
router.get('/:name', async (req, res) => {
  try {
    const provider = await Provider.findOne({ 
      name: { $regex: req.params.name, $options: 'i' } 
    });
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get providers by specialty
router.get('/specialty/:specialty', async (req, res) => {
  try {
    const specialty = req.params.specialty;
    
    if (!VALID_SPECIALTIES.includes(specialty)) {
      return res.status(400).json({ 
        message: 'Invalid specialty',
        validSpecialties: VALID_SPECIALTIES 
      });
    }

    const providers = await Provider.find({ specialty })
      .select('name city rating contactInfo')
      .sort({ rating: -1, name: 1 });

    res.json({
      specialty,
      count: providers.length,
      providers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new provider
router.post('/', async (req, res) => {
  try {
    const { specialty } = req.body;
    
    if (specialty && !VALID_SPECIALTIES.includes(specialty)) {
      return res.status(400).json({ 
        message: 'Invalid specialty',
        validSpecialties: VALID_SPECIALTIES 
      });
    }

    const provider = new Provider(req.body);
    const newProvider = await provider.save();
    res.status(201).json(newProvider);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update provider
router.put('/:name', async (req, res) => {
  try {
    const { specialty } = req.body;
    
    if (specialty && !VALID_SPECIALTIES.includes(specialty)) {
      return res.status(400).json({ 
        message: 'Invalid specialty',
        validSpecialties: VALID_SPECIALTIES 
      });
    }

    const provider = await Provider.findOneAndUpdate(
      { name: req.params.name },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    res.json(provider);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete provider
router.delete('/:name', async (req, res) => {
  try {
    const provider = await Provider.findOneAndDelete({ name: req.params.name });
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    res.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 