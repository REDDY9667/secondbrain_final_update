import { Response } from 'express';
import { ApiResponse } from '../types';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode = 500
): Response => {
  const response: ApiResponse = {
    success: false,
    error,
  };

  return res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
