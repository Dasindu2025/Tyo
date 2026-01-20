import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: getErrorCode(err.statusCode),
        message: err.message,
      },
    };

    res.status(err.statusCode).json(response);
  } else {
    // Log unexpected errors
    console.error('Unexpected error:', err);

    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : err.message,
      },
    };

    res.status(500).json(response);
  }
}

/**
 * Get error code based on status code
 */
function getErrorCode(statusCode: number): string {
  const codes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    500: 'INTERNAL_ERROR',
  };

  return codes[statusCode] || 'UNKNOWN_ERROR';
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
