import express from 'express';
import { authenticateJWT, isAdmin } from '../middleware/authMiddleware.js';
import * as userController from '../controllers/userController.js';
import * as productController from '../controllers/productController.js';
import * as orderController from '../controllers/orderController.js';

const router = express.Router();

// Middleware xác thực và phân quyền admin
//router.use(authenticateJWT, isAdmin);
//
// // ===== Quản lý người dùng =====
// // Lấy danh sách tất cả người dùng
// router.get('/users', userController.getAllUsers);
//
// // Thêm người dùng mới (từ admin)
// router.post('/users', userController.createUser);
//
// // Cập nhật thông tin người dùng
// router.put('/users/:id', userController.updateUser);
//
// // Khóa/mở khóa tài khoản người dùng
// router.put('/users/:id/block', userController.toggleBlockUser);
//
// // Xóa tài khoản người dùng
// router.delete('/users/:id', userController.deleteUser);
//
// // ===== Quản lý sản phẩm =====
// // Lấy danh sách tất cả sản phẩm (bao gồm cả đã ẩn)
//router.get('/products', productController.adminGetAllProducts);
//
// // Lấy thông tin sản phẩm theo ID
// router.get('/products/:id', productController.adminGetProductById);
//
// // Thêm sản phẩm mới
// router.post('/products', productController.adminCreateProduct);
//
// // Cập nhật thông tin sản phẩm
// router.put('/products/:id', productController.adminUpdateProduct);
//
// // Xóa sản phẩm
// router.delete('/products/:id', productController.adminDeleteProduct);
//
// // ===== Quản lý đơn hàng =====
// // Lấy danh sách tất cả đơn hàng
// router.get('/orders', orderController.getAllOrders);
//
// // Lấy chi tiết đơn hàng
// router.get('/orders/:id', orderController.getOrderById);
//
// // Cập nhật trạng thái đơn hàng
// router.put('/orders/:id/status', orderController.updateOrderStatus);

export default router;