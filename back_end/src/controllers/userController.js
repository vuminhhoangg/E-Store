import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';

// @desc    Đăng ký người dùng mới
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { userName, phoneNumber, password, diaChi } = req.body;

    const userExists = await User.findOne({ phoneNumber });

    if (userExists) {
        res.status(400);
        throw new Error('Số điện thoại đã được sử dụng');
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

        // Cập nhật thông tin thiết bị
        await user.updateDevice(userAgent, ipAddress);

        // Cập nhật thời gian đăng nhập lần cuối
        user.lastLogin = Date.now();
        await user.save();

        res.status(201).json({
            _id: user._id,
            userName: user.userName,
            phoneNumber: user.phoneNumber,
            diaChi: user.diaChi,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Dữ liệu người dùng không hợp lệ');
    }
});

// @desc    Xác thực người dùng & lấy token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { phoneNumber, password } = req.body;

    const user = await User.findOne({ phoneNumber });

    if (!user) {
        res.status(401);
        throw new Error('Số điện thoại hoặc mật khẩu không đúng');
    }

    // Kiểm tra xem tài khoản có bị khóa không
    if (user.isBlocked) {
        res.status(401);
        throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
    }

    // Kiểm tra xem tài khoản có bị tạm khóa không
    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
        const minutesLeft = Math.ceil((user.lockUntil - now) / (60 * 1000));
        res.status(401);
        throw new Error(`Tài khoản tạm thời bị khóa. Vui lòng thử lại sau ${minutesLeft} phút.`);
    }

    // Kiểm tra mật khẩu
    const isMatch = await user.matchPassword(password);

    if (isMatch) {
        // Reset số lần đăng nhập thất bại
        user.loginAttempts = 0;
        user.lockUntil = null;
        user.lastLogin = Date.now();

        // Cập nhật thông tin thiết bị
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.connection.remoteAddress;
        await user.updateDevice(userAgent, ipAddress);

        await user.save();

        const token = generateToken(user._id);

        // Lưu thời gian token được làm mới
        user.lastTokenRefresh = Date.now();
        await user.save();

        const rememberMe = req.body.rememberMe || false;

        res.json({
            _id: user._id,
            userName: user.userName,
            phoneNumber: user.phoneNumber,
            diaChi: user.diaChi,
            isAdmin: user.isAdmin,
            token,
            rememberMe
        });
    } else {
        // Tăng số lần đăng nhập thất bại
        user.loginAttempts += 1;

        // Nếu đăng nhập thất bại quá 5 lần, khóa tài khoản trong 30 phút
        if (user.loginAttempts >= 5) {
            user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 phút
        }

        await user.save();

        res.status(401);

        if (user.loginAttempts >= 5) {
            throw new Error('Đăng nhập thất bại quá nhiều lần. Tài khoản đã bị tạm khóa 30 phút.');
        } else {
            throw new Error('Số điện thoại hoặc mật khẩu không đúng');
        }
    }
});

// @desc    Đăng xuất người dùng
// @route   POST /api/users/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (user) {
            // Thêm token hiện tại vào danh sách token bị vô hiệu hóa
            await user.invalidateToken(token);
        }
    }

    res.json({ message: 'Đăng xuất thành công' });
});

// @desc    Lấy thông tin người dùng
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password -invalidatedTokens');

    if (user) {
        res.json({
            _id: user._id,
            userName: user.userName,
            phoneNumber: user.phoneNumber,
            diaChi: user.diaChi,
            isAdmin: user.isAdmin,
            devices: user.devices,
            lastLogin: user.lastLogin
        });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng');
    }
});

// @desc    Cập nhật thông tin người dùng
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.userName = req.body.userName || user.userName;
        user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
        user.diaChi = req.body.diaChi || user.diaChi;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            userName: updatedUser.userName,
            phoneNumber: updatedUser.phoneNumber,
            diaChi: updatedUser.diaChi,
            isAdmin: updatedUser.isAdmin,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng');
    }
});

// @desc    Xóa thiết bị đã đăng nhập
// @route   DELETE /api/users/devices/:deviceId
// @access  Private
const removeUserDevice = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        // Xóa thiết bị theo ID
        const deviceIndex = req.params.deviceId;

        if (deviceIndex >= 0 && deviceIndex < user.devices.length) {
            user.devices.splice(deviceIndex, 1);
            await user.save();
            res.json({ message: 'Thiết bị đã được xóa' });
        } else {
            res.status(404);
            throw new Error('Không tìm thấy thiết bị');
        }
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng');
    }
});

// @desc    Làm mới token
// @route   POST /api/users/refresh-token
// @access  Private
const refreshToken = asyncHandler(async (req, res) => {
    const oldToken = req.headers.authorization?.split(' ')[1];

    if (!oldToken) {
        res.status(401);
        throw new Error('Không có token, từ chối truy cập');
    }

    try {
        const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            res.status(404);
            throw new Error('Không tìm thấy người dùng');
        }

        // Kiểm tra xem token đã bị vô hiệu hóa chưa
        if (user.isTokenInvalid(oldToken)) {
            res.status(401);
            throw new Error('Token đã bị vô hiệu hóa');
        }

        // Vô hiệu hóa token cũ
        await user.invalidateToken(oldToken);

        // Tạo token mới
        const newToken = generateToken(user._id);

        // Cập nhật thời gian làm mới token
        user.lastTokenRefresh = Date.now();
        await user.save();

        res.json({ token: newToken });
    } catch (error) {
        res.status(401);
        throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }
});

// @desc    Đổi mật khẩu
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('Không tìm thấy người dùng');
    }

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
        res.status(400);
        throw new Error('Mật khẩu hiện tại không đúng');
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;

    // Vô hiệu hóa tất cả token hiện có
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        await user.invalidateToken(token);
    }

    await user.save();

    res.json({ message: 'Mật khẩu đã được thay đổi' });
});

// @desc    Kiểm tra số điện thoại đã tồn tại chưa
// @route   GET /api/users/check-phone/:phoneNumber
// @access  Public
const checkPhoneExists = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.params;

    if (!phoneNumber) {
        res.status(400);
        throw new Error('Vui lòng cung cấp số điện thoại để kiểm tra');
    }

    const user = await User.findOne({ phoneNumber });

    res.json({
        exists: !!user,
        message: user ? 'Số điện thoại đã tồn tại' : 'Số điện thoại chưa được đăng ký'
    });
});

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

export {
    registerUser,
    authUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    removeUserDevice,
    refreshToken,
    changePassword,
    checkPhoneExists
}; 