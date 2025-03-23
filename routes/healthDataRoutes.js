const express = require('express');
const router = express.Router();
const healthDataController = require('../controllers/healthDataController');

router.post('/', healthDataController.addHealthData); // Using the POST endpoint
// Other health data routes...

module.exports = router;