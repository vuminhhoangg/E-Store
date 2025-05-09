import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

// Middleware bảo vệ các route, yêu cầu user đã đăng nhập
export const protect = async (req, res, next) => {
    try {
        console.log('=== BEGIN authMiddleware.protect ===');

        let token;

        // Kiểm tra Authorization header
        const authHeader = req.headers.authorization;
        console.log('Authorization header:', authHeader ? `${authHeader.substring(0, 15)}...` : 'not found');

        if (authHeader && authHeader.startsWith('Bearer')) {
            try {
                // Lấy token từ header
                token = authHeader.split(' ')[1];

                if (!token) {
                    console.log('Token not found in Authorization header');
                    return res.status(401).json({
                        success: false,
                        message: 'Không tìm thấy token, vui lòng đăng nhập lại'
                    });
                }

                // Verify token
                console.log('Verifying token...');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log('Token verified successfully for user:', decoded.id);

                // Tìm user theo id từ token và không trả về password
                const user = await User.findById(decoded.id).select('-password');

                if (!user) {
                    console.log('User not found with ID from token');
                    return res.status(401).json({
                        success: false,
                        message: 'Không tìm thấy user với token này'
                    });
                }

                // Gán user vào request để các route sau có thể sử dụng
                req.user = user;
                console.log('User attached to request:', user._id);
                next();
            } catch (error) {
                console.error('Error verifying token:', error.message);
                return res.status(401).json({
                    success: false,
                    message: 'Token không hợp lệ hoặc đã hết hạn'
                });
            }
        } else {
            console.log('No Authorization header with Bearer token');
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token, vui lòng đăng nhập lại'
            });
        }
    } catch (error) {
        console.error('=== ERROR in authMiddleware.protect ===', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi xác thực người dùng'
        });
    } finally {
        console.log('=== END authMiddleware.protect ===');
    }
};

// Middleware kiểm tra xem user có quyền admin hay không
export const admin = (req, res, next) => {
    console.log('=== BEGIN authMiddleware.admin ===');

    if (!req.user) {
        console.log('User không tồn tại trong request');
        return res.status(401).json({
            success: false,
            message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại'
        });
    }

    // Kiểm tra nhiều cách để xác định admin
    console.log('Kiểm tra quyền admin cho user:', {
        userId: req.user._id,
        userName: req.user.userName || req.user.username,
        role: req.user.role,
        isAdmin: req.user.isAdmin,
        isAdminType: typeof req.user.isAdmin,
        roleType: typeof req.user.role
    });

    // Kiểm tra cả hai cách: role === 'admin' hoặc isAdmin === true
    const isAdminRole = req.user.role === 'admin';
    const hasAdminFlag = req.user.isAdmin === true;

    if (isAdminRole || hasAdminFlag) {
        console.log(`User ${req.user._id} có quyền admin:`, {
            byRole: isAdminRole,
            byFlag: hasAdminFlag
        });
        next();
    } else {
        console.log(`User ${req.user._id} KHÔNG có quyền admin`, {
            role: req.user.role,
            isAdmin: req.user.isAdmin,
            method: req.method,
            path: req.originalUrl
        });
        res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập'
        });
    }

    console.log('=== END authMiddleware.admin ===');
};

// Xác thực JWT token
export const authenticateJWT = async (req, res, next) => {
    try {
        // Lấy token từ header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Không có token xác thực, vui lòng đăng nhập'
            });
        }

        const token = authHeader.split(' ')[1];

        // Xác thực token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Tìm user từ ID đã giải mã
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Người dùng không tồn tại'
                });
            }

            // Kiểm tra người dùng có bị khóa không
            if (user.isBlocked) {
                return res.status(403).json({
                    success: false,
                    message: 'Tài khoản của bạn đã bị khóa, vui lòng liên hệ với quản trị viên'
                });
            }

            // Gán thông tin user vào request để sử dụng ở middleware sau
            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực người dùng'
        });
    }
};

// Kiểm tra quyền Admin
export const isAdmin = (req, res, next) => {
    try {
        console.log(`[ADMIN CHECK] Checking admin rights for user:`, {
            userId: req.user?._id,
            userName: req.user?.userName,
            isAdmin: req.user?.isAdmin,
            role: req.user?.role,
            requestPath: req.originalUrl,
            method: req.method
        });

        // Kiểm tra user đã được xác thực và có quyền admin
        if (req.user && (req.user.isAdmin === true || req.user.role === 'admin')) {
            console.log(`[ADMIN CHECK] ✅ User ${req.user._id} (${req.user.userName}) has admin rights`);
            next();
        } else {
            console.log(`[ADMIN CHECK] ❌ Admin access denied:`, {
                userId: req.user?._id,
                userName: req.user?.userName,
                isAdmin: req.user?.isAdmin,
                isAdminType: typeof req.user?.isAdmin,
                role: req.user?.role
            });

            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập, chỉ Admin mới có thể thực hiện chức năng này'
            });
        }
    } catch (error) {
        console.error(`[ADMIN CHECK] Error checking admin rights:`, error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền admin'
        });
    }
}; 