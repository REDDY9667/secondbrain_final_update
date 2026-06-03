import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/helpers';

const conceptSchemas = {
  create: Joi.object({
    title: Joi.string().min(2).max(200).required().messages({
      'string.min': 'Title must be at least 2 characters',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required',
    }),
    description: Joi.string().min(10).max(2000).required().messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 2000 characters',
      'any.required': 'Description is required',
    }),
    notes: Joi.string().max(5000).optional().allow('').messages({
      'string.max': 'Notes cannot exceed 5000 characters',
    }),
    tags: Joi.array().items(Joi.string().trim()).max(20).optional().messages({
      'array.max': 'Cannot have more than 20 tags',
    }),
    difficulty: Joi.string()
      .valid('beginner', 'intermediate', 'advanced')
      .default('beginner')
      .messages({
        'any.only': 'Difficulty must be beginner, intermediate, or advanced',
      }),
    sourceId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid source ID format',
      }),
  }),

  update: Joi.object({
    title: Joi.string().min(2).max(200).optional().messages({
      'string.min': 'Title must be at least 2 characters',
      'string.max': 'Title cannot exceed 200 characters',
    }),
    description: Joi.string().min(10).max(2000).optional().messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 2000 characters',
    }),
    notes: Joi.string().max(5000).optional().allow('').messages({
      'string.max': 'Notes cannot exceed 5000 characters',
    }),
    tags: Joi.array().items(Joi.string().trim()).max(20).optional().messages({
      'array.max': 'Cannot have more than 20 tags',
    }),
    difficulty: Joi.string()
      .valid('beginner', 'intermediate', 'advanced')
      .optional()
      .messages({
        'any.only': 'Difficulty must be beginner, intermediate, or advanced',
      }),
    confidenceScore: Joi.number().min(0).max(100).optional().messages({
      'number.min': 'Confidence score must be at least 0',
      'number.max': 'Confidence score cannot exceed 100',
    }),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
  }),

  query: Joi.object({
    page: Joi.number().min(1).optional().messages({
      'number.min': 'Page must be at least 1',
    }),
    limit: Joi.number().min(1).max(100).optional().messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
    tags: Joi.string().optional(),
    difficulty: Joi.string()
      .valid('beginner', 'intermediate', 'advanced')
      .optional()
      .messages({
        'any.only': 'Difficulty must be beginner, intermediate, or advanced',
      }),
    minConfidence: Joi.number().min(0).max(100).optional().messages({
      'number.min': 'Minimum confidence must be at least 0',
      'number.max': 'Minimum confidence cannot exceed 100',
    }),
    maxConfidence: Joi.number().min(0).max(100).optional().messages({
      'number.min': 'Maximum confidence must be at least 0',
      'number.max': 'Maximum confidence cannot exceed 100',
    }),
    search: Joi.string().max(100).optional().messages({
      'string.max': 'Search query cannot exceed 100 characters',
    }),
    sortBy: Joi.string()
      .valid('createdAt', 'updatedAt', 'title', 'confidenceScore', 'nextReview')
      .optional()
      .messages({
        'any.only':
          'Sort by must be one of: createdAt, updatedAt, title, confidenceScore, nextReview',
      }),
    sortOrder: Joi.string().valid('asc', 'desc').optional().messages({
      'any.only': 'Sort order must be asc or desc',
    }),
    threshold: Joi.number().min(0).max(100).optional().messages({
      'number.min': 'Threshold must be at least 0',
      'number.max': 'Threshold cannot exceed 100',
    }),
  }),

  id: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid concept ID format',
        'any.required': 'Concept ID is required',
      }),
  }),
};

export const validateCreateConcept = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = conceptSchemas.create.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return next(new AppError(400, errors.join(', ')));
  }

  next();
};

export const validateUpdateConcept = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = conceptSchemas.update.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return next(new AppError(400, errors.join(', ')));
  }

  next();
};

export const validateConceptQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = conceptSchemas.query.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return next(new AppError(400, errors.join(', ')));
  }

  next();
};

export const validateConceptId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = conceptSchemas.id.validate(req.params, {
    abortEarly: false,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return next(new AppError(400, errors.join(', ')));
  }

  next();
};
