import express from 'express';
import * as warrantyController from '../controllers/warrantyController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router
    .route('/')
    .get(protect, admin, warrantyController.getAllWarrantyRequests)
    .post(protect, warrantyController.createWarrantyRequest);

router
    .route('/:id')
    .get(protect, warrantyController.getWarrantyRequestById)
    .put(protect, warrantyController.updateWarrantyRequest)
    .delete(protect, admin, warrantyController.deleteWarrantyRequest);

export default router;