require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');

// Global Resilience: Prevent crashing on unhandled async errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('✗ Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('✗ Uncaught Exception:', err);
});
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const authMiddleware = require('./middleware/auth');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Required for Render/Vercel proxies to handle rate limiting correctly
app.set('trust proxy', 1);

// ─── Middleware ──────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({ 
  origin: [
    'http://localhost:3000',                            // Local testing
    'https://seo-geo-project.vercel.app'                // Live Vercel frontend
  ],
  credentials: true 
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 audits per window
  message: { error: 'Too many audit requests. Please try again later.' },
});
app.use('/api/v1/audits', limiter);

// ─── Routes ─────────────────────────────────────────────────
// Auth routes — NOT protected (they create sessions)
app.use('/api/v1/auth', require('./routes/auth.routes'));

// All other routes — PROTECTED
app.use('/api/v1/audits', authMiddleware, require('./routes/audit.routes'));
app.use('/api/v1/history', authMiddleware, require('./routes/history.routes'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Database & Start ───────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lumen-audit')
  .then(() => {
    console.log('✓ MongoDB connected');
    
    // In production (Render Free Plan), we don't have a dedicated worker service.
    // Start the worker in the same memory process as the web service.
    if (process.env.NODE_ENV === 'production') {
      console.log('✓ Production mode: Starting integrated background worker...');
      require('./worker');
    }

    app.listen(PORT, () => {
      console.log(`✓ Lumen Audit API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
