const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  category: { type: String, enum: ['technical_seo', 'onpage_seo', 'schema', 'geo'], required: true },
  severity: { type: String, enum: ['critical', 'warning', 'info'], required: true },
  title: { type: String, required: true },
  description: String,
});

const recommendationSchema = new mongoose.Schema({
  category: { type: String, enum: ['technical_seo', 'onpage_seo', 'schema', 'geo'], required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
  problem: { type: String, required: true },
  why: String,
  fix: String,
  example: String,
});

const scoreSchema = new mongoose.Schema({
  technical_seo: { type: Number, min: 0, max: 100, default: 0 },
  onpage_seo: { type: Number, min: 0, max: 100, default: 0 },
  schema: { type: Number, min: 0, max: 100, default: 0 },
  geo: { type: Number, min: 0, max: 100, default: 0 },
  overall: { type: Number, min: 0, max: 100, default: 0 },
});

const reportSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'crawling', 'extracting', 'analyzing', 'scoring', 'completed', 'failed'],
      default: 'pending',
    },
    // New AI Data Structure
    pageType: String,
    entities: {
      who: [String],
      what: [String],
      how: [String],
      result: [String]
    },
    improvedSchema: mongoose.Schema.Types.Mixed,
    
    // Legacy / Parallel Fields
    scores: scoreSchema,
    issues: [issueSchema],
    recommendations: [recommendationSchema],
    suggestedSchema: { type: mongoose.Schema.Types.Mixed }, // JSON-LD
    geoInsights: { type: mongoose.Schema.Types.Mixed },
    
    rawExtraction: {
      title: String,
      metaDescription: String,
      headings: mongoose.Schema.Types.Mixed,
      wordCount: Number,
      existingSchema: mongoose.Schema.Types.Mixed,
    },
    processingTime: Number, // milliseconds
    error: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
