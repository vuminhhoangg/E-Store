import Warranty from '../models/Warranty.js';
import httpStatus from 'http-status';
import Product from "../models/Product.js";

// Create a new warranty request
export const createWarrantyRequest = async (req, res) => {
    try {
        const { productId, customerId } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: 'Product not found'
            });
        }

        const warrantyRequest = await Warranty.create({
            productId,
            customerId,
            endDate: new Date(Date.now() + product.warrantyPeriodMonths * 30 * 24 * 60 * 60 * 1000), // Calculate end date based on warranty period
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
        const { id } = req.params;
        const warrantyRequest = await Warranty.findById(id).populate('productId customerId');

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

export const getWarrantyRequestByCustomerId = async (req, res) => {
    try {
        const { customerId } = req.params;
        const warrantyRequests = await Warranty.find({ customerId: customerId }).populate('productId customerId');

        if (!warrantyRequests) {
            return res.status(httpStatus.NOT_FOUND).json({
                data: null,
                message: 'Warranty requests not found'
            });
        }

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
}

// Update a warranty request
export const updateWarrantyRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, description, method, price ,responseMessage } = req.body;

        const warrantyRequest = await Warranty.findById(id);

        if (!warrantyRequest) {
            return res.status(httpStatus.NOT_FOUND).json({
                data: null,
                message: 'Warranty request not found'
            });
        }

        if (status) warrantyRequest.status = status;
        if (responseMessage) warrantyRequest.responseMessage = responseMessage;
        if (method) warrantyRequest.method = method;
        if (price) warrantyRequest.price = price;
        if (description) warrantyRequest.description = description;

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
        const { id } = req.params;
        const warrantyRequest = await Warranty.findByIdAndDelete(id);

        if (!warrantyRequest) {
            return res.status(httpStatus.NOT_FOUND).json({
                data: null,
                message: 'Warranty request not found'
            });
        }

        return res.status(httpStatus.OK).json({
            data: warrantyRequest,
            message: 'Warranty request deleted successfully'
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            data: null,
            message: error.message
        });
    }
};
