import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import sourceService from '../services/source.service';
import { sendSuccess, AppError } from '../utils/helpers';
import logger from '../utils/logger';
import { conceptExtractionService } from '../services/ai/concept-extraction.service';
import { ConceptService } from '../services/concept.service';
import { textExtractionService } from '../services/ai/text-extraction.service';
import s3Service from '../services/s3.service';

export class SourceController {
  async createSource(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const { title, type, url, content, tags, metadata } = req.body;

      const source = await sourceService.createSource(req.user._id.toString(), {
        title,
        type,
        url,
        content,
        tags,
        metadata,
      });

      logger.info(`Source created: ${source._id} by user: ${req.user._id.toString()}`);

      sendSuccess(res, { source }, 'Source created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async uploadFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      if (!req.file) {
        throw new AppError(400, 'No file uploaded');
      }

      const { title, type, tags } = req.body;
      const s3Key =
        `uploads/${req.user._id}/${Date.now()}-${req.file.originalname}`;

      await s3Service.uploadFile(
        req.file.path,
        s3Key,
        req.file.mimetype
      );
      const source = await sourceService.createSourceFromFile(
        req.user._id.toString(),
        {
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size,
          mimetype: req.file.mimetype,
          s3Key,
        },
        {
          title: title || req.file.originalname,
          type:
            req.file.mimetype === 'application/pdf'
              ? 'pdf'
              : req.file.mimetype === 'application/json'
                ? 'note'
                : req.file.mimetype === 'text/plain'
                  ? 'note'
                  : 'other',
          tags: tags ? tags.split(',') : [],
        }
      );

      logger.info(`File uploaded: ${source._id} by user: ${req.user._id.toString()}`);

      sendSuccess(res, { source }, 'File uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getSources(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const { page, limit, type, processed } = req.query;

      const filters = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        type: type as string,
        processed: processed === 'true' ? true : processed === 'false' ? false : undefined,
      };

      const result = await sourceService.getSources(req.user._id.toString(), filters);

      sendSuccess(res, result, 'Sources retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSourceById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const source = await sourceService.getSourceById(req.user._id.toString(), req.params.id);

      sendSuccess(res, { source }, 'Source retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateSource(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const source = await sourceService.updateSource(
        req.user._id.toString(),
        req.params.id,
        req.body
      );

      logger.info(`Source updated: ${source._id} by user: ${req.user._id.toString()}`);

      sendSuccess(res, { source }, 'Source updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteSource(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      await sourceService.deleteSource(req.user._id.toString(), req.params.id);

      logger.info(`Source deleted: ${req.params.id} by user: ${req.user._id.toString()}`);

      sendSuccess(res, null, 'Source deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async extractConcepts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const source = await sourceService.getSourceById(req.user._id.toString(), req.params.id);

      // Check if source has already been processed
      if (source.processed) {
        throw new AppError(400, 'Source has already been processed');
      }

      let extractionResult;

      if (source.s3Key) {

        const localFilePath =
          await s3Service.downloadFile(source.s3Key);

        // PDF extraction
        if (source.type === 'pdf') {

          extractionResult =
            await conceptExtractionService.extractFromPDF(localFilePath);

        } else {

          // Text/markdown/note extraction
          const extractionResultText =
            await textExtractionService.extractFromTextFile(localFilePath);

          const concepts =
            await conceptExtractionService.extractConceptsFromLargeText(
              extractionResultText.text
            );

          extractionResult = {
            concepts,
            sourceText:
              extractionResultText.text.substring(0, 1000) + '...',
            metadata: {
              ...extractionResultText.metadata,
              extractedAt: new Date(),
            },
          };
        }

      } else if (source.type === 'article' && source.url) {

        extractionResult =
          await conceptExtractionService.extractFromURL(source.url);

      } else if (source.content) {

        const concepts =
          await conceptExtractionService.extractConceptsFromText(source.content);

        extractionResult = {
          concepts,
          sourceText: source.content.substring(0, 1000) + '...',
          metadata: { extractedAt: new Date() },
        };

      } else {

        throw new AppError(400, 'Source does not have extractable content');
      }

      logger.info(
        `Extracted ${extractionResult.concepts.length} concepts from source: ${source._id}`
      );

      sendSuccess(
        res,
        {
          sourceId: source._id,
          sourceTitle: source.title,
          concepts: extractionResult.concepts,
          metadata: extractionResult.metadata,
        },
        'Concepts extracted successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async saveConcepts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const { concepts } = req.body;

      if (!Array.isArray(concepts) || concepts.length === 0) {
        throw new AppError(400, 'Please provide an array of concepts to save');
      }

      // Verify source exists and belongs to user
      const source = await sourceService.getSourceById(req.user._id.toString(), req.params.id);

      const conceptService = new ConceptService();
      const savedConcepts = [];

      // Save each concept
      for (const conceptData of concepts) {
        const concept = await conceptService.createConcept(req.user._id.toString(), {
          title: conceptData.title,
          description: conceptData.description,
          tags: conceptData.tags || [],
          difficulty: conceptData.difficulty || 'intermediate',
          notes: conceptData.notes,
          sourceId: source._id.toString(),
        });

        savedConcepts.push(concept);
      }

      // Mark source as processed and update concept count
      await sourceService.markAsProcessed(source._id.toString(), savedConcepts.length);

      logger.info(
        `Saved ${savedConcepts.length} concepts from source: ${source._id} for user: ${req.user._id.toString()}`
      );

      sendSuccess(
        res,
        {
          source: await sourceService.getSourceById(req.user._id.toString(), req.params.id),
          concepts: savedConcepts,
          count: savedConcepts.length,
        },
        `Successfully saved ${savedConcepts.length} concept(s)`,
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async getExtractedConcepts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const source = await sourceService.getSourceById(req.user._id.toString(), req.params.id);

      // Get all concepts linked to this source
      const conceptService = new ConceptService();
      const concepts = await conceptService.getConceptsBySource(
        req.user._id.toString(),
        req.params.id
      );

      sendSuccess(
        res,
        {
          source: {
            _id: source._id,
            title: source.title,
            type: source.type,
            processed: source.processed,
            conceptCount: source.conceptCount,
          },
          concepts,
          count: concepts.length,
        },
        'Extracted concepts retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new SourceController();
