import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    jobId: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'crawling', 'extracting', 'analyzing', 'scoring', 'completed', 'failed'],
      default: 'pending',
    },
    scores: mongoose.Schema.Types.Mixed,
    issues: mongoose.Schema.Types.Mixed,
    recommendations: mongoose.Schema.Types.Mixed,
    geoInsights: mongoose.Schema.Types.Mixed,
    performance: mongoose.Schema.Types.Mixed,
    improvedSchema: mongoose.Schema.Types.Mixed,
    processingTime: Number,
    createdAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Report || mongoose.model('Report', reportSchema);
