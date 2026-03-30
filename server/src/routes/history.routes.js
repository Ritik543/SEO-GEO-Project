const router = require('express').Router();
const mongoose = require('mongoose');
const Report = require('../models/Report');

// GET /api/v1/history?page=1&limit=20&search=example.com
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const query = { userId: req.userId };
    if (search) query.url = { $regex: search, $options: 'i' };

    const [reports, total] = await Promise.all([
      Report.find(query)
        .select('url scores status createdAt completedAt pdfUrl jobId')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit).lean(),
      Report.countDocuments(query)
    ]);

    res.json({
      reports,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + reports.length < total
      }
    });
  } catch (e) {
    console.error('GET /history error:', e.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// DELETE /api/v1/history/:id
router.delete('/:id', async (req, res) => {
  try {
    // ALWAYS filter by userId — never delete another user's report
    const query = {
      $or: [
        { jobId: req.params.id },
        ...(mongoose.Types.ObjectId.isValid(req.params.id) ? [{ _id: req.params.id }] : [])
      ],
      userId: req.userId
    };

    const report = await Report.findOneAndDelete(query);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ message: 'Report deleted' });
  } catch (e) {
    console.error('DELETE /history error:', e.message);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
