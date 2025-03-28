import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import BaseModel from "./base.js";


const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    diaChi: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        required: true,
        default: false,
    },
    // Thêm các trường liên quan đến bảo mật
    loginAttempts: {
        type: Number,
        default: 0,
        required: true
    },
    lockUntil: {
        type: Date,
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    },
    lastTokenRefresh: {
        type: Date,
        default: null
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    // Danh sách token đã bị vô hiệu hóa
    invalidatedTokens: [{
        type: String,
        default: []
    }],
    // Thông tin thiết bị đã đăng nhập
    devices: [{
        userAgent: String,
        ipAddress: String,
        lastActive: Date
    }]
}, {
    timestamps: true,
});

// Hash password trước khi lưu
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method để so sánh password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method để vô hiệu hóa token
userSchema.methods.invalidateToken = function (token) {
    if (!this.invalidatedTokens.includes(token)) {
        this.invalidatedTokens.push(token);

        // Giới hạn số lượng token bị vô hiệu hóa lưu trữ
        if (this.invalidatedTokens.length > 10) {
            this.invalidatedTokens = this.invalidatedTokens.slice(-10);
        }
    }

    return this.save();
};

// Method để kiểm tra token có bị vô hiệu hóa hay không
userSchema.methods.isTokenInvalid = function (token) {
    return this.invalidatedTokens.includes(token);
};

// Method để ghi lại thông tin thiết bị
userSchema.methods.updateDevice = function (userAgent, ipAddress) {
    const deviceIndex = this.devices.findIndex(device =>
        device.userAgent === userAgent && device.ipAddress === ipAddress
    );

    const now = new Date();

    if (deviceIndex > -1) {
        this.devices[deviceIndex].lastActive = now;
    } else {
        this.devices.push({
            userAgent,
            ipAddress,
            lastActive: now
        });

        // Giới hạn số lượng thiết bị lưu trữ
        if (this.devices.length > 5) {
            this.devices = this.devices.slice(-5);
        }
    }

    return this.save();
};

const baseModel = new BaseModel(userSchema);

export default baseModel.createModel("User");