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

// DEBUG Middleware - đặt trước tất cả routes
app.use((req, res, next) => {
    // Chỉ log các request từ đường dẫn /api
    if (req.url.startsWith('/api')) {
        console.log("\n===== DEBUG REQUEST INFO =====");
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        console.log(`Headers:`, {
            authorization: req.headers.authorization ? `${req.headers.authorization.substring(0, 15)}...` : 'missing',
            'content-type': req.headers['content-type']
        });

        // Log request body nếu có
        if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
            const safeBody = { ...req.body };
            if (safeBody.password) safeBody.password = '********';
            console.log('Request Body:', JSON.stringify(safeBody, null, 2));
        }

        // Ghi đè response methods để log
        const originalSend = res.send;
        const originalJson = res.json;

        res.send = function (body) {
            console.log(`Response for ${req.method} ${req.url} - Status: ${res.statusCode}`);
            if (body) {
                try {
                    console.log('Response Body:', typeof body === 'string' ? body : JSON.stringify(body, null, 2));
                } catch (error) {
                    console.log('Response Body: [Cannot stringify response]');
                }
            }
            console.log("===== END DEBUG REQUEST INFO =====\n");
            return originalSend.apply(this, arguments);
        };

        res.json = function (body) {
            console.log(`Response for ${req.method} ${req.url} - Status: ${res.statusCode}`);
            if (body) {
                try {
                    const safeResponse = { ...body };
                    if (safeResponse.tokens) {
                        safeResponse.tokens = {
                            accessToken: safeResponse.tokens.accessToken ? `${safeResponse.tokens.accessToken.substring(0, 15)}...` : '',
                            refreshToken: safeResponse.tokens.refreshToken ? `${safeResponse.tokens.refreshToken.substring(0, 15)}...` : ''
                        };
                    }
                    console.log('Response Body:', JSON.stringify(safeResponse, null, 2));
                } catch (error) {
                    console.log('Response Body: [Cannot stringify response]');
                }
            }
            console.log("===== END DEBUG REQUEST INFO =====\n");
            return originalJson.apply(this, arguments);
        };
    }
    next();
});

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Log request body nếu có
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }

    // Capture original response methods
    const originalSend = res.send;
    const originalJson = res.json;

    // Override response methods to log
    res.send = function (body) {
        console.log(`Response for ${req.method} ${req.url} - Status: ${res.statusCode}`);
        if (body) {
            try {
                console.log('Response Body:', typeof body === 'string' ? body : JSON.stringify(body, null, 2));
            } catch (error) {
                console.log('Response Body: [Cannot stringify response]');
            }
        }
        return originalSend.apply(this, arguments);
    };

    res.json = function (body) {
        console.log(`Response for ${req.method} ${req.url} - Status: ${res.statusCode}`);
        if (body) {
            try {
                console.log('Response Body:', JSON.stringify(body, null, 2));
            } catch (error) {
                console.log('Response Body: [Cannot stringify response]');
            }
        }
        return originalJson.apply(this, arguments);
    };

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