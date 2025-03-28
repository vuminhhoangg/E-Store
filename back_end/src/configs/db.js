import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('✅ MongoDB Connected:', conn.connection.host);

        mongoose.connection.on('disconnected', () => {
            console.log('❌ MongoDB disconnected');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('✅ MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (err) {
        console.error('❌ Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

export default connectDB;
