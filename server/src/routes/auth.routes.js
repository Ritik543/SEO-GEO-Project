const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const signToken = (userId) => jwt.sign(
  { id: userId },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);

const cookieOptions = {
  httpOnly: true,
  secure: true, // Always secure for cross-site cookies
  sameSite: 'none', // Critical for Vercel -> Render cross-site auth
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
};

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be 8+ characters' });
    if (await User.findOne({ email }))
      return res.status(409).json({ error: 'Account already exists with this email' });
    const user = await User.create({ name, email, password });
    res.cookie('token', signToken(user._id), cookieOptions);
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || user.provider !== 'local')
      return res.status(401).json({ error: 'Invalid email or password' });
    const valid = await user.checkPassword(password, user.password);
    if (!valid)
      return res.status(401).json({ error: 'Invalid email or password' });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    res.cookie('token', signToken(user._id), cookieOptions);
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', { ...cookieOptions, maxAge: 0 });
  res.json({ message: 'Logged out successfully' });
});

// GET /api/v1/auth/me  — restore session on page load
router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json({
    user: { id: user._id, name: user.name, email: user.email,
      avatar: user.avatar, auditCount: user.auditCount }
  });
});

// POST /api/v1/auth/sso  — called by NextAuth.js after SSO callback
router.post('/sso', async (req, res) => {
  try {
    const { email, name, avatar, provider, providerId } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name, avatar, provider, providerId });
    } else {
      user.avatar = avatar; user.name = name;
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    }
    res.cookie('token', signToken(user._id), cookieOptions);
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ error: 'SSO authentication failed' });
  }
});

module.exports = router;
