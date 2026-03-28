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

    // Create a pending report in MongoDB
    await Report.create({ jobId, url, status: 'pending' });

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

  // Check if report exists
  const report = await Report.findOne({ jobId });
  if (!report) {
    return res.status(404).json({ error: 'Audit not found.' });
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
    const report = await Report.findOne({ jobId: req.params.reportId });

    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    return res.json(report);
  } catch (err) {
    console.error('GET /report error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch report.' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/v1/audits/history — List recent audits
// ═══════════════════════════════════════════════════════════
router.get('/history', async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('jobId url status scores.overall createdAt processingTime');

    return res.json(reports);
  } catch (err) {
    console.error('GET /history error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

module.exports = router;
