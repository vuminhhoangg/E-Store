import express from 'express';
import * as productController from '../controllers/productController.js';

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