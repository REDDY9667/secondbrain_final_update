/**
 * Challenge Routes
 *
 * Routes for AI-generated quiz challenges.
 */

import express from 'express';
import { challengeController } from '../controllers/challenge.controller';
import { protect } from '../middleware/auth';

const router = express.Router();

// All challenge routes require authentication
router.use(protect);

/**
 * @route   POST /api/challenges/generate
 * @desc    Generate AI challenges for a concept
 * @access  Private
 * @body    { conceptId, difficulty?, count? }
 */
router.post('/generate', challengeController.generateChallenges);

/**
 * @route   GET /api/challenges/concept/:conceptId
 * @desc    Get all challenges for a specific concept
 * @access  Private
 * @query   limit - Number of challenges to return (default: 10, max: 50)
 */
router.get('/concept/:conceptId', challengeController.getChallengesForConcept);

/**
 * @route   POST /api/challenges/:challengeId/attempt
 * @desc    Submit an answer to a challenge
 * @access  Private
 * @body    { selectedAnswer }
 */
router.post('/:challengeId/attempt', challengeController.submitChallengeAttempt);

export default router;
