import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Ghi log yêu cầu xác thực
    console.log(`[Auth] Xác thực yêu cầu: ${req.method} ${req.originalUrl}`);

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (!token) {
                console.log('[Auth] Token rỗng trong header Authorization');
                res.status(401);
                throw new Error('Token không hợp lệ');
            }

            console.log(`[Auth] Đang xác thực token...`);

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(`[Auth] Token hợp lệ, userId: ${decoded.id}`);

            // Lấy thông tin người dùng từ database
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                console.log(`[Auth] Không tìm thấy người dùng với id: ${decoded.id}`);
                res.status(401);
                throw new Error('Không tìm thấy người dùng với token này');
            }

            // Kiểm tra xem tài khoản có bị khóa không
            if (user.isBlocked) {
                console.log(`[Auth] Tài khoản người dùng ${user._id} đã bị khóa`);
                res.status(401);
                throw new Error('Tài khoản của bạn đã bị khóa');
            }

            // Kiểm tra xem token có trong danh sách bị vô hiệu hóa không
            if (user.isTokenInvalid && user.isTokenInvalid(token)) {
                console.log(`[Auth] Token đã bị vô hiệu hóa cho người dùng ${user._id}`);
                res.status(401);
                throw new Error('Token đã bị vô hiệu hóa');
            }

            // Lưu thông tin vào request
            req.user = user;
            req.token = token;

            // Cập nhật thông tin thiết bị nếu có
            if (req.path !== '/api/users/logout' && user.updateDevice) {
                const userAgent = req.headers['user-agent'];
                const ipAddress = req.ip || req.connection.remoteAddress;
                try {
                    await user.updateDevice(userAgent, ipAddress);
                } catch (deviceError) {
                    console.error(`[Auth] Lỗi khi cập nhật thông tin thiết bị:`, deviceError);
                    // Không ném lỗi, tiếp tục xử lý
                }
            }

            console.log(`[Auth] Xác thực thành công cho người dùng ${user._id}`);
            next();
        } catch (error) {
            console.error(`[Auth] Lỗi xác thực: ${error.message}`, error);

            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token không hợp lệ hoặc đã bị thay đổi'
                });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token đã hết hạn, vui lòng đăng nhập lại',
                    tokenExpired: true
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: error.message || 'Không được phép, token không hợp lệ'
                });
            }
        }
    } else {
        console.log('[Auth] Không tìm thấy token trong header');
        return res.status(401).json({
            success: false,
            message: 'Không có token xác thực, từ chối truy cập'
        });
    }
});

const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        console.log(`[Auth] Xác thực quyền admin thành công cho người dùng ${req.user._id}`);
        next();
    } else {
        console.log(`[Auth] Người dùng ${req.user?._id} không có quyền admin`);
        res.status(403).json({
            success: false,
            message: 'Không được phép, chỉ admin mới có quyền truy cập'
        });
    }
};

export { protect, admin };

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
            requestPath: req.originalUrl,
            method: req.method
        });

        // Kiểm tra user đã được xác thực và có quyền admin
        if (req.user && req.user.isAdmin === true) {
            console.log(`[ADMIN CHECK] ✅ User ${req.user._id} (${req.user.userName}) has admin rights`);
            next();
        } else {
            console.log(`[ADMIN CHECK] ❌ Admin access denied:`, {
                userId: req.user?._id,
                userName: req.user?.userName,
                isAdmin: req.user?.isAdmin,
                isAdminType: typeof req.user?.isAdmin
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