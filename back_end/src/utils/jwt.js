import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Sử dụng các biến môi trường giống với phần còn lại của ứng dụng
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Danh sách để theo dõi các token đã bị vô hiệu hóa (blacklist)
// Trong môi trường sản xuất thực tế, nên sử dụng Redis hoặc cơ sở dữ liệu để lưu trữ
const tokenBlacklist = new Set();

// Hàm tạo token ngẫu nhiên
const generateTokenId = () => {
    return crypto.randomBytes(16).toString('hex');
};

export const generateTokens = (userId, deviceInfo = {}) => {
    // Tạo một ID duy nhất cho token để có thể vô hiệu hóa nó sau này
    const jti = generateTokenId();

    // Thêm thông tin thiết bị và thời gian tạo
    const now = Math.floor(Date.now() / 1000);

    const accessToken = jwt.sign(
        {
            id: userId,
            jti: jti,
            iat: now, // Issued at
            type: 'access',
            device: deviceInfo // Thêm thông tin thiết bị vào payload
        },
        JWT_SECRET,
        {
            expiresIn: JWT_ACCESS_EXPIRES_IN,
            algorithm: 'HS256' // Chỉ định thuật toán
        }
    );

    const refreshToken = jwt.sign(
        {
            id: userId,
            jti: jti,
            iat: now, // Issued at
            type: 'refresh',
            device: deviceInfo // Thêm thông tin thiết bị vào payload
        },
        JWT_REFRESH_SECRET,
        {
            expiresIn: JWT_REFRESH_EXPIRES_IN,
            algorithm: 'HS256' // Chỉ định thuật toán
        }
    );

    return {
        accessToken,
        refreshToken,
        expiresIn: getExpirationTime(JWT_ACCESS_EXPIRES_IN)
    };
};

// Tính thời gian hết hạn dựa trên chuỗi thời gian
const getExpirationTime = (expiresIn) => {
    const now = Date.now();
    const unit = expiresIn.charAt(expiresIn.length - 1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
        case 's':
            return now + value * 1000;
        case 'm':
            return now + value * 60 * 1000;
        case 'h':
            return now + value * 60 * 60 * 1000;
        case 'd':
            return now + value * 24 * 60 * 60 * 1000;
        default:
            return now + parseInt(expiresIn) * 1000;
    }
};

export const verifyAccessToken = (token) => {
    try {
        // Kiểm tra nếu token đã bị đưa vào blacklist
        if (tokenBlacklist.has(token)) {
            throw new Error('Token đã bị vô hiệu hóa');
        }

        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

        // Xác minh loại token
        if (decoded.type !== 'access') {
            throw new Error('Loại token không hợp lệ');
        }

        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token đã hết hạn');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Token không hợp lệ');
        } else {
            throw error;
        }
    }
};

export const verifyRefreshToken = (token) => {
    try {
        // Kiểm tra nếu token đã bị đưa vào blacklist
        if (tokenBlacklist.has(token)) {
            throw new Error('Refresh token đã bị vô hiệu hóa');
        }

        const decoded = jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ['HS256'] });

        // Xác minh loại token
        if (decoded.type !== 'refresh') {
            throw new Error('Loại token không hợp lệ');
        }

        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Refresh token đã hết hạn');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Refresh token không hợp lệ');
        } else {
            throw error;
        }
    }
};

// Thêm token vào blacklist khi người dùng đăng xuất
export const invalidateToken = (token) => {
    try {
        // Thêm token vào blacklist
        tokenBlacklist.add(token);

        // Trong một ứng dụng thực tế, nên có một cơ chế để làm sạch danh sách blacklist định kỳ
        // hoặc sử dụng Redis với expiry time

        // Giới hạn kích thước của blacklist trong môi trường phát triển
        if (NODE_ENV === 'development' && tokenBlacklist.size > 1000) {
            // Chỉ giữ 500 token gần nhất
            const tokensArray = Array.from(tokenBlacklist);
            const newTokens = tokensArray.slice(tokensArray.length - 500);
            tokenBlacklist.clear();
            newTokens.forEach(t => tokenBlacklist.add(t));
        }

        return true;
    } catch (error) {
        console.error('Error invalidating token:', error);
        return false;
    }
};