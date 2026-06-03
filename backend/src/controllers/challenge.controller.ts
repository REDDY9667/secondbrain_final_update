/**
 * Challenge Controller
 *
 * Handles HTTP requests for AI-generated challenges.
 */

import { Response, NextFunction } from 'express';
import { challengeGeneratorService } from '../services/ai/challenge-generator.service';
import { AuthRequest } from '../types/express';
import { AppError } from '../utils/helpers';
import { sendSuccess } from '../utils/helpers';
import logger from '../utils/logger';

class ChallengeController {
  /**
   * Generate challenges for a concept
   * POST /api/challenges/generate
   * Body: { conceptId, difficulty?, count? }
   */
  async generateChallenges(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const { conceptId, difficulty, count } = req.body;

      if (!conceptId) {
        throw new AppError(400, 'Concept ID is required');
      }

      if (count && (count < 1 || count > 10)) {
        throw new AppError(400, 'Count must be between 1 and 10');
      }

      const validDifficulties = ['beginner', 'intermediate', 'advanced'];

      if (
        difficulty &&
        !validDifficulties.includes(difficulty.toLowerCase())
      ) {
        throw new AppError(
          400,
          'Difficulty must be beginner, intermediate, or advanced'
        );
      }

      const normalizedDifficulty = difficulty
        ? difficulty.toLowerCase()
        : undefined;

      logger.info(`Generating challenges for concept: ${conceptId}`);

      const result = await challengeGeneratorService.generateChallenges({
        conceptId,
        userId: req.user._id.toString(),
        difficulty,
        count: count || 1,
      });

      sendSuccess(res, result, 'Challenges generated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get challenges for a concept
   * GET /api/challenges/concept/:conceptId?limit=10
   */
  async getChallengesForConcept(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const { conceptId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      if (limit < 1 || limit > 50) {
        throw new AppError(400, 'Limit must be between 1 and 50');
      }

      const challenges = await challengeGeneratorService.getChallengesForConcept(
        conceptId,
        req.user._id.toString(),
        limit
      );

      sendSuccess(
        res,
        { challenges, count: challenges.length },
        'Challenges retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit challenge attempt
   * POST /api/challenges/:challengeId/attempt
   * Body: { selectedAnswer }
   */
  async submitChallengeAttempt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const { challengeId } = req.params;
      const { selectedAnswer } = req.body;

      if (selectedAnswer === undefined || selectedAnswer === null) {
        throw new AppError(400, 'Selected answer is required');
      }

      if (typeof selectedAnswer !== 'number' || selectedAnswer < 0) {
        throw new AppError(400, 'Selected answer must be a non-negative number');
      }

      const result = await challengeGeneratorService.recordChallengeAttempt(
        challengeId,
        req.user._id.toString(),
        selectedAnswer
      );

      sendSuccess(
        res,
        {
          correct: result.correct,
          correctAnswer: result.challenge.correctAnswer,
          explanation: result.challenge.explanation,
          successRate: result.challenge.successRate,
        },
        result.correct ? 'Correct answer!' : 'Incorrect answer'
      );
    } catch (error) {
      next(error);
    }
  }
}

export const challengeController = new ChallengeController();
