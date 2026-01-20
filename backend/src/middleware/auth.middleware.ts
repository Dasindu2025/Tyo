import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth.utils';
import { AppError, createError } from '../utils/app-error';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: 'super_admin' | 'admin' | 'employee';
        companyId?: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      role: payload.role,
      companyId: payload.companyId,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(createError.unauthorized('Invalid or expired token'));
    }
  }
}

/**
 * Middleware to require specific role(s)
 */
export function requireRole(...allowedRoles: Array<'super_admin' | 'admin' | 'employee'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError.unauthorized('Not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(createError.forbidden('Insufficient permissions'));
    }

    next();
  };
}

/**
 * Middleware to ensure user has company association
 */
export function requireCompany(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.companyId) {
    return next(createError.forbidden('No company association'));
  }

  next();
}

/**
 * Middleware to validate company context matches route parameter
 */
export function validateCompanyContext(req: Request, res: Response, next: NextFunction): void {
  const routeCompanyId = req.params.companyId;

  if (req.user?.role !== 'super_admin' && req.user?.companyId !== routeCompanyId) {
    return next(createError.forbidden('Access denied to this company'));
  }

  next();
}
