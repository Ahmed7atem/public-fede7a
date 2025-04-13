const Joi = require('joi');

// Validation schemas
const schemas = {
  // Auth schemas
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6)
  }),

  register: Joi.object({
    name: Joi.string().required().min(2).max(100),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
    role: Joi.string().valid('admin', 'employee').default('employee')
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    currentPassword: Joi.string().min(6),
    newPassword: Joi.string().min(6)
  }),

  // Employee schema
  employee: Joi.object({
    name: Joi.string().required().min(2).max(100),
    email: Joi.string().email().required(),
    age: Joi.number().integer().min(18).max(100),
    gender: Joi.string().valid('Male', 'Female', 'Other'),
    children: Joi.number().integer().min(0),
    smoker: Joi.boolean(),
    role: Joi.string().valid('admin', 'employee')
  }),

  // Health data schema
  healthData: Joi.object({
    weight: Joi.number().min(30).max(300),
    height: Joi.number().min(100).max(250),
    systolic: Joi.number().min(70).max(200),
    diastolic: Joi.number().min(40).max(130),
    cholesterol: Joi.number().min(100).max(400),
    bloodSugar: Joi.number().min(50).max(400),
    smoker: Joi.boolean()
  }),

  // Wearable data schema
  wearableData: Joi.object({
    stepCount: Joi.number().integer().min(0),
    activeEnergy: Joi.number().min(0),
    exerciseTime: Joi.number().min(0),
    heartRate: Joi.number().integer().min(30).max(200),
    heartRateVariability: Joi.number().min(0),
    sleepQuality: Joi.number().min(0).max(100),
    timeInBed: Joi.number().min(0),
    walkingDistance: Joi.number().min(0)
  }),

  // Prediction schema
  prediction: Joi.object({
    employeeId: Joi.string().required(),
    healthData: Joi.object({
      weight: Joi.number().min(30).max(300),
      height: Joi.number().min(100).max(250),
      systolic: Joi.number().min(70).max(200),
      diastolic: Joi.number().min(40).max(130),
      cholesterol: Joi.number().min(100).max(400),
      bloodSugar: Joi.number().min(50).max(400),
      smoker: Joi.boolean()
    }).required()
  })
};

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({ errors: errorMessages });
    }

    next();
  };
};

module.exports = {
  schemas,
  validate
}; 