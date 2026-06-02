/**
 * server/models/Settings.js
 * Stores user settings in MongoDB (singleton document — one per app)
 */
import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    // User association
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true, // One settings document per user
    },

    baseCurrency: { type: String, default: 'INR' },
    theme:        { type: String, enum: ['dark', 'light'], default: 'dark' },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', SettingsSchema);
