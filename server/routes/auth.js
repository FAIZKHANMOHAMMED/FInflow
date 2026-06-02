import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

// Cookie options for JWT
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ─── POST /api/auth/google ────────────────────────────────────────────────
// Receives Google credential JWT from frontend, verifies it, issues app cookie
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, error: 'No credential provided' });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    console.log('Verifying token with Client ID:', clientId?.slice(0, 30) + '...');

    // 1. Verify Google token
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    
    // 2. Find or create User
    let user = await User.findOne({ googleId: payload.sub });
    const isNewUser = !user;
    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
    }

    // Assign any existing unassigned data to this user (for single-tenant to multi-tenant migration)
    const { default: Transaction } = await import('../models/Transaction.js');
    const { default: Settings } = await import('../models/Settings.js');
    
    await Transaction.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: user._id } }
    );
    
    await Settings.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: user._id } }
    );

    // 3. Issue JWT session
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    // 4. Set HTTP-Only Cookie
    res.cookie('token', token, cookieOptions);
    
    res.json({ success: true, data: { id: user.id, email: user.email, name: user.name, picture: user.picture } });
  } catch (err) {
    console.error('Auth Error:', err.message);
    res.status(401).json({ success: false, error: 'Authentication failed', detail: err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────
// Returns the currently logged in user based on the cookie
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    res.json({ success: true, data: { id: user.id, email: user.email, name: user.name, picture: user.picture } });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.json({ success: true });
});

export default router;
