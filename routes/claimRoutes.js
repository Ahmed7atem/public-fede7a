const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getAllClaims,
  getClaimById,
  createClaim,
  updateClaim,
  deleteClaim
} = require('../controllers/claimController');

router.use(auth);

router.get('/', getAllClaims);
router.get('/:id', getClaimById);
router.post('/', createClaim);
router.put('/:id', updateClaim);
router.delete('/:id', deleteClaim);

module.exports = router; 