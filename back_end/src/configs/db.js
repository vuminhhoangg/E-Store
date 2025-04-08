import mongoose from 'mongoose';

const connectDB = async () => {
    const maxRetries = 3;
    let retryCount = 0;

    const connectWithRetry = async () => {
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
                retryWrites: true,
                w: 'majority'
            });

            console.log('✅ MongoDB Connected:', conn.connection.host);

            mongoose.connection.on('disconnected', () => {
                console.log('❌ MongoDB disconnected');
                // Thử kết nối lại sau khi disconnect
                setTimeout(connectWithRetry, 5000);
            });

            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB connection error:', err);
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
                    setTimeout(connectWithRetry, 5000);
                } else {
                    console.error('Max retries reached. Could not connect to MongoDB');
                    process.exit(1);
                }
            });

            process.on('SIGINT', async () => {
                await mongoose.connection.close();
                console.log('✅ MongoDB connection closed through app termination');
                process.exit(0);
            });

        } catch (err) {
            console.error('❌ Error connecting to MongoDB:', err.message);
            if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
                setTimeout(connectWithRetry, 5000);
            } else {
                console.error('Max retries reached. Could not connect to MongoDB');
                process.exit(1);
            }
        }
    };

    await connectWithRetry();
};

export default connectDB;
