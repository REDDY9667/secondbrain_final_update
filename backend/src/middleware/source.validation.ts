import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/helpers';

const sourceSchemas = {
  create: Joi.object({
    title: Joi.string().min(2).max(300).required().messages({
      'string.min': 'Title must be at least 2 characters',
      'string.max': 'Title cannot exceed 300 characters',
      'any.required': 'Title is required',
    }),
    type: Joi.string()
      .valid('pdf', 'article', 'video', 'note', 'code', 'other')
      .required()
      .messages({
        'any.only': 'Type must be one of: pdf, article, video, note, code, other',
        'any.required': 'Type is required',
      }),
    url: Joi.string().uri().max(2000).optional().allow('').messages({
      'string.uri': 'Invalid URL format',
      'string.max': 'URL cannot exceed 2000 characters',
    }),
    content: Joi.string().max(50000).optional().allow('').messages({
      'string.max': 'Content cannot exceed 50000 characters',
    }),
    tags: Joi.array().items(Joi.string().trim()).max(20).optional().messages({
      'array.max': 'Cannot have more than 20 tags',
    }),
    metadata: Joi.object({
      author: Joi.string().max(200).optional().messages({
        'string.max': 'Author name cannot exceed 200 characters',
      }),
      publishedDate: Joi.date().max('now').optional().messages({
        'date.max': 'Published date cannot be in the future',
      }),
      duration: Joi.number().min(0).max(86400).optional().messages({
        'number.min': 'Duration must be at least 0',
        'number.max': 'Duration cannot exceed 24 hours (86400 seconds)',
      }),
      pageCount: Joi.number().min(1).max(10000).optional().messages({
        'number.min': 'Page count must be at least 1',
        'number.max': 'Page count cannot exceed 10000',
      }),
      wordCount: Joi.number().min(0).max(1000000).optional().messages({
        'number.min': 'Word count must be at least 0',
        'number.max': 'Word count cannot exceed 1000000',
      }),
    }).optional(),
  }),

  update: Joi.object({
    title: Joi.string().min(2).max(300).optional().messages({
      'string.min': 'Title must be at least 2 characters',
      'string.max': 'Title cannot exceed 300 characters',
    }),
    type: Joi.string()
      .valid('pdf', 'article', 'video', 'note', 'code', 'other')
      .optional()
      .messages({
        'any.only': 'Type must be one of: pdf, article, video, note, code, other',
      }),
    url: Joi.string().uri().max(2000).optional().allow('').messages({
      'string.uri': 'Invalid URL format',
      'string.max': 'URL cannot exceed 2000 characters',
    }),
    content: Joi.string().max(50000).optional().allow('').messages({
      'string.max': 'Content cannot exceed 50000 characters',
    }),
    tags: Joi.array().items(Joi.string().trim()).max(20).optional().messages({
      'array.max': 'Cannot have more than 20 tags',
    }),
    metadata: Joi.object({
      author: Joi.string().max(200).optional().messages({
        'string.max': 'Author name cannot exceed 200 characters',
      }),
      publishedDate: Joi.date().max('now').optional().messages({
        'date.max': 'Published date cannot be in the future',
      }),
      duration: Joi.number().min(0).max(86400).optional().messages({
        'number.min': 'Duration must be at least 0',
        'number.max': 'Duration cannot exceed 24 hours (86400 seconds)',
      }),
      pageCount: Joi.number().min(1).max(10000).optional().messages({
        'number.min': 'Page count must be at least 1',
        'number.max': 'Page count cannot exceed 10000',
      }),
      wordCount: Joi.number().min(0).max(1000000).optional().messages({
        'number.min': 'Word count must be at least 0',
        'number.max': 'Word count cannot exceed 1000000',
      }),
    }).optional(),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field must be provided for update',
    }),

  uploadFile: Joi.object({
    title: Joi.string().min(2).max(300).optional().messages({
      'string.min': 'Title must be at least 2 characters',
      'string.max': 'Title cannot exceed 300 characters',
    }),
    type: Joi.string()
      .valid('pdf', 'article', 'video', 'note', 'code', 'other')
      .optional()
      .messages({
        'any.only': 'Type must be one of: pdf, article, video, note, code, other',
      }),
    tags: Joi.string().max(500).optional().messages({
      'string.max': 'Tags string cannot exceed 500 characters',
    }),
  }),

  query: Joi.object({
    page: Joi.number().min(1).optional().messages({
      'number.min': 'Page must be at least 1',
    }),
    limit: Joi.number().min(1).max(100).optional().messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
    type: Joi.string()
      .valid('pdf', 'article', 'video', 'note', 'code', 'other')
      .optional()
      .messages({
        'any.only': 'Type must be one of: pdf, article, video, note, code, other',
      }),
    processed: Joi.string().valid('true', 'false').optional().messages({
      'any.only': 'Processed must be true or false',
    }),
  }),

  id: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid source ID format',
        'any.required': 'Source ID is required',
      }),
  }),
};

export const validateCreateSource = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = sourceSchemas.create.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return next(new AppError(400, errors.join(', ')));
  }

  next();
};

export const validateUpdateSource = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = sourceSchemas.update.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return next(new AppError(400, errors.join(', ')));
  }

  next();
};

export const validateUploadFile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = sourceSchemas.uploadFile.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return next(new AppError(400, errors.join(', ')));
  }

  next();
};

export const validateSourceQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = sourceSchemas.query.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return next(new AppError(400, errors.join(', ')));
  }

  next();
};

export const validateSourceId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = sourceSchemas.id.validate(req.params, {
    abortEarly: false,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return next(new AppError(400, errors.join(', ')));
  }

  next();
};
