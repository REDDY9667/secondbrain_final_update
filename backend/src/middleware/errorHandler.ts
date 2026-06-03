import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/helpers';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';

  // AppError (custom errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values((err as any).errors)
      .map((e: any) => e.message)
      .join(', ');
  }

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    statusCode = 400;
    const field = Object.keys((err as any).keyPattern)[0];
    message = `${field} already exists`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // JWT errors are handled in auth middleware
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Not authorized';
  }

  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    statusCode,
  });

  // Send response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(404, `Route not found: ${req.originalUrl}`);
  next(error);
};
