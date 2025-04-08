import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import productRoutes from './productRoutes.js';
import cartRoutes from './cartRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

// Test route to check API connectivity
router.get('/test', (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'API is working properly',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'API test route encountered an error',
            error: error.message
        });
    }
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/admin', adminRoutes);

export default router;