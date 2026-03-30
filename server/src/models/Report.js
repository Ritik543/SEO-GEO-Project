const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  category: { type: String, enum: ['technical_seo', 'onpage_seo', 'schema', 'geo'], required: true },
  severity: { type: String, enum: ['critical', 'warning', 'info'], required: true },
  title: { type: String, required: true },
  description: String,
  current_code: String,
  suggested_code: String,
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
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    jobId: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true },
    mode: { 
      type: String, 
      enum: ['url', 'sitemap', 'html'], 
      default: 'url' 
    },
    htmlSource: { type: String, select: false }, // Use select: false so it's not sent to client by default
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
    geoInsights: { type: mongoose.Schema.Types.Mixed },
    performance: {
      mobile: {
        score: { type: Number, default: 0 },
        lcp: { value: Number, rating: String },
        fid: { value: Number, rating: String },
        cls: { value: Number, rating: String },
      },
      desktop: {
        score: { type: Number, default: 0 },
        lcp: { value: Number, rating: String },
        fid: { value: Number, rating: String },
        cls: { value: Number, rating: String },
      },
    },
    
    rawExtraction: {
      title: String,
      metaDescription: String,
      headings: mongoose.Schema.Types.Mixed,
      wordCount: Number,
      existingSchema: mongoose.Schema.Types.Mixed,
    },
    processingTime: Number, // milliseconds
    completedAt: Date,
    pdfUrl: String,
    error: String,
    crawlMethod: {
      type: String,
      enum: ['direct', 'google_cache', 'common_crawl', 'blocked'],
    },
    crawlWarning: {
      type: { type: String, enum: ['BLOCKED', 'CACHED'] },
      message: String,
      crawlMethod: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
