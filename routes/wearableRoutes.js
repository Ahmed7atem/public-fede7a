const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getWearableData,
  createWearableData,
  updateWearableData
} = require('../controllers/wearableController');

router.use(auth);

router.get('/:employeeId', getWearableData);
router.post('/', createWearableData);
router.put('/:id', updateWearableData);

module.exports = router; 