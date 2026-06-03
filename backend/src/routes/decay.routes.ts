/**
 * Decay Detection Routes
 *
 * Routes for knowledge decay detection and alerts.
 */

import express from 'express';
import { decayController } from '../controllers/decay.controller';
import { protect } from '../middleware/auth';

const router = express.Router();

// All decay routes require authentication
router.use(protect);

/**
 * @route   GET /api/decay/analysis
 * @desc    Get comprehensive decay analysis for user
 * @access  Private
 */
router.get('/analysis', decayController.getDecayAnalysis);

/**
 * @route   GET /api/decay/urgent
 * @desc    Get urgent concepts needing immediate review
 * @access  Private
 * @query   limit - Number of concepts to return (default: 10, max: 50)
 */
router.get('/urgent', decayController.getUrgentConcepts);

/**
 * @route   GET /api/decay/summary
 * @desc    Get quick decay summary
 * @access  Private
 */
router.get('/summary', decayController.getDecaySummary);

export default router;
