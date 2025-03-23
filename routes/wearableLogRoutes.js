const express = require('express');
const router = express.Router();
const wearableLogController = require('../controllers/wearableLogController');

router.get('/:employeeId', wearableLogController.getWearableLogsByEmployeeId);
router.post('/', wearableLogController.createWearableLog);
router.put('/:id', wearableLogController.updateWearableLog);
router.delete('/:id', wearableLogController.deleteWearableLog);

module.exports = router;