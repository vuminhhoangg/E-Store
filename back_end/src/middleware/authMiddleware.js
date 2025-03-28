import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Lấy thông tin người dùng từ database
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                res.status(401);
                throw new Error('Không tìm thấy người dùng với token này');
            }

            // Kiểm tra xem tài khoản có bị khóa không
            if (user.isBlocked) {
                res.status(401);
                throw new Error('Tài khoản của bạn đã bị khóa');
            }

            // Kiểm tra xem token có trong danh sách bị vô hiệu hóa không
            if (user.isTokenInvalid(token)) {
                res.status(401);
                throw new Error('Token đã bị vô hiệu hóa');
            }

            // Lưu thông tin vào request
            req.user = user;
            req.token = token;

            // Cập nhật thông tin thiết bị nếu có
            if (req.path !== '/api/users/logout') {
                const userAgent = req.headers['user-agent'];
                const ipAddress = req.ip || req.connection.remoteAddress;
                await user.updateDevice(userAgent, ipAddress);
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401);

            if (error.name === 'JsonWebTokenError') {
                throw new Error('Token không hợp lệ');
            } else if (error.name === 'TokenExpiredError') {
                throw new Error('Token đã hết hạn');
            } else {
                throw new Error('Không được phép, token không hợp lệ');
            }
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Không có token, từ chối truy cập');
    }
});

const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(401);
        throw new Error('Không được phép, chỉ admin mới có quyền truy cập');
    }
};

export { protect, admin }; 