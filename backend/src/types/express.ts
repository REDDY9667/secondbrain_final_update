import { Request } from 'express';
import { IUserDocument } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUserDocument;
}