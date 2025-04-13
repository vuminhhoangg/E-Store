import express from 'express';
import * as warrantyController from '../controllers/warrantyController.js';

const router = express.Router();

router.route('/')
    .post(warrantyController.createWarrantyRequest) // Create a new warranty request
    .get(warrantyController.getAllWarrantyRequests); // Get all warranty requests

router.route('/:id')
    .get(warrantyController.getWarrantyRequestById) // Get a warranty request by ID
    .put(warrantyController.updateWarrantyRequest) // Update a warranty request
    .delete(warrantyController.deleteWarrantyRequest); // Delete a warranty request

export default router;