import { Router } from 'express';
import sourceController from '../controllers/source.controller';
import {
  validateCreateSource,
  validateUpdateSource,
  validateUploadFile,
  validateSourceQuery,
  validateSourceId,
} from '../middleware/source.validation';
import { upload, handleMulterError } from '../middleware/upload';

const router = Router();

// Upload a file as a source
router.post(
  '/upload',
  upload.single('file'),
  handleMulterError,
  validateUploadFile,
  sourceController.uploadFile
);

// Create a new source (URL or manual entry)
router.post('/', validateCreateSource, sourceController.createSource);

// Get all sources with filtering and pagination
router.get('/', validateSourceQuery, sourceController.getSources);

// Get a specific source by ID
router.get('/:id', validateSourceId, sourceController.getSourceById);

// Update a source
router.put('/:id', validateSourceId, validateUpdateSource, sourceController.updateSource);

// Delete a source
router.delete('/:id', validateSourceId, sourceController.deleteSource);

// Extract concepts from a source
router.post('/:id/extract', validateSourceId, sourceController.extractConcepts);

// Get extracted concepts from a source
router.get('/:id/extracted', validateSourceId, sourceController.getExtractedConcepts);

// Save extracted concepts to database
router.post('/:id/save-concepts', validateSourceId, sourceController.saveConcepts);

export default router;
