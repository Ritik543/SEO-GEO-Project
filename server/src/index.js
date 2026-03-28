require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const auditRoutes = require('./routes/audit.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 audits per window
  message: { error: 'Too many audit requests. Please try again later.' },
});
app.use('/api/v1/audits', limiter);

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/v1/audits', auditRoutes);

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
