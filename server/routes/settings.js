/**
 * server/routes/settings.js
 * GET / PUT user settings (singleton document)
 */
import { Router } from 'express';
import Settings from '../models/Settings.js';

const router = Router();

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'default' });
    if (!settings) {
      settings = await Settings.create({ key: 'default' });
    }
    res.json({ success: true, data: { baseCurrency: settings.baseCurrency, theme: settings.theme } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  try {
    const { baseCurrency, theme } = req.body;
    const settings = await Settings.findOneAndUpdate(
      { key: 'default' },
      { baseCurrency, theme },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );
    res.json({ success: true, data: { baseCurrency: settings.baseCurrency, theme: settings.theme } });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
