import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import authService from '../services/auth.service';
import { sendSuccess, AppError } from '../utils/helpers';
import logger from '../utils/logger';

export class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;

      const { user, token } = await authService.register(email, password, name);

      logger.info(`New user registered: ${email}`);

      sendSuccess(
        res,
        { user, token },
        'User registered successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const { user, token } = await authService.login(email, password);

      logger.info(`User logged in: ${email}`);

      sendSuccess(res, { user, token }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const user = await authService.getMe(req.user._id.toString());

      sendSuccess(res, { user }, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const user = await authService.updateProfile(req.user._id.toString(), req.body);

      sendSuccess(res, { user }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const { currentPassword, newPassword } = req.body;

      await authService.changePassword(
        req.user._id.toString(),
        currentPassword,
        newPassword
      );

      sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // In a stateless JWT setup, logout is handled client-side by removing the token
      // For a more secure implementation, you could maintain a token blacklist in Redis

      sendSuccess(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
