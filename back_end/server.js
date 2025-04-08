import app from './app.js';
import dotenv from 'dotenv';

// Đảm bảo load environment variables
dotenv.config();

const PORT = process.env.PORT || 8080;

let server;

// Log MONGO_URI (ẩn mật khẩu cho an toàn)
if (process.env.MONGO_URI) {
    const maskedURI = process.env.MONGO_URI.replace(
        /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
        'mongodb$1://$2:***@'
    );
    console.log('Connecting to MongoDB with URI:', maskedURI);
} else {
    console.error('❌ MONGO_URI is missing in environment variables!');
    process.exit(1);
}

// Khởi động server
server = app.listen(PORT, () => {
    console.log(`✅ Server đang chạy trên port ${PORT}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV}`);
});

// Xử lý lỗi chưa được bắt
process.on('unhandledRejection', (err) => {
    console.error('❌ Lỗi chưa được xử lý:', {
        name: err.name,
        message: err.message,
        stack: err.stack
    });

    if (server) {
        server.close(() => {
            console.log('Server đã đóng');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

// Xử lý sự kiện tắt server
process.on('SIGINT', () => {
    console.log('Nhận được tín hiệu SIGINT. Đang đóng server...');
    if (server) {
        server.close(() => {
            console.log('Server đã đóng');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});