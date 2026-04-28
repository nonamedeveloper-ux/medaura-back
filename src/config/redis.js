const { createClient } = require('redis');
const logger = require('../utils/logger');

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    reconnectStrategy: false, // don't retry if Redis is not available
  },
});

client.on('error', (err) => {
  if (err.code !== 'ECONNREFUSED') logger.error('Redis error:', err.message);
});
client.on('connect', () => logger.info('Redis connected'));

const connectRedis = async () => {
  try {
    if (!client.isOpen) await client.connect();
  } catch (err) {
    logger.warn('Redis unavailable — caching disabled. Install Redis to enable it.');
  }
};

module.exports = { client, connectRedis };
