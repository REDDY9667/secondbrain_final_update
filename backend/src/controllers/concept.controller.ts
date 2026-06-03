import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import conceptService from '../services/concept.service';
import { sendSuccess, AppError } from '../utils/helpers';
import logger from '../utils/logger';

export class ConceptController {
  async createConcept(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const { title, description, notes, tags, difficulty, sourceId } = req.body;

      const concept = await conceptService.createConcept(req.user._id.toString(), {
        title,
        description,
        notes,
        tags,
        difficulty,
        sourceId,
      });

      logger.info(`Concept created: ${concept._id} by user: ${req.user._id.toString()}`);

      sendSuccess(res, { concept }, 'Concept created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getConcepts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const {
        page,
        limit,
        tags,
        difficulty,
        minConfidence,
        maxConfidence,
        search,
        sortBy,
        sortOrder,
        sourceId,
      } = req.query;

      const filters = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        tags: tags ? (tags as string).split(',') : undefined,
        difficulty: difficulty as string,
        minConfidence: minConfidence ? parseInt(minConfidence as string) : undefined,
        maxConfidence: maxConfidence ? parseInt(maxConfidence as string) : undefined,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        sourceId: sourceId as string,
      };

      const result = await conceptService.getConcepts(req.user._id.toString(), filters);

      sendSuccess(res, result, 'Concepts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getConceptById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const concept = await conceptService.getConceptById(req.user._id.toString(), req.params.id);

      sendSuccess(res, { concept }, 'Concept retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateConcept(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const concept = await conceptService.updateConcept(
        req.user._id.toString(),
        req.params.id,
        req.body
      );

      logger.info(`Concept updated: ${concept._id} by user: ${req.user._id.toString()}`);

      sendSuccess(res, { concept }, 'Concept updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteConcept(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      await conceptService.deleteConcept(req.user._id.toString(), req.params.id);

      logger.info(`Concept deleted: ${req.params.id} by user: ${req.user._id.toString()}`);

      sendSuccess(res, null, 'Concept deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getConceptStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const stats = await conceptService.getConceptStats(req.user._id.toString());

      sendSuccess(res, { stats }, 'Concept stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAllTags(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const tags = await conceptService.getAllTags(req.user._id.toString());

      sendSuccess(res, { tags }, 'Tags retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getLowConfidenceConcepts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const threshold = req.query.threshold
        ? parseInt(req.query.threshold as string)
        : 40;

      const concepts = await conceptService.getLowConfidenceConcepts(
        req.user._id.toString(),
        threshold
      );

      sendSuccess(
        res,
        { concepts, count: concepts.length },
        'Low confidence concepts retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async getDueConcepts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const concepts = await conceptService.getDueConcepts(req.user._id.toString());

      sendSuccess(
        res,
        { concepts, count: concepts.length },
        'Due concepts retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async recordReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const { id } = req.params;
      const { performance } = req.body;

      if (!['perfect', 'good', 'struggled', 'failed'].includes(performance)) {
        throw new AppError(400, 'Invalid performance value. Must be: perfect, good, struggled, or failed');
      }

      const concept = await conceptService.recordReview(
        id,
        req.user._id.toString(),
        performance as 'perfect' | 'good' | 'struggled' | 'failed'
      );

      logger.info(`Review recorded for concept: ${id} with performance: ${performance}`);

      sendSuccess(res, { concept }, 'Review recorded successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new ConceptController();
