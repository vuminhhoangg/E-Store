import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import productRoutes from './productRoutes.js';
import cartRoutes from './cartRoutes.js';
import orderRoutes from './orderRoutes.js';
import warrantyRoutes from "./warrantyRoutes.js";
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Debug routes
router.get('/check', (req, res) => {
    console.log('API check route accessed');
    res.json({ success: true, message: "API đang hoạt động bình thường" });
});

// Kiểm tra phiên đăng nhập
router.get('/auth/check-session', protect, (req, res) => {
    res.json({
        success: true,
        message: "Phiên đăng nhập hợp lệ",
        user: {
            id: req.user._id,
            isAdmin: req.user.isAdmin === true || req.user.role === 'admin'
        }
    });
});

// Kiểm tra quyền admin
router.get('/auth/verify-admin', protect, admin, (req, res) => {
    res.json({
        success: true,
        message: "Người dùng có quyền admin",
        adminInfo: {
            id: req.user._id,
            role: req.user.role || 'user',
            isAdmin: req.user.isAdmin === true
        }
    });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/warranty', warrantyRoutes);

export default router;