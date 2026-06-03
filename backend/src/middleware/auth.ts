import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types';
import User from '../models/User';
import { AppError } from '../utils/helpers';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError(401, 'Not authorized, no token provided'));
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(new AppError(500, 'JWT secret not configured'));
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Get user from token
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new AppError(401, 'Not authorized, user not found'));
    }

    // Update last active
    user.stats.lastActive = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError(401, 'Not authorized, invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError(401, 'Not authorized, token expired'));
    }
    next(error);
  }
};


