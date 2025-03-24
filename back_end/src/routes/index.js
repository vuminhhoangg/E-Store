import express from 'express';
import authRouters from './authRoutes.js';
import productsRouters from './productRoutes.js';

const router = express.Router();

router.use('/auth', authRouters);
router.use('/products', productsRouters);

export default router;