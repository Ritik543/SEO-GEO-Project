const Queue = require('bull');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Configure Bull with robust connection settings
const auditQueue = new Queue('audit', REDIS_URL, {
  redis: {
    maxRetriesPerRequest: null, // Critical: prevent command-queue crashes when closed
    enableReadyCheck: false,    // Faster reconnection
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000, // 10s base delay
    },
    removeOnComplete: true,
  }
});

module.exports = { auditQueue };
