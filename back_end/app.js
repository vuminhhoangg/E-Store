import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/configs/db.js';
import routes from './src/routes/index.js';

dotenv.config();

const app = express();

// Kết nối database
connectDB();

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : [process.env.FRONTEND_URL, process.env.CORS_ORIGIN],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api', routes);

// 404 handler
app.use((req, res, next) => {
    console.warn(`404 - Not Found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài nguyên',
        path: req.url
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    const errorDetails = {
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        error: {
            name: err.name,
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    };

    console.error('Error:', errorDetails);

    // Xử lý các loại lỗi khác nhau
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token đã hết hạn'
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: 'Đã xảy ra lỗi server',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

export default app;