import User from '../models/User.js';
import asyncHandler from 'express-async-handler';
import { generateTokens, verifyRefreshToken, invalidateToken } from '../utils/jwt.js';
import { isValidObjectId } from 'mongoose';
import httpStatus from 'http-status';

const authUser = asyncHandler(async (req, res) => {
    const { phoneNumber, password } = req.body;

    console.log('Login attempt:', { phoneNumber, timestamp: new Date().toISOString() });

    if (!phoneNumber || !password) {
        res.status(400);
        throw new Error('Vui lòng nhập số điện thoại và mật khẩu');
    }

    // Thêm giới hạn thời gian xử lý để ngăn timing attacks
    const startTime = Date.now();

    const user = await User.findOne({ phoneNumber });

    console.log('User found:', user ? { id: user._id, phoneNumber: user.phoneNumber } : 'Not found');

    if (user && (await user.matchPassword(password))) {
        console.log('Password match successful for user:', user._id);

        // Ghi lại thông tin đăng nhập thành công
        user.lastLogin = new Date();
        user.loginAttempts = 0; // Reset số lần thử đăng nhập không thành công
        await user.save();

        // Tạo tokens với thông tin thiết bị
        const userAgent = req.headers['user-agent'] || 'unknown';
        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
        const tokens = generateTokens(user._id, { userAgent, clientIp });

        const minProcessTime = 500; // Đảm bảo thời gian xử lý tối thiểu là 500ms
        const processingTime = Date.now() - startTime;
        if (processingTime < minProcessTime) {
            await new Promise(resolve => setTimeout(resolve, minProcessTime - processingTime));
        }

        console.log('Login successful, tokens generated for user:', user._id);

        res.json({
            success: true,
            user: {
                id: user._id,
                userName: user.userName,
                phoneNumber: user.phoneNumber,
                diaChi: user.diaChi,
                isAdmin: user.isAdmin || false  // Đảm bảo trường isAdmin luôn được trả về
            },
            tokens,
            expiresIn: tokens.expiresIn
        });
    } else {
        console.log('Password match failed or user not found');
        // Tăng số lần thử đăng nhập không thành công nếu tài khoản tồn tại
        if (user) {
            user.loginAttempts = (user.loginAttempts || 0) + 1;

            // Khóa tài khoản tạm thời nếu thử đăng nhập sai quá nhiều lần
            if (user.loginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Khóa 15 phút

                await user.save();

                // Đảm bảo thời gian xử lý tối thiểu để phòng tránh timing attacks
                const minProcessTime = 500;
                const processingTime = Date.now() - startTime;
                if (processingTime < minProcessTime) {
                    await new Promise(resolve => setTimeout(resolve, minProcessTime - processingTime));
                }

                res.status(401).json({
                    success: false,
                    message: 'Tài khoản đã bị khóa do nhập sai mật khẩu nhiều lần',
                    code: 'ACCOUNT_LOCKED'
                });
                return;
            }

            await user.save();
        }

        // Đảm bảo thời gian xử lý tối thiểu để phòng tránh timing attacks
        const minProcessTime = 500;
        const processingTime = Date.now() - startTime;
        if (processingTime < minProcessTime) {
            await new Promise(resolve => setTimeout(resolve, minProcessTime - processingTime));
        }

        // Trả về mã lỗi cụ thể dựa trên tình huống
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Tài khoản không tồn tại',
                code: 'USER_NOT_FOUND'
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Số điện thoại hoặc mật khẩu không chính xác',
                code: 'INVALID_CREDENTIALS'
            });
        }
    }
});

// const registerUser = asyncHandler(async (req, res) => {
//     try {
//         console.log('Register request received:', JSON.stringify(req.body));

//         const { userName, phoneNumber, password, diaChi } = req.body;

//         // Kiểm tra dữ liệu đầu vào
//         if (!userName || !phoneNumber || !password || !diaChi) {
//             console.log('Missing required fields:', { userName, phoneNumber, password: !!password, diaChi });
//             res.status(400);
//             throw new Error('Vui lòng nhập đầy đủ thông tin');
//         }

//         // Kiểm tra định dạng số điện thoại
//         const phoneRegex = /^0\d{9}$/;
//         if (!phoneRegex.test(phoneNumber)) {
//             console.log('Invalid phone format:', phoneNumber);
//             res.status(400);
//             throw new Error('Số điện thoại không hợp lệ (phải có 10 số và bắt đầu bằng số 0)');
//         }

//         // Kiểm tra độ mạnh của mật khẩu
//         if (password.length < 6) {
//             console.log('Password too short');
//             res.status(400);
//             throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
//         }

//         const userExists = await User.findOne({ phoneNumber });

//         if (userExists) {
//             console.log('User with phone already exists:', phoneNumber);
//             res.status(400);
//             throw new Error('Số điện thoại đã được đăng ký');
//         }

//         try {
//             console.log('Creating new user...');
//             const user = await User.create({
//                 userName,
//                 phoneNumber,
//                 password,
//                 diaChi,
//                 registeredAt: new Date(),
//                 loginAttempts: 0
//             });

