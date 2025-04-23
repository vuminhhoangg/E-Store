import express from 'express';
import {
    getUserProfile,
    updateUserProfile,
    removeUserDevice,
    checkPhoneExists,
    getAllUsers,
    updateUser
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getAllUsers);
router.route('/:id').put(updateUser);
router.delete('/devices/:deviceId', protect, removeUserDevice);

router
    .route('/profile')
    .get(protect, admin, getUserProfile)
    .put(protect, admin, updateUserProfile);

router.get('/check-phone/:phoneNumber', checkPhoneExists);

export default router; 