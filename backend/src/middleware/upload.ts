import multer from 'multer';
import path from 'path';
import { AppError } from '../utils/helpers';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/json',
    'text/html',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, `File type ${file.mimetype} is not supported`) as any, false);
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Error handler for multer
export const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(400, 'File size cannot exceed 10MB'));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError(400, 'Unexpected file field'));
    }
    return next(new AppError(400, `Upload error: ${err.message}`));
  }
  next(err);
};
