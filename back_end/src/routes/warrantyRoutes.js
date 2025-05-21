import express from 'express';
import * as warrantyController from '../controllers/warrantyController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// QUAN TRỌNG: Express xử lý routes theo thứ tự đăng ký, từ trên xuống dưới
// 1. Routes cho chính sản phẩm bảo hành
router
    .route('/')
    .get(protect, admin, warrantyController.getAllWarrantyRequests)
    .post(protect, warrantyController.createWarrantyRequest);

// 1.5 Route đặc biệt cho danh sách sản phẩm đang bảo hành
router
    .route('/products')
    .get(protect, admin, warrantyController.getAllProductsUnderWarranty);

// Thêm route để lấy danh sách bảo hành của người dùng hiện tại từ bảng Warranty
router
    .route('/user')
    .get(protect, warrantyController.getWarrantyRequestByCustomerId);

// 3. Route cho warranty request id - PHẢI ĐỂ Ở CUỐI CÙNG
// vì /:id sẽ bắt tất cả các route khác như /claims nếu đặt trước
router
    .route('/:id')
    .get(protect, warrantyController.getWarrantyRequestById)
    .put(protect, warrantyController.updateWarrantyRequest)
    .delete(protect, admin, warrantyController.deleteWarrantyRequest);

export default router;