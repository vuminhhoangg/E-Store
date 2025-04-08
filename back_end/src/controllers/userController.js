import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwtUtils.js';

// @desc    Đăng ký người dùng mới
// @route   POST /api/users
// @access  Public
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
                token: generateToken(user._id),
            },
            message: 'User registered successfully'
        });
    }

    return res.status(httpStatus.BAD_REQUEST).json({
        message: 'Dữ liệu người dùng không hợp lệ'
    });
});

// @desc    Xác thực người dùng & lấy token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { phoneNumber, password } = req.body;
    const user = await User.findOne({ phoneNumber });

    if (!user) {
        return res.status(httpStatus.UNAUTHORIZED).json({
            message: 'Số điện thoại hoặc mật khẩu không đúng'
        });
    }

    if (user.isBlocked) {
        return res.status(httpStatus.UNAUTHORIZED).json({
            message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
        });
    }

    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
        const minutesLeft = Math.ceil((user.lockUntil - now) / (60 * 1000));
        return res.status(httpStatus.UNAUTHORIZED).json({
            message: `Tài khoản tạm thời bị khóa. Vui lòng thử lại sau ${minutesLeft} phút.`
        });
    }

    const isMatch = await user.matchPassword(password);
    if (isMatch) {
        user.loginAttempts = 0;
        user.lockUntil = null;
        user.lastLogin = Date.now();

        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.connection.remoteAddress;
        await user.updateDevice(userAgent, ipAddress);
        await user.save();

        const token = generateToken(user._id);
        user.lastTokenRefresh = Date.now();
        await user.save();

        return res.status(httpStatus.OK).json({
            data: {
                _id: user._id,
                userName: user.userName,
                phoneNumber: user.phoneNumber,
                diaChi: user.diaChi,
                isAdmin: user.isAdmin,
                token,
                rememberMe: req.body.rememberMe || false
            },
            message: 'User data retrieved successfully'
        });
    }

    user.loginAttempts += 1;
    if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        await user.save();
        return res.status(httpStatus.UNAUTHORIZED).json({
            message: 'Đăng nhập thất bại quá nhiều lần. Tài khoản đã bị tạm khóa 30 phút.'
        });
    }

    await user.save();
    return res.status(httpStatus.UNAUTHORIZED).json({
        message: 'Số điện thoại hoặc mật khẩu không đúng'
    });
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
            await user.invalidateToken(token);
        }
    }
    return res.status(httpStatus.OK).json({ message: 'Đăng xuất thành công' });
});

// @desc    Lấy thông tin người dùng
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password -invalidatedTokens');
    if (!user) {
        return res.status(httpStatus.NOT_FOUND).json({
            message: 'Không tìm thấy người dùng'
        });
    }
    return res.status(httpStatus.OK).json({
        data: {
            _id: user._id,
            userName: user.userName,
            phoneNumber: user.phoneNumber,
            diaChi: user.diaChi,
            isAdmin: user.isAdmin,
            devices: user.devices,
            lastLogin: user.lastLogin
        },
        message: 'User profile retrieved successfully'
    });
});

// @desc    Cập nhật thông tin người dùng
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.userName = req.body.userName || user.userName;
        user.diaChi = req.body.diaChi || user.diaChi;

        if (req.body.phoneNumber && req.body.phoneNumber !== user.phoneNumber) {
            const existingUser = await User.findOne({ phoneNumber: req.body.phoneNumber });
            if (existingUser) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    message: 'Số điện thoại đã được sử dụng'
                });
            }
            user.phoneNumber = req.body.phoneNumber;
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        return res.status(httpStatus.OK).json({
            data: {
                _id: updatedUser._id,
                userName: updatedUser.userName,
                phoneNumber: updatedUser.phoneNumber,
                diaChi: updatedUser.diaChi,
                isAdmin: updatedUser.isAdmin,
            },
            message: 'User profile updated successfully'
        });
    } else {
        return res.status(httpStatus.NOT_FOUND).json({
            message: 'Không tìm thấy người dùng'
        });
    }
});

// @desc    Đổi mật khẩu người dùng
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.NOT_FOUND).json({
            message: 'Không tìm thấy người dùng'
        });
    }

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'Mật khẩu hiện tại không chính xác'
        });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();

    return res.status(httpStatus.OK).json({
        message: 'Đổi mật khẩu thành công'
    });
});

// @desc    Xóa thiết bị đã đăng nhập
// @route   DELETE /api/users/devices/:deviceId
// @access  Private
const removeUserDevice = asyncHandler(async (req, res) => {
    const { deviceId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(httpStatus.NOT_FOUND).json({
            message: 'Không tìm thấy người dùng'
        });
    }

    // Lọc bỏ thiết bị
    if (user.devices && user.devices.length > 0) {
        user.devices = user.devices.filter((device, index) => index.toString() !== deviceId);
        await user.save();
    }

    return res.status(httpStatus.OK).json({
        message: 'Đã xóa thiết bị thành công'
    });
});

