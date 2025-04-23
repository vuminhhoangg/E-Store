import express from 'express';
import { authUser, registerUser, refreshToken, logout, verifyAdmin } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { deleteUser, changePassword } from '../controllers/userController.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.delete('/delete-user/:id', deleteUser);
router.put('/change-password', protect, changePassword);

// Protected routes
router.get('/profile', protect, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user._id,
            userName: req.user.userName,
            phoneNumber: req.user.phoneNumber,
            diaChi: req.user.diaChi
        }
    });
});

router.post('/protected-logout', protect, (req, res) => {
    logout(req, res);
});

router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Hello from test API!' });
});

// Admin verification
router.get('/verify-admin', protect, verifyAdmin);

export default router;