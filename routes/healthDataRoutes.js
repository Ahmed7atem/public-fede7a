const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getHealthData,
  createHealthData,
  updateHealthData
} = require('../controllers/healthDataController');

router.use(auth);

router.get('/:employeeId', getHealthData);
router.post('/', createHealthData);
router.put('/:id', updateHealthData);

module.exports = router;