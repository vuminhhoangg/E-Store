import app from './app.js';
import mongoose from 'mongoose';
import 'dotenv/config';

const PORT = process.env.PORT || 8080;

let server;

// Xác định các tùy chọn nâng cao cho kết nối MongoDB
const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true, // Thêm tùy chọn này để đảm bảo các indexes được tạo khi khởi động
};

console.log('Connecting to MongoDB with URI:', process.env.MONGO_URI.replace(/:[^:]*@/, ':****@'));

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, mongooseOptions)
    .then(() => {
        console.log('✅ Kết nối MongoDB thành công');

        // Kiểm tra các indexes trong collection users
        return mongoose.connection.db.collection('users').indexes();
    })
    .then((indexes) => {
        console.log('Indexes for users collection:', JSON.stringify(indexes, null, 2));

        // Khởi động server sau khi kết nối database thành công
        server = app.listen(PORT, () => {
            console.log(`✅ Server đang chạy trên port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Lỗi kết nối MongoDB:', error);
        process.exit(1);
    });

// Xử lý lỗi chưa được bắt
process.on('unhandledRejection', (err) => {
    console.error('❌ Lỗi chưa được xử lý:', err);
    // Đóng server và kết nối database
    if (server) {
        server.close(() => {
            mongoose.connection.close();
            process.exit(1);
        });
    }
});

// Xử lý sự kiện tắt server
process.on('SIGINT', () => {
    console.log('🛑 Đang tắt server...');

    if (server) {
        server.close(() => {
            console.log('✅ Server đã tắt');

            mongoose.connection.close(false, () => {
                console.log('✅ Kết nối MongoDB đã đóng');
                process.exit(0);
            });
        });
    }
});