import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/secondbrain',
  redisURL: process.env.REDIS_URL || 'redis://localhost:6379',
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_change_this',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
  },
  clientURL: process.env.CLIENT_URL || 'http://localhost:4200',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10 MB
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};
