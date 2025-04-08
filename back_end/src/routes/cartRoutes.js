import express from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả routes đều yêu cầu xác thực
router.use(protect);

// Lấy giỏ hàng và xóa toàn bộ giỏ hàng
router.route('/')
    .get(getCart)
    .post(addToCart)
    .delete(clearCart);

// Thao tác với một sản phẩm cụ thể trong giỏ hàng
router.route('/:productId')
    .put(updateCartItem)
    .delete(removeFromCart);

export default router; 