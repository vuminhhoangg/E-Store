import express from 'express';
import * as productController from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router
    .route('/')
    .get(productController.getProductList)
    .post(productController.createProduct);

router
    .route('/:id')
    .get(productController.getProductById)
    .put(productController.updateProduct);

export default router;