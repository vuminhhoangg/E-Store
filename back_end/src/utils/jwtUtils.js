import jwt from 'jsonwebtoken';

// Tạo JWT token
export const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Hết hạn sau 30 ngày
    });
};

// Xác thực JWT token
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return { valid: true, expired: false, decoded };
    } catch (error) {
        return {
            valid: false,
            expired: error.message === 'jwt expired',
            decoded: null
        };
    }
}; 