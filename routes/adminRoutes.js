const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/all-data', adminController.getAllDataHandler);

module.exports = router;