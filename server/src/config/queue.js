const Queue = require('bull');

const auditQueue = new Queue('audit', process.env.REDIS_URL || 'redis://localhost:6379', {
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
