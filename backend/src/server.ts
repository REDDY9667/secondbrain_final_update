
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';

import dotenv from 'dotenv';
// Load environment variables
dotenv.config();


import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';
import { protect } from './middleware/auth';
import authRoutes from './routes/auth.routes';
import conceptRoutes from './routes/concept.routes';
import sourceRoutes from './routes/source.routes';
import decayRoutes from './routes/decay.routes';
import challengeRoutes from './routes/challenge.routes';
import suggestionRoutes from './routes/suggestion.routes';
import logger from './utils/logger';





// Create Express app
const app: Express = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();



// Security middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);


// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SecondBrain API Documentation',
}));

// Redirect /docs to /api-docs
app.get('/docs', (req, res) => {
  res.redirect('/api-docs');
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req: Request, res: Response, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'SecondBrain API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
// Auth routes (public + protected)
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/concepts', protect, conceptRoutes);
app.use('/api/sources', protect, sourceRoutes);
app.use('/api/decay', protect, decayRoutes);
app.use('/api/challenges', protect, challengeRoutes);
app.use('/api/suggestions', protect, suggestionRoutes);


app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'SecondBrain API',
    version: '1.0.0',
    health: '/health',
    docs: '/api-docs'
  });
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

export default app;
