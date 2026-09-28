import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

/**
 * Global Error Handling Middleware for Express.
 * Express recognizes this as an error handler because it has exactly 4 parameters (err, req, res, next).
 */
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Always log the full error stack server-side for debugging.
  console.error('🔥 Error Caught by Global Handler:', err.stack || err.message);

  // 1. Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((issue) => issue.message),
    });
  }

  // 2. Handle Custom Business Logic Errors (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // 3. Handle Multer Upload Errors (file size limit, too many files, etc.)
  if (err instanceof multer.MulterError) {
    const multerMessages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'File too large. Maximum file size is 5MB.',
      LIMIT_FILE_COUNT: 'Too many files. Maximum is 5 evidence files.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field or more than the allowed number of files.',
      LIMIT_PART_COUNT: 'Request contains too many parts.',
      LIMIT_FIELD_KEY: 'Form field name is too long.',
      LIMIT_FIELD_VALUE: 'Form field value is too long.',
      LIMIT_FIELD_COUNT: 'Request contains too many form fields.',
      MISSING_FIELD_NAME: 'A form field is missing its name.',
      LIMIT_FIELD_NESTING: 'Form field nesting is too deep.',
    };

    return res.status(400).json({
      success: false,
      message: multerMessages[err.code] || 'File upload failed. Please try again.',
    });
  }

  // 4. Handle Unexpected Server Errors (Fallback)
  // Never expose the raw error or stack trace to the client, regardless of environment.
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error. Please try again later.',
  });
};
