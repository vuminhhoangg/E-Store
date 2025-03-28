import express from 'express';
import { authUser, registerUser, refreshToken, logout } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

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

export default router;