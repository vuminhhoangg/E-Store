import Warranty from '../models/Warranty.js';
import httpStatus from 'http-status';
const asyncHandler = require('express-async-handler');
const WarrantyClaim = require('../models/WarrantyClaim');
const Order = require('../models/Order');

// Create a new warranty request
export const createWarrantyRequest = async (req, res) => {
    try {
        const { productId, customerId, description } = req.body;

        const warrantyRequest = await Warranty.create({
            productId,
            customerId,
            description
        });

        return res.status(httpStatus.CREATED).json({
            data: warrantyRequest,
            message: 'Warranty request created successfully'
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            data: null,
            message: error.message
        });
    }
};

// Get all warranty requests
export const getAllWarrantyRequests = async (req, res) => {
    try {
        const warrantyRequests = await Warranty.find().populate('productId customerId');

        return res.status(httpStatus.OK).json({
            data: warrantyRequests,
            message: 'Warranty requests retrieved successfully'
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            data: null,
            message: error.message
        });
    }
};

// Get a warranty request by ID
export const getWarrantyRequestById = async (req, res) => {
    try {
        const warrantyRequest = await Warranty.findById(req.params.id).populate('productId customerId');

        if (!warrantyRequest) {
            return res.status(httpStatus.NOT_FOUND).json({
                data: null,
                message: 'Warranty request not found'
            });
        }

        return res.status(httpStatus.OK).json({
            data: warrantyRequest,
            message: 'Warranty request retrieved successfully'
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            data: null,
            message: error.message
        });
    }
};

// Update a warranty request
export const updateWarrantyRequest = async (req, res) => {
    try {
        const { status, responseMessage, processedAt } = req.body;

        const warrantyRequest = await Warranty.findById(req.params.id);

        if (!warrantyRequest) {
            return res.status(httpStatus.NOT_FOUND).json({
                data: null,
                message: 'Warranty request not found'
            });
        }

        if (status) warrantyRequest.status = status;
        if (responseMessage) warrantyRequest.responseMessage = responseMessage;
        if (processedAt) warrantyRequest.processedAt = processedAt;

        const updatedWarrantyRequest = await warrantyRequest.save();

        return res.status(httpStatus.OK).json({
            data: updatedWarrantyRequest,
            message: 'Warranty request updated successfully'
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            data: null,
            message: error.message
        });
    }
};

// Delete a warranty request
export const deleteWarrantyRequest = async (req, res) => {
    try {
        const warrantyRequest = await Warranty.findByIdAndDelete(req.params.id);

        if (!warrantyRequest) {
            return res.status(httpStatus.NOT_FOUND).json({
                data: null,
                message: 'Warranty request not found'
            });
        }

        return res.status(httpStatus.OK).json({
            data: null,
            message: 'Warranty request deleted successfully'
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            data: null,
            message: error.message
        });
    }
};

/**
 * @desc    Create a new warranty claim
 * @route   POST /api/warranty
 * @access  Private
 */
const createWarrantyClaim = asyncHandler(async (req, res) => {
    const {
        orderId,
        orderNumber,
        productId,
        productName,
        serialNumber,
        description,
        images,
        contactName,
        contactPhone,
        contactEmail,
        contactAddress,
        warrantyStartDate,
        warrantyEndDate
    } = req.body;

    // Verify the order exists and belongs to the user
    const order = await Order.findOne({
        _id: orderId,
        orderNumber: orderNumber,
        userId: req.user._id
    });

    if (!order) {
        res.status(404);
        throw new Error('Order not found or does not belong to this user');
    }

    // Create warranty claim
    const warrantyClaim = await WarrantyClaim.create({
        userId: req.user._id,
        orderId,
        orderNumber,
        productId,
        productName,
        serialNumber,
        description,
        images: images || [],
        contactName,
        contactPhone,
        contactEmail,
        contactAddress,
        warrantyStartDate: new Date(warrantyStartDate),
        warrantyEndDate: new Date(warrantyEndDate),
        statusHistory: [
            {
                status: 'pending',
                updatedBy: req.user._id,
                notes: 'Claim submitted by customer',
                createdAt: Date.now()
            }
        ]
    });

    if (warrantyClaim) {
        res.status(201).json(warrantyClaim);
    } else {
        res.status(400);
        throw new Error('Invalid warranty claim data');
    }
});

/**
 * @desc    Get all warranty claims for the logged in user
 * @route   GET /api/warranty
 * @access  Private
 */
const getUserWarrantyClaims = asyncHandler(async (req, res) => {
    const claims = await WarrantyClaim.find({ userId: req.user._id })
        .sort({ createdAt: -1 });

    res.json(claims);
});

/**
 * @desc    Get warranty claim by ID
 * @route   GET /api/warranty/:id
 * @access  Private
 */
const getWarrantyClaimById = asyncHandler(async (req, res) => {
    const claim = await WarrantyClaim.findById(req.params.id);

    if (claim) {
        // Check if the claim belongs to the logged in user or the user is an admin
        if (claim.userId.toString() === req.user._id.toString() || req.user.isAdmin) {
            res.json(claim);
        } else {
            res.status(403);
            throw new Error('Not authorized to access this warranty claim');
        }
    } else {
        res.status(404);
        throw new Error('Warranty claim not found');
    }
});

/**
 * @desc    Update warranty claim
 * @route   PUT /api/warranty/:id
 * @access  Private
 */
const updateWarrantyClaim = asyncHandler(async (req, res) => {
    const { description, images } = req.body;

    const claim = await WarrantyClaim.findById(req.params.id);

    if (claim) {
        // Only allow updates if the claim is pending and belongs to the user
        if (claim.userId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to update this warranty claim');
        }

        if (claim.status !== 'pending') {
            res.status(400);
            throw new Error('Cannot update claim once it has been processed');
        }

        claim.description = description || claim.description;
        if (images && images.length > 0) {
            claim.images = images;
        }

        const updatedClaim = await claim.save();
        res.json(updatedClaim);
    } else {
        res.status(404);
        throw new Error('Warranty claim not found');
    }
});

/**
 * @desc    Admin: Get all warranty claims
 * @route   GET /api/warranty/admin
 * @access  Admin
 */
const getAdminWarrantyClaims = asyncHandler(async (req, res) => {
    const claims = await WarrantyClaim.find({})
        .sort({ createdAt: -1 })
        .populate('userId', 'name email');

    res.json(claims);
});

/**
 * @desc    Admin: Update warranty claim status
 * @route   PUT /api/warranty/admin/:id
 * @access  Admin
 */
const updateClaimStatus = asyncHandler(async (req, res) => {
    const { status, adminNotes, repairCost } = req.body;

    const claim = await WarrantyClaim.findById(req.params.id);

    if (claim) {
        claim.updateStatus(status, req.user._id, adminNotes);

        if (adminNotes) {
            claim.adminNotes = adminNotes;
        }

        if (repairCost !== undefined) {
            claim.repairCost = repairCost;
        }

        const updatedClaim = await claim.save();
        res.json(updatedClaim);
    } else {
        res.status(404);
        throw new Error('Warranty claim not found');
    }
});

module.exports = {
    createWarrantyClaim,
    getUserWarrantyClaims,
    getWarrantyClaimById,
    updateWarrantyClaim,
    getAdminWarrantyClaims,
    updateClaimStatus
};