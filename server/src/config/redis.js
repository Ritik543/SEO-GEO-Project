const IORedis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // Critical: prevent command-queue crashes when closed
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000); // Max 3s retry
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true; // Reconnect for readonly errors
    }
    return false;
  }
});

connection.on('connect', () => console.log('✓ Redis connected'));
connection.on('ready', () => console.log('✓ Redis ready for commands'));
connection.on('error', (err) => console.error('✗ Redis error:', err.message));
connection.on('close', () => console.warn('! Redis connection closed'));
connection.on('reconnecting', () => console.log('↺ Redis reconnecting...'));
connection.on('end', () => console.error('✗ Redis connection ended — server stability may be compromised'));

module.exports = { connection };
