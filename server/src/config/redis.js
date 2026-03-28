const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

connection.on('connect', () => console.log('✓ Redis connected'));
connection.on('error', (err) => console.error('✗ Redis error:', err.message));

module.exports = { connection };
