import { Router } from 'express';
import conceptController from '../controllers/concept.controller';
import {
  validateCreateConcept,
  validateUpdateConcept,
  validateConceptQuery,
  validateConceptId,
} from '../middleware/concept.validation';

const router = Router();

// Get concept statistics
router.get('/stats', conceptController.getConceptStats);

// Get all unique tags
router.get('/tags', conceptController.getAllTags);

// Get low confidence concepts (needs review)
router.get('/low-confidence', validateConceptQuery, conceptController.getLowConfidenceConcepts);

// Get due concepts (spaced repetition)
router.get('/due', conceptController.getDueConcepts);

// Create a new concept
router.post('/', validateCreateConcept, conceptController.createConcept);

// Get all concepts with filtering and pagination
router.get('/', validateConceptQuery, conceptController.getConcepts);

// Get a specific concept by ID
router.get('/:id', validateConceptId, conceptController.getConceptById);

// Update a concept
router.put('/:id', validateConceptId, validateUpdateConcept, conceptController.updateConcept);

// Delete a concept
router.delete('/:id', validateConceptId, conceptController.deleteConcept);

// Record a review for a concept (spaced repetition)
router.post('/:id/review', validateConceptId, conceptController.recordReview);

export default router;
