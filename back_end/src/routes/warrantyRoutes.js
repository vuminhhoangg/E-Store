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

// 2. Routes cho warranty claims - từ cụ thể nhất đến chung nhất 
// 2.1 GET /warranty/claims - Lấy tất cả yêu cầu bảo hành cho admin 
router
    .route('/claims')
    .get(protect, admin, warrantyController.getAllWarrantyClaims);

// 2.1.5 Route để lấy yêu cầu bảo hành của user hiện tại
router
    .route('/my-claims')
    .get(protect, warrantyController.getUserWarrantyClaims);

// 2.2 POST /warranty/claims/order/:orderItemId - Tạo yêu cầu bảo hành mới cho một item
router
    .route('/claims/order/:orderItemId')
    .post(protect, warrantyController.createWarrantyClaim);

// 2.3 GET, PUT /warranty/claims/:id - Xem chi tiết và cập nhật trạng thái yêu cầu bảo hành
router
    .route('/claims/:id')
    .get(protect, warrantyController.getWarrantyClaimById)
    .put(protect, warrantyController.updateWarrantyClaimStatus);

// 3. Route cho warranty request id - PHẢI ĐỂ Ở CUỐI CÙNG
// vì /:id sẽ bắt tất cả các route khác như /claims nếu đặt trước
router
    .route('/:id')
    .get(protect, warrantyController.getWarrantyRequestById)
    .put(protect, warrantyController.updateWarrantyRequest)
    .delete(protect, admin, warrantyController.deleteWarrantyRequest);

export default router;