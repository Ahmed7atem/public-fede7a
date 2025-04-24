const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint
} = require('../controllers/complaintController');

router.use(auth);

router.get('/', getAllComplaints);
router.get('/:id', getComplaintById);
router.post('/', createComplaint);
router.put('/:id', updateComplaint);
router.delete('/:id', deleteComplaint);

module.exports = router; 