// @desc    Làm mới token
// @route   POST /api/users/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'Refresh token không được cung cấp'
        });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: 'Người dùng không tồn tại'
            });
        }

        if (user.isBlocked) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: 'Tài khoản đã bị khóa'
            });
        }

        // Kiểm tra xem refresh token có bị vô hiệu hóa không
        if (user.isTokenInvalid(refreshToken)) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: 'Refresh token đã bị vô hiệu hóa'
            });
        }

        // Tạo token mới
        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN
        });

        // Tạo refresh token mới
        const newRefreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
        });

        // Vô hiệu hóa refresh token cũ
        await user.invalidateToken(refreshToken);

        // Cập nhật thời gian làm mới token
        user.lastTokenRefresh = Date.now();
        await user.save();

        return res.status(httpStatus.OK).json({
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN) * 1000
        });

    } catch (error) {
        return res.status(httpStatus.UNAUTHORIZED).json({
            message: 'Token không hợp lệ hoặc đã hết hạn'
        });
    }
});

// @desc    Kiểm tra số điện thoại đã tồn tại chưa
// @route   GET /api/users/check-phone/:phoneNumber
// @access  Public
const checkPhoneExists = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.params;

    const userExists = await User.findOne({ phoneNumber });

    return res.status(httpStatus.OK).json({
        exists: !!userExists
    });
});

// Lấy tất cả người dùng (Admin)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách người dùng:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể lấy danh sách người dùng'
        });
    }
};

// Tạo người dùng mới (Admin)
export const createUser = async (req, res) => {
    try {
        const { userName, phoneNumber, diaChi, password, isAdmin } = req.body;

        // Kiểm tra người dùng đã tồn tại chưa
        const userExists = await User.findOne({ userName });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Tên người dùng đã tồn tại'
            });
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo người dùng mới
        const newUser = await User.create({
            userName,
            phoneNumber,
            diaChi,
            password: hashedPassword,
            isAdmin: isAdmin || false
        });

        if (newUser) {
            // Trả về thông tin người dùng (không bao gồm mật khẩu)
            return res.status(201).json({
                success: true,
                data: {
                    _id: newUser._id,
                    userName: newUser.userName,
                    phoneNumber: newUser.phoneNumber,
                    diaChi: newUser.diaChi,
                    isAdmin: newUser.isAdmin,
                    createdAt: newUser.createdAt
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu người dùng không hợp lệ'
            });
        }
    } catch (error) {
        console.error('Lỗi khi tạo người dùng mới:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể tạo người dùng mới'
        });
    }
};

// Cập nhật thông tin người dùng (Admin)
export const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { userName, phoneNumber, diaChi, password, isAdmin } = req.body;

        // Tìm người dùng
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Cập nhật thông tin
        if (userName) user.userName = userName;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (diaChi) user.diaChi = diaChi;

        // Chỉ cập nhật mật khẩu nếu có
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        // Cập nhật quyền admin nếu được chỉ định
        if (isAdmin !== undefined) {
            user.isAdmin = isAdmin;
        }

        // Lưu thay đổi
        const updatedUser = await user.save();

        return res.status(200).json({
            success: true,
            data: {
                _id: updatedUser._id,
                userName: updatedUser.userName,
                phoneNumber: updatedUser.phoneNumber,
                diaChi: updatedUser.diaChi,
                isAdmin: updatedUser.isAdmin,
                updatedAt: updatedUser.updatedAt
            }
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin người dùng:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể cập nhật thông tin người dùng'
        });
    }
};

// Khóa/mở khóa tài khoản người dùng (Admin)
export const toggleBlockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { isBlocked } = req.body;

        // Tìm người dùng
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Ngăn chặn admin khóa chính mình
        if (req.user._id.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'Bạn không thể khóa tài khoản của chính mình'
            });
        }

        // Cập nhật trạng thái khóa
        user.isBlocked = isBlocked;
        await user.save();

        return res.status(200).json({
            success: true,
            message: isBlocked ? 'Đã khóa tài khoản người dùng' : 'Đã mở khóa tài khoản người dùng',
            data: {
                _id: user._id,
                userName: user.userName,
                isBlocked: user.isBlocked
            }
        });
    } catch (error) {
        console.error('Lỗi khi khóa/mở khóa tài khoản:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể khóa/mở khóa tài khoản'
        });
    }
};

// Xóa tài khoản người dùng (Admin)
export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Tìm người dùng
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Ngăn chặn admin xóa chính mình
        if (req.user._id.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'Bạn không thể xóa tài khoản của chính mình'
            });
        }

        // Xóa người dùng
        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: 'Đã xóa tài khoản người dùng thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa tài khoản người dùng:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể xóa tài khoản người dùng'
        });
    }
};

export {
    registerUser,
    authUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    changePassword,
    removeUserDevice,
    refreshToken,
    checkPhoneExists
};
