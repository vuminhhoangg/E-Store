import express from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getTopProducts,
    adminUpdateProduct
} from '../controllers/productController.js';
import { protect, admin, authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')   // /api/products
    .get(getProducts)    ///api/admin/products
    .post(protect, admin, createProduct);

router.route('/top')
    .get(getTopProducts);

router.route('/:id')
    .get(getProductById)
    .put(admin, updateProduct)
    .delete(protect, admin, deleteProduct);

export default router;