import Redis from 'ioredis';
import logger from '../utils/logger';

let redisClient: Redis | null = null;

const connectRedis = (): Redis => {
  try {
    const redisURL = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = new Redis(redisURL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    return redisClient;
  } catch (error) {
    logger.error('Redis initialization failed:', error);
    throw error;
  }
};

export { connectRedis, redisClient };
export default connectRedis;
