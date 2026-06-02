/**
 * server/routes/transactions.js
 * Full CRUD REST API for transactions
 */
import { Router } from 'express';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

const router = Router();

// ─── Helper: serialise a Mongoose doc to the client-expected shape ─────────
const toClient = (doc) => {
  const obj = doc.toObject({ virtuals: true });
  return {
    id:                  obj.clientId,       // frontend uses "id", not "_id"
    amount:              obj.amount,
    originalAmount:      obj.originalAmount,
    currency:            obj.currency,
    type:                obj.type,
    category:            obj.category,
    paymentMethod:       obj.paymentMethod,
    description:         obj.description,
    tags:                obj.tags,
    notes:               obj.notes,
    date:                obj.date,
    linkedTransactionId: obj.linkedTransactionId,
    createdAt:           obj.createdAt,
    updatedAt:           obj.updatedAt,
  };
};

// ─── GET /api/transactions ─────────────────────────────────────────────────
// Returns all transactions sorted newest-first
router.get('/', async (req, res) => {
  try {
    const { type, category, paymentMethod, dateFrom, dateTo, search } = req.query;

    const query = {};

    if (type && type !== 'all')             query.type            = type;
    if (category && category !== 'all')     query.category        = category;
    if (paymentMethod && paymentMethod !== 'all') query.paymentMethod = paymentMethod;
    if (dateFrom)                           query.date = { ...query.date, $gte: dateFrom };
    if (dateTo)                             query.date = { ...query.date, $lte: dateTo + 'T23:59:59' };

    // Full-text search across description, notes, tags
    if (search && search.trim()) {
      const re = new RegExp(search.trim(), 'i');
      query.$or = [
        { description: re },
        { notes:       re },
        { tags:        re },
      ];
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean({ virtuals: true });

    const result = transactions.map((doc) => ({
      id:                  doc.clientId,
      amount:              doc.amount,
      originalAmount:      doc.originalAmount,
      currency:            doc.currency,
      type:                doc.type,
      category:            doc.category,
      paymentMethod:       doc.paymentMethod,
      description:         doc.description,
      tags:                doc.tags,
      notes:               doc.notes,
      date:                doc.date,
      linkedTransactionId: doc.linkedTransactionId,
      createdAt:           doc.createdAt,
      updatedAt:           doc.updatedAt,
    }));

    res.json({ success: true, count: result.length, data: result });
  } catch (err) {
    console.error('GET /transactions error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/transactions/:id ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const doc = await Transaction.findOne({ clientId: req.params.id });
    if (!doc) return res.status(404).json({ success: false, error: 'Transaction not found' });
    res.json({ success: true, data: toClient(doc) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/transactions ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { id, ...rest } = req.body;

    if (!id) return res.status(400).json({ success: false, error: '`id` (clientId) is required' });

    // Upsert: if same clientId comes in twice (duplicate request), update gracefully
    const doc = await Transaction.findOneAndUpdate(
      { clientId: id },
      { clientId: id, ...rest },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    res.status(201).json({ success: true, data: toClient(doc) });
  } catch (err) {
    // Duplicate key — already exists, return 200
    if (err.code === 11000) {
      const doc = await Transaction.findOne({ clientId: req.body.id });
      return res.status(200).json({ success: true, data: toClient(doc) });
    }
    console.error('POST /transactions error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/transactions/:id ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id, ...rest } = req.body;

    const doc = await Transaction.findOneAndUpdate(
      { clientId: req.params.id },
      { ...rest },
      { returnDocument: 'after', runValidators: true }
    );

    if (!doc) return res.status(404).json({ success: false, error: 'Transaction not found' });
    res.json({ success: true, data: toClient(doc) });
  } catch (err) {
    console.error('PUT /transactions error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/transactions (bulk — clear all) ───────────────────────────
router.delete('/', async (req, res) => {
  try {
    const result = await Transaction.deleteMany({});
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/transactions/:id ─────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Transaction.findOneAndDelete({ clientId: req.params.id });
    if (!doc) return res.status(404).json({ success: false, error: 'Transaction not found' });
    res.json({ success: true, data: toClient(doc) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
