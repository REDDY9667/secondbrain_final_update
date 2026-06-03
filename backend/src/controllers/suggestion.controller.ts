/**
 * Study Suggestion Controller
 *
 * Handles HTTP requests for AI-powered study suggestions.
 */

import { Response, NextFunction } from 'express';
import { studySuggestionService } from '../services/ai/study-suggestion.service';
import { AuthRequest } from '../types/express';
import { AppError } from '../utils/helpers';
import { sendSuccess } from '../utils/helpers';
import  logger from '../utils/logger';

class SuggestionController {
  /**
   * Get daily study plan
   * GET /api/suggestions/daily
   */
  async getDailyStudyPlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      logger.info(`Daily study plan requested for user: ${req.user._id}`);

      const plan = await studySuggestionService.generateDailyStudyPlan(req.user._id.toString());

      sendSuccess(res, { plan }, 'Daily study plan generated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get AI-enhanced daily study plan
   * GET /api/suggestions/daily/enhanced
   */
  async getEnhancedStudyPlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      logger.info(`AI-enhanced study plan requested for user: ${req.user._id}`);

      const plan = await studySuggestionService.getAIEnhancedSuggestions(
        req.user._id.toString()
      );

      sendSuccess(res, { plan }, 'AI-enhanced study plan generated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get focus areas
   * GET /api/suggestions/focus-areas
   */
  async getFocusAreas(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const focusAreas = await studySuggestionService.getQuickFocusAreas(
        req.user._id.toString()
      );

      sendSuccess(
        res,
        { focusAreas, count: focusAreas.length },
        'Focus areas retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

export const suggestionController = new SuggestionController();