//             if (user) {
//                 console.log('User registered successfully:', user._id);
//                 res.status(201).json({
//                     success: true,
//                     message: 'Đăng ký thành công'
//                 });
//             } else {
//                 console.log('User creation failed without error');
//                 res.status(400);
//                 throw new Error('Dữ liệu người dùng không hợp lệ');
//             }
//         } catch (error) {
//             console.error('Error creating user:', error);

//             // Kiểm tra lỗi E11000 duplicate key
//             if (error.name === 'MongoServerError' && error.code === 11000) {
//                 console.error('Duplicate key error:', error.keyValue);
//                 // Nếu lỗi trùng lặp phoneNumber
//                 if (error.keyPattern && error.keyPattern.phoneNumber) {
//                     res.status(400);
//                     throw new Error('Số điện thoại đã được đăng ký. Vui lòng sử dụng số điện thoại khác.');
//                 }
//                 // Trường hợp khác
//                 else {
//                     res.status(400);
//                     throw new Error('Thông tin đã được đăng ký. Vui lòng kiểm tra lại.');
//                 }
//             }

//             res.status(400);
//             throw new Error(error.message || 'Đăng ký thất bại');
//         }
//     } catch (error) {
//         console.error('Register endpoint error:', error);
//         // Nếu res.status chưa được set, đặt mặc định là 500
//         if (!res.statusCode || res.statusCode === 200) {
//             res.status(500);
//         }
//         throw error;
//     }
// });

const registerUser = asyncHandler(async (req, res) => {
    const { userName, phoneNumber, password, diaChi } = req.body;

    const userExists = await User.findOne({ phoneNumber });

    if (userExists) {
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'Số điện thoại đã được sử dụng'
        });
    }

    const user = await User.create({
        userName,
        phoneNumber,
        password,
        diaChi,
    });

    if (user) {
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.connection.remoteAddress;

        await user.updateDevice(userAgent, ipAddress);
        user.lastLogin = Date.now();
        await user.save();

        return res.status(httpStatus.CREATED).json({
            data: {
                _id: user._id,
                userName: user.userName,
                phoneNumber: user.phoneNumber,
                diaChi: user.diaChi,
                isAdmin: user.isAdmin,
                // token: generateToken(user._id),
            },
            message: 'User registered successfully'
        });
    }

    return res.status(httpStatus.BAD_REQUEST).json({
        message: 'Dữ liệu người dùng không hợp lệ'
    });
});

const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken: token } = req.body;

    if (!token) {
        res.status(401);
        throw new Error('Không tìm thấy refresh token');
    }

    try {
        const decoded = verifyRefreshToken(token);

        // Xác thực ID người dùng
        if (!isValidObjectId(decoded.id)) {
            res.status(401);
            throw new Error('Token không hợp lệ');
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            res.status(401);
            throw new Error('Người dùng không tồn tại hoặc đã bị vô hiệu hóa');
        }

        if (user.isBlocked) {
            res.status(403);
            throw new Error('Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên');
        }

        // Kiểm tra xem tài khoản có bị khóa tạm thời do đăng nhập sai nhiều lần không
        if (user.lockUntil && user.lockUntil > new Date()) {
            res.status(403);
            throw new Error(`Tài khoản bị khóa tạm thời do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${Math.ceil((user.lockUntil - new Date()) / 60000)} phút.`);
        }

        // Vô hiệu hóa token cũ
        invalidateToken(token);

        // Tạo token mới với thông tin thiết bị
        const userAgent = req.headers['user-agent'] || 'unknown';
        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
        const tokens = generateTokens(decoded.id, { userAgent, clientIp });

        // Cập nhật thông tin refresh token
        user.lastTokenRefresh = new Date();
        await user.save();

        res.json({
            success: true,
            tokens,
            expiresIn: tokens.expiresIn,
            message: 'Token đã được làm mới thành công'
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Refresh token không hợp lệ'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Refresh token đã hết hạn, vui lòng đăng nhập lại'
            });
        }

        res.status(401).json({
            success: false,
            message: error.message || 'Không thể làm mới token'
        });
    }
});

const logout = asyncHandler(async (req, res) => {
    const { refreshToken: token } = req.body;

    if (!token) {
        res.status(400);
        throw new Error('Không tìm thấy refresh token');
    }

    try {
        // Vô hiệu hóa token
        invalidateToken(token);

        // Nếu có authorization header, vô hiệu hóa access token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const accessToken = authHeader.split(' ')[1];
            invalidateToken(accessToken);
        }

        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi đăng xuất'
        });
    }
});

// @desc    Xác thực quyền admin
// @route   GET /api/auth/verify-admin
// @access  Private
const verifyAdmin = asyncHandler(async (req, res) => {
    try {
        console.log('[Auth] Verifying admin status for user:', {
            userId: req.user._id,
            userName: req.user.userName,
            isAdmin: req.user.isAdmin
        });

        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền admin'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xác thực admin thành công',
            data: {
                userId: req.user._id,
                userName: req.user.userName,
                isAdmin: true
            }
        });
    } catch (error) {
        console.error('[Auth] Error verifying admin:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực quyền admin'
        });
    }
});

export {
    authUser,
    registerUser,
    refreshToken,
    logout,
    verifyAdmin
};