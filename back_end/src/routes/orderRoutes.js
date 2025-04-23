import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getAllOrders, getOrderById, updateOrderStatus } from '../controllers/orderController.js'

const router = express.Router();

router.route('/').get(getAllOrders);
router.route('/:id').get(getOrderById);
router.route(':id/status').put(updateOrderStatus);

export default router;
