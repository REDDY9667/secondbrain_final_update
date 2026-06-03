import { Request } from 'express';
import { IUserDocument } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUserDocument;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
