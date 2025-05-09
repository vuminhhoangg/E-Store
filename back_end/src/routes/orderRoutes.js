import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getAllOrders, getOrderById, updateOrderStatus, createOrder, getUserOrders, startOrderWarranty } from '../controllers/orderController.js'

const router = express.Router();

// Tạo đơn hàng mới
router.route('/')
    .post(protect, createOrder)
    .get(protect, admin, getAllOrders); // Get all orders - admin only

// Lấy danh sách đơn hàng của người dùng đang đăng nhập
router.route('/user')
    .get(protect, getUserOrders);

// Lấy thông tin đơn hàng theo ID
router.route('/:id')
    .get(protect, getOrderById);

// Cập nhật trạng thái đơn hàng (Admin)
router.route('/:id/status')
    .put(protect, admin, updateOrderStatus);

// Kích hoạt bảo hành cho đơn hàng
router.route('/:id/warranty/start')
    .put(protect, admin, startOrderWarranty);

export default router;
