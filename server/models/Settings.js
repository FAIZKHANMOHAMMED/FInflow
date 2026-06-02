/**
 * server/models/Settings.js
 * Stores user settings in MongoDB (singleton document — one per app)
 */
import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    // Singleton key — always "default"
    key: { type: String, default: 'default', unique: true },

    baseCurrency: { type: String, default: 'INR' },
    theme:        { type: String, enum: ['dark', 'light'], default: 'dark' },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', SettingsSchema);
