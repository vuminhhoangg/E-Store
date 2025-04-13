import Warranty from '../models/Warranty.js';
import httpStatus from 'http-status';

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