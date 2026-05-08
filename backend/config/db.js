import mongoose from 'mongoose';

/**
 * Production-ready MongoDB connection utility.
 * - No localhost fallback — requires MONGODB_URI env var
 * - Retry logic with exponential backoff (3 attempts)
 * - Connection event logging
 * - Timeout configuration for cloud databases
 */

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error('✗ FATAL: MONGODB_URI environment variable is not set.');
        console.error('  → Set MONGODB_URI to your MongoDB Atlas connection string.');
        process.exit(1);
    }

    // Mongoose connection options for production reliability
    const options = {
        serverSelectionTimeoutMS: 10000,  // Timeout for initial server selection
        socketTimeoutMS: 45000,           // Timeout for socket operations
        maxPoolSize: 10,                  // Connection pool size
        retryWrites: true,
    };

    // Connection event listeners (set once)
    mongoose.connection.on('connected', () => {
        console.log('✓ MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
        console.error('✗ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('⚠ MongoDB disconnected');
    });

    // Mask credentials in logs
    const maskedUri = mongoUri.includes('@')
        ? `mongodb+srv://***@${mongoUri.split('@')[1]?.split('?')[0] || '***'}`
        : 'mongodb://***';

    // Retry loop
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`📡 MongoDB connection attempt ${attempt}/${MAX_RETRIES} → ${maskedUri}`);
            await mongoose.connect(mongoUri, options);
            return; // Success — exit function
        } catch (err) {
            console.error(`✗ Attempt ${attempt} failed: ${err.message}`);

            if (attempt < MAX_RETRIES) {
                const delay = RETRY_DELAY_MS * attempt;
                console.log(`  ↻ Retrying in ${delay / 1000}s...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                console.error('✗ FATAL: All MongoDB connection attempts failed.');
                console.error('  → Check your MONGODB_URI and network connectivity.');
                process.exit(1);
            }
        }
    }
};

export default connectDB;
