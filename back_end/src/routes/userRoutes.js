import express from 'express';
import {
    authUser,
    registerUser,
    getUserProfile,
    updateUserProfile,
    logoutUser,
    removeUserDevice,
    refreshToken,
    changePassword,
    checkPhoneExists
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(registerUser);
router.post('/login', authUser);
router.post('/logout', protect, logoutUser);
router.post('/refresh-token', protect, refreshToken);
router.put('/change-password', protect, changePassword);
router.delete('/devices/:deviceId', protect, removeUserDevice);

router
    .route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.get('/check-phone/:phoneNumber', checkPhoneExists);

export default router; 