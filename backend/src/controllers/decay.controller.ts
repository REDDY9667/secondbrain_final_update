/**
 * Decay Detection Controller
 *
 * Handles HTTP AuthRequests for knowledge decay detection.
 */

import { Response, NextFunction } from 'express';
import { decayDetectionService } from '../services/decay-detection.service';
import { AuthRequest } from '../types/express';
import { AppError } from '../utils/helpers';
import { sendSuccess } from '../utils/helpers';
import logger from '../utils/logger';

class DecayController {
  /**
   * Get decay analysis for current user
   * GET /api/decay/analysis
   */
  async getDecayAnalysis(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      logger.info(`Decay analysis AuthRequested for user: ${req.user._id}`);

      const analysis = await decayDetectionService.analyzeUserDecay(req.user._id.toString());

      sendSuccess(res, { analysis }, 'Decay analysis completed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get urgent concepts that need immediate review
   * GET /api/decay/urgent?limit=10
   */
  async getUrgentConcepts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const limit = parseInt(req.query.limit as string) || 10;

      if (limit < 1 || limit > 50) {
        throw new AppError(400, 'Limit must be between 1 and 50');
      }

      const concepts = await decayDetectionService.getUrgentConcepts(
        req.user._id.toString(),
        limit
      );

      sendSuccess(
        res,
        { concepts, count: concepts.length },
        'Urgent concepts retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get decay summary (quick overview)
   * GET /api/decay/summary
   */
  async getDecaySummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const analysis = await decayDetectionService.analyzeUserDecay(req.user._id.toString());

      // Return only summary info (lightweight response)
      const summary = {
        totalConcepts: analysis.totalConcepts,
        ConceptsAtRisk: analysis.ConceptsAtRisk,
        summary: analysis.summary,
        topRecommendation: analysis.recommendations[0] || null,
      };

      sendSuccess(res, { summary }, 'Decay summary retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const decayController = new DecayController();
