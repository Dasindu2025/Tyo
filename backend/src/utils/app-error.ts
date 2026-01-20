export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = {
  badRequest: (message: string) => new AppError(400, message),
  unauthorized: (message: string = 'Unauthorized') => new AppError(401, message),
  forbidden: (message: string = 'Forbidden') => new AppError(403, message),
  notFound: (message: string = 'Resource not found') => new AppError(404, message),
  conflict: (message: string) => new AppError(409, message),
  internal: (message: string = 'Internal server error') => new AppError(500, message, false),
};
