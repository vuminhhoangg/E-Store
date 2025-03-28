import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import routes from './src/routes/index.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Khởi tạo app
const app = express();

// Áp dụng helmet middleware để bảo mật headers
app.use(helmet());

// Giới hạn số lượng request từ một IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // giới hạn mỗi IP 100 request trong mỗi windowMs
    message: 'Quá nhiều yêu cầu từ địa chỉ IP này, vui lòng thử lại sau 15 phút'
});

// Áp dụng giới hạn cho tất cả các request
app.use(limiter);

// Middleware CORS
app.use(cors({
    origin: ['http://localhost:5000', 'http://localhost:5173', 'http://localhost:5001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware JSON parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Đã có lỗi xảy ra, vui lòng thử lại sau'
    });
});

export default app;