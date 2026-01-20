import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { loginSchema, refreshTokenSchema } from '../schemas/validation.schemas';
import { verifyPassword, generateAccessToken, generateRefreshToken, verifyRefreshToken, hashRefreshToken } from '../utils/auth.utils';
import { createError } from '../utils/app-error';

const router = Router();
const prisma = new PrismaClient();

// Helper function to create session
async function createSession(userId: string, userType: string, req: Request) {
  const refreshToken = generateRefreshToken(userId, userType);
  const refreshTokenHash = await hashRefreshToken(refreshToken);

  await prisma.session.create({
    data: {
      userId,
      userType,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  return refreshToken;
}

/**
 * POST /api/auth/super-admin/login
 */
router.post('/super-admin/login', async (req: Request, res: Response, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const superAdmin = await prisma.superAdmin.findUnique({ where: { email } });
    if (!superAdmin) {
      throw createError.unauthorized('Invalid credentials');
    }

    const isValid = await verifyPassword(password, superAdmin.passwordHash);
    if (!isValid) {
      throw createError.unauthorized('Invalid credentials');
    }

    const accessToken = generateAccessToken({
      userId: superAdmin.id,
      role: 'super_admin',
    });

    const refreshToken = await createSession(superAdmin.id, 'super_admin', req);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: 'super_admin',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/admin/login
 */
router.post('/admin/login', async (req: Request, res: Response, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const admin = await prisma.companyAdmin.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!admin || admin.deletedAt) {
      throw createError.unauthorized('Invalid credentials');
    }

    if (!admin.isActive || !admin.company.isActive) {
      throw createError.forbidden('Account is inactive');
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      throw createError.unauthorized('Invalid credentials');
    }

    const accessToken = generateAccessToken({
      userId: admin.id,
      role: 'admin',
      companyId: admin.companyId,
    });

    const refreshToken = await createSession(admin.id, 'admin', req);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          companyId: admin.companyId,
          role: 'admin',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/employee/login
 */
router.post('/employee/login', async (req: Request, res: Response, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const employee = await prisma.employee.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!employee || employee.deletedAt) {
      throw createError.unauthorized('Invalid credentials');
    }

    if (!employee.isActive || !employee.company.isActive) {
      throw createError.forbidden('Account is inactive');
    }

    const isValid = await verifyPassword(password, employee.passwordHash);
    if (!isValid) {
      throw createError.unauthorized('Invalid credentials');
    }

    const accessToken = generateAccessToken({
      userId: employee.id,
      role: 'employee',
      companyId: employee.companyId,
    });

    const refreshToken = await createSession(employee.id, 'employee', req);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: employee.id,
          email: employee.email,
          name: `${employee.firstName} ${employee.lastName}`,
          employeeCode: employee.employeeCode,
          companyId: employee.companyId,
          role: 'employee',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response, next) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    const payload = verifyRefreshToken(refreshToken);
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    const session = await prisma.session.findFirst({
      where: {
        userId: payload.userId,
        userType: payload.role,
        refreshTokenHash,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw createError.unauthorized('Invalid or expired refresh token');
    }

    // Generate new tokens
    let companyId: string | undefined;
    if (payload.role !== 'super_admin') {
      const user = payload.role === 'admin'
        ? await prisma.companyAdmin.findUnique({ where: { id: payload.userId } })
        : await prisma.employee.findUnique({ where: { id: payload.userId } });

      companyId = user?.companyId;
    }

    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      role: payload.role as any,
      companyId,
    });

    const newRefreshToken = generateRefreshToken(payload.userId, payload.role);
    const newRefreshTokenHash = await hashRefreshToken(newRefreshToken);

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw createError.unauthorized('No token provided');
    }

    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    await prisma.session.deleteMany({
      where: { refreshTokenHash },
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
