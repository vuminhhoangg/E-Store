import express from 'express';
import { authUser, registerUser } from '../controllers/authController.js';

const router = express.Router();
router.post('/login', authUser);
router.post('/register', registerUser);

router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Hello from test API!' });
});

export default router;