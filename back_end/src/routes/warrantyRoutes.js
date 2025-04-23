const express = require('express');
const router = express.Router();
const {
    createWarrantyClaim,
    getUserWarrantyClaims,
    getWarrantyClaimById,
    updateWarrantyClaim,
    getAdminWarrantyClaims,
    updateClaimStatus
} = require('../controllers/warrantyController');
const { protect, admin } = require('../middleware/authMiddleware');

// User routes
router.route('/')
    .post(protect, createWarrantyClaim)
    .get(protect, getUserWarrantyClaims);

router.route('/:id')
    .get(protect, getWarrantyClaimById)
    .put(protect, updateWarrantyClaim);

// Admin routes
router.route('/admin')
    .get(protect, admin, getAdminWarrantyClaims);

router.route('/admin/:id')
    .put(protect, admin, updateClaimStatus);

module.exports = router;