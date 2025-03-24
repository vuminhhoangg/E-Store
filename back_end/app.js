import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import connectDB from './src/configs/db.js';
import routes from './src/routes/index.js';

connectDB();

// Khởi tạo app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api', routes)

process.on('SIGINT', () => {
    console.log('🛑 Server is shutting down...');
    server.close(() => {
        console.log('✅ Server has been stopped.');
        process.exit(0);
    });
});

export default app;