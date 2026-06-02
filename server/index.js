/**
 * server/index.js — Express application entry point
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import transactionRoutes from './routes/transactions.js';
import settingsRoutes from './routes/settings.js';
import authRoutes from './routes/auth.js';
import { requireAuth } from './middleware/requireAuth.js';

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security & Middleware ─────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Vite handles CSP for the SPA
}));

// CORS — allow Vite dev server origin in development
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false                           // same-origin in production
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Request Logger (dev only) ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const { default: mongoose } = await import('mongoose');
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    db:     dbState[mongoose.connection.readyState] ?? 'unknown',
    uptime: Math.floor(process.uptime()) + 's',
    time:   new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', requireAuth, transactionRoutes);
app.use('/api/settings',     requireAuth, settingsRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static assets (Vite production build) if available
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  console.log(`📂 Serving static frontend assets from: ${distPath}`);
  app.use(express.static(distPath));

  // Serve frontend routes (React SPA fallback)
  app.get('*all', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn(`⚠️ Warning: Static frontend build folder not found at: ${distPath}`);
}

// ─── 404 handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global error handler ──────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────
// Start Express immediately so the API is always reachable.
// MongoDB connection runs in the background and keeps retrying until Atlas
// allows the connection (e.g. after IP whitelist is updated).
app.listen(PORT, () => {
  console.log(`🚀 FinFlow API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Connecting to MongoDB Atlas…`);
});

// Non-blocking — retries infinitely until Atlas is reachable
connectDB(process.env.MONGO_URI);
