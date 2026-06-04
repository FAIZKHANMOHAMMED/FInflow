/**
 * server/config/db.js
 * Mongoose connection with infinite retry logic and graceful shutdown.
 * Keeps retrying every 5s until Atlas becomes reachable (e.g. after IP whitelist).
 */
import mongoose from 'mongoose';
import dns from 'dns';

// Fallback DNS servers to resolve MongoDB Atlas SRV records, bypassing ISP DNS issues (querySrv ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('⚠️ Warning: Failed to configure custom DNS servers for MongoDB connection:', err.message);
}

const RETRY_DELAY_MS = 5000;
let attempt = 0;

export async function connectDB(uri) {
  while (true) {
    attempt++;
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 6000,
        socketTimeoutMS: 45000,
      });

      console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}`);

      // Graceful shutdown on process exit
      process.once('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
        process.exit(0);
      });

      return; // connected — exit the loop

    } catch (err) {
      const isIPError = err.message?.toLowerCase().includes('whitelist') ||
                        err.message?.toLowerCase().includes('ip');

      if (isIPError) {
        console.error(`❌ [Attempt ${attempt}] Atlas IP not whitelisted yet. Retrying in ${RETRY_DELAY_MS / 1000}s…`);
        console.error('   → Go to cloud.mongodb.com → Network Access → Add IP Address → Allow from Anywhere (0.0.0.0/0)');
      } else {
        console.error(`❌ [Attempt ${attempt}] MongoDB error: ${err.message}. Retrying in ${RETRY_DELAY_MS / 1000}s…`);
      }

      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      // loop continues — will retry until success
    }
  }
}
