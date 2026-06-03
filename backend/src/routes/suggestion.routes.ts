/**
 * Study Suggestion Routes
 *
 * Routes for AI-powered study suggestions and daily plans.
 */

import express from 'express';
import { suggestionController } from '../controllers/suggestion.controller';
import { protect } from '../middleware/auth';

const router = express.Router();

// All suggestion routes require authentication
router.use(protect);

/**
 * @route   GET /api/suggestions/daily
 * @desc    Get daily study plan (basic)
 * @access  Private
 */
router.get('/daily', suggestionController.getDailyStudyPlan);

/**
 * @route   GET /api/suggestions/daily/enhanced
 * @desc    Get AI-enhanced daily study plan with personalized insights
 * @access  Private
 */
router.get('/daily/enhanced', suggestionController.getEnhancedStudyPlan);

/**
 * @route   GET /api/suggestions/focus-areas
 * @desc    Get areas where user needs to focus (by tags/categories)
 * @access  Private
 */
router.get('/focus-areas', suggestionController.getFocusAreas);

export default router;
