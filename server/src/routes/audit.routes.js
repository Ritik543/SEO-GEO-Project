const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { auditQueue } = require('../config/queue');
const Report = require('../models/Report');
const IORedis = require('ioredis');

const router = express.Router();

// ═══════════════════════════════════════════════════════════
// POST /api/v1/audits — Start a new audit
// ═══════════════════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'A valid URL is required.' });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format.' });
    }

    const jobId = uuidv4();

    // Create a pending report in MongoDB (linked to user)
    await Report.create({ 
      jobId, 
      url, 
      status: 'pending',
      userId: req.userId 
    });

    // Enqueue the job for the worker
    await auditQueue.add('audit', { url, jobId }, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });

    return res.status(202).json({
      jobId,
      message: 'Audit queued successfully.',
      stream: `/api/v1/audits/stream/${jobId}`,
    });
  } catch (err) {
    console.error('POST /audits error:', err.message);
    return res.status(500).json({ error: 'Failed to queue audit.' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/v1/audits/stream/:jobId — SSE real-time progress
// ═══════════════════════════════════════════════════════════
router.get('/stream/:jobId', async (req, res) => {
  const { jobId } = req.params;

  // Check if report exists AND belongs to the user
  const report = await Report.findOne({ jobId, userId: req.userId });
  if (!report) {
    return res.status(404).json({ error: 'Audit not found or access denied.' });
  }

  // If already completed, send the result immediately
  if (report.status === 'completed' || report.status === 'failed') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`event: ${report.status}\ndata: ${JSON.stringify({ reportId: jobId, status: report.status })}\n\n`);
    res.end();
    return;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Render/nginx compatibility
  res.flushHeaders();

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ jobId, status: 'connected' })}\n\n`);

  // Subscribe to Redis Pub/Sub for this job's progress
  const subscriber = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
  const channel = `audit:${jobId}`;

  subscriber.subscribe(channel, (err) => {
    if (err) {
      console.error('Redis subscribe error:', err.message);
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'Stream subscription failed.' })}\n\n`);
      res.end();
    }
  });

  subscriber.on('message', (ch, message) => {
    if (ch !== channel) return;

    try {
      const data = JSON.parse(message);
      res.write(`event: progress\ndata: ${JSON.stringify(data)}\n\n`);

      // Close the stream on terminal states
      if (data.stage === 'completed' || data.stage === 'failed') {
        res.write(`event: ${data.stage}\ndata: ${JSON.stringify({ reportId: jobId, stage: data.stage })}\n\n`);
        setTimeout(() => {
          try {
            if (subscriber.status === 'ready' || subscriber.status === 'connect') {
              subscriber.unsubscribe(channel);
              subscriber.disconnect();
            }
          } catch (e) {}
          res.end();
        }, 500);
      }
    } catch {
      // skip malformed messages
    }
  });

  // Cleanup on client disconnect
  req.on('close', () => {
    try {
      if (subscriber.status === 'ready' || subscriber.status === 'connect') {
        subscriber.unsubscribe(channel);
        subscriber.disconnect();
      }
    } catch (e) {}
  });
});

// ═══════════════════════════════════════════════════════════
// GET /api/v1/audits/report/:reportId — Fetch completed report
// ═══════════════════════════════════════════════════════════
router.get('/report/:reportId', async (req, res) => {
  try {
    const report = await Report.findOne({ 
      jobId: req.params.reportId,
      userId: req.userId 
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found or access denied.' });
    }

    return res.json(report);
  } catch (err) {
    console.error('GET /report error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch report.' });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/v1/audits/report/:id/pdf — PDF generation
// ═══════════════════════════════════════════════════════════
const { generatePDF } = require('../services/pdf.service');

router.post('/report/:id/pdf', async (req, res) => {
  try {
    const report = await Report.findOne({
      jobId: req.params.id,
      userId: req.userId  // Auth check
    });
    
    if (!report) return res.status(404).json({ error: 'Report not found or access denied.' });
    if (report.status !== 'completed') return res.status(400).json({ error: 'Report not ready yet.' });

    const buffer = await generatePDF(req.params.id);
    const filename = `audit-${report.url
      .replace(/https?:\/\//, '')
      .replace(/[^a-z0-9]/gi, '-')
      .substring(0, 40)}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length
    });
    res.send(buffer);
  } catch (e) {
    console.error('PDF generation failed:', e);
    res.status(500).json({ error: 'PDF generation failed. Try again.' });
  }
});

module.exports = router;
