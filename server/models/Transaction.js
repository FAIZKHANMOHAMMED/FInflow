/**
 * server/models/Transaction.js
 * Mongoose schema for a financial transaction.
 * Mirrors the client-side shape exactly so no transformation is needed.
 */
import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      // Temporarily not strictly required until we assign orphaned data
    },
    // Client-generated UUID — used for optimistic UI deduplication
    clientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Monetary fields — stored as Number in INR (base currency)
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than zero'],
    },
    originalAmount: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },

    // Transaction classification
    type: {
      type: String,
      enum: ['income', 'expense', 'transfer'],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
    },

    // User-entered content
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Description too long'],
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Notes too long'],
    },

    // Date stored as local ISO string (NOT UTC) to prevent timezone shift
    // e.g. "2026-06-01T20:00:00" — no Z suffix
    date: {
      type: String,
      required: true,
    },

    // Refund / reversal linking
    linkedTransactionId: {
      type: String,
      default: null,
    },
  },
  {
    // Adds createdAt + updatedAt automatically
    timestamps: true,
    // Lean queries return plain JS objects (faster)
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for fast sorting / filtering by date within a user's scope
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1 });

// Virtual: expose clientId as "id" so frontend doesn't need to change
TransactionSchema.virtual('id').get(function () {
  return this.clientId;
});

export default mongoose.model('Transaction', TransactionSchema);
