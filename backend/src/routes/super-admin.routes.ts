import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createCompanySchema, updateCompanySchema, paginationSchema } from '../schemas/validation.schemas';
import { hashPassword } from '../utils/auth.utils';
import { generateCompanyCode } from '../services/code-generation.service';
import { createError } from '../utils/app-error';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// All routes require super admin authentication
router.use(authenticate);
router.use(requireRole('super_admin'));

/**
 * GET /api/super-admin/companies
 */
router.get('/companies', async (req: Request, res: Response, next) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          _count: {
            select: {
              employees: { where: { deletedAt: null } },
              admins: { where: { deletedAt: null } },
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.company.count({ where }),
    ]);

    res.json({
      success: true,
      data: companies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/super-admin/companies
 */
router.post('/companies', async (req: Request, res: Response, next) => {
  try {
    const data = createCompanySchema.parse(req.body);

    // Generate company code
    const companyCode = await generateCompanyCode();

    // Hash admin password
    const adminPasswordHash = await hashPassword(data.admin.password);

    // Create company with first admin
    const company = await prisma.company.create({
      data: {
        companyCode,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        createdById: req.user!.userId,
        admins: {
          create: {
            name: data.admin.name,
            email: data.admin.email,
            passwordHash: adminPasswordHash,
          },
        },
        workingHourTypes: {
          create: {
            dayStartTime: '06:00:00',
            dayEndTime: '18:00:00',
            eveningStartTime: '18:00:00',
            eveningEndTime: '22:00:00',
            nightStartTime: '22:00:00',
            nightEndTime: '06:00:00',
          },
        },
      },
      include: {
        admins: true,
      },
    });

    res.status(201).json({
      success: true,
      data: company,
      message: 'Company created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/super-admin/companies/:id
 */
router.get('/companies/:id', async (req: Request, res: Response, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        admins: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            employees: { where: { deletedAt: null } },
            projects: { where: { deletedAt: null } },
            workplaces: { where: { deletedAt: null } },
            timeEntries: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!company || company.deletedAt) {
      throw createError.notFound('Company not found');
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/super-admin/companies/:id
 */
router.patch('/companies/:id', async (req: Request, res: Response, next) => {
  try {
    const data = updateCompanySchema.parse(req.body);

    const company = await prisma.company.update({
      where: { id: req.params.id },
      data,
    });

    res.json({
      success: true,
      data: company,
      message: 'Company updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/super-admin/companies/:id
 */
router.delete('/companies/:id', async (req: Request, res: Response, next) => {
  try {
    await prisma.company.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    res.json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
