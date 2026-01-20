import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  createProjectSchema,
  updateProjectSchema,
  createWorkplaceSchema,
  updateWorkplaceSchema,
  updateWorkingHoursSchema,
  approveTimeEntrySchema,
  generateReportSchema,
  paginationSchema,
} from '../schemas/validation.schemas';
import { hashPassword } from '../utils/auth.utils';
import {
  generateEmployeeCode,
  generateProjectCode,
  generateWorkplaceCode,
} from '../services/code-generation.service';
import { createError } from '../utils/app-error';
import { authenticate, requireRole, requireCompany } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole('admin'));
router.use(requireCompany);

// ============================================
// EMPLOYEE MANAGEMENT
// ============================================

router.get('/employees', async (req: Request, res: Response, next) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      companyId: req.user!.companyId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          hireDate: true,
          isActive: true,
          createdAt: true,
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({
      success: true,
      data: employees,
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

router.post('/employees', async (req: Request, res: Response, next) => {
  try {
    const data = createEmployeeSchema.parse(req.body);

    const employeeCode = await generateEmployeeCode(req.user!.companyId!);
    const passwordHash = await hashPassword(data.password);

    const employee = await prisma.employee.create({
      data: {
        companyId: req.user!.companyId!,
        employeeCode,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        hireDate: new Date(data.hireDate),
        createdById: req.user!.userId,
      },
    });

    res.status(201).json({
      success: true,
      data: employee,
      message: 'Employee created successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/employees/:id', async (req: Request, res: Response, next) => {
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            timeEntries: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!employee) {
      throw createError.notFound('Employee not found');
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
});

router.patch('/employees/:id', async (req: Request, res: Response, next) => {
  try {
    const data = updateEmployeeSchema.parse(req.body);

    const employee = await prisma.employee.updateMany({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
        deletedAt: null,
      },
      data,
    });

    if (employee.count === 0) {
      throw createError.notFound('Employee not found');
    }

    res.json({ success: true, message: 'Employee updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/employees/:id', async (req: Request, res: Response, next) => {
  try {
    const result = await prisma.employee.updateMany({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      throw createError.notFound('Employee not found');
    }

    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// PROJECT MANAGEMENT
// ============================================

router.get('/projects', async (req: Request, res: Response, next) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      companyId: req.user!.companyId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { projectCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      success: true,
      data: projects,
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

router.post('/projects', async (req: Request, res: Response, next) => {
  try {
    const data = createProjectSchema.parse(req.body);

    const projectCode = await generateProjectCode(req.user!.companyId!);

    const project = await prisma.project.create({
      data: {
        companyId: req.user!.companyId!,
        projectCode,
        name: data.name,
        description: data.description,
        createdById: req.user!.userId,
      },
    });

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/projects/:id', async (req: Request, res: Response, next) => {
  try {
    const data = updateProjectSchema.parse(req.body);

    const result = await prisma.project.updateMany({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
        deletedAt: null,
      },
      data,
    });

    if (result.count === 0) {
      throw createError.notFound('Project not found');
    }

    res.json({ success: true, message: 'Project updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/projects/:id', async (req: Request, res: Response, next) => {
  try {
    const result = await prisma.project.updateMany({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      throw createError.notFound('Project not found');
    }

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// WORKPLACE MANAGEMENT
// ============================================

router.get('/workplaces', async (req: Request, res: Response, next) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      companyId: req.user!.companyId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { workplaceCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [workplaces, total] = await Promise.all([
      prisma.workplace.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.workplace.count({ where }),
    ]);

    res.json({
      success: true,
      data: workplaces,
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

router.post('/workplaces', async (req: Request, res: Response, next) => {
  try {
    const data = createWorkplaceSchema.parse(req.body);

    const workplaceCode = await generateWorkplaceCode(req.user!.companyId!);

    const workplace = await prisma.workplace.create({
      data: {
        companyId: req.user!.companyId!,
        workplaceCode,
        name: data.name,
        location: data.location,
        createdById: req.user!.userId,
      },
    });

    res.status(201).json({
      success: true,
      data: workplace,
      message: 'Workplace created successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/workplaces/:id', async (req: Request, res: Response, next) => {
  try {
    const data = updateWorkplaceSchema.parse(req.body);

    const result = await prisma.workplace.updateMany({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
        deletedAt: null,
      },
      data,
    });

    if (result.count === 0) {
      throw createError.notFound('Workplace not found');
    }

    res.json({ success: true, message: 'Workplace updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/workplaces/:id', async (req: Request, res: Response, next) => {
  try {
    const result = await prisma.workplace.updateMany({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      throw createError.notFound('Workplace not found');
    }

    res.json({ success: true, message: 'Workplace deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// WORKING HOURS CONFIGURATION
// ============================================

router.get('/working-hours', async (req: Request, res: Response, next) => {
  try {
    const config = await prisma.workingHourType.findUnique({
      where: { companyId: req.user!.companyId! },
    });

    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

router.put('/working-hours', async (req: Request, res: Response, next) => {
  try {
    const data = updateWorkingHoursSchema.parse(req.body);

    const config = await prisma.workingHourType.upsert({
      where: { companyId: req.user!.companyId! },
      update: data,
      create: {
        companyId: req.user!.companyId!,
        ...data,
      },
    });

    res.json({
      success: true,
      data: config,
      message: 'Working hours updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// TIME ENTRY APPROVALS
// ============================================

router.get('/time-entries', async (req: Request, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      companyId: req.user!.companyId,
      deletedAt: null,
    };

    const [entries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        include: {
          employee: {
            select: {
              employeeCode: true,
              firstName: true,
              lastName: true,
            },
          },
          project: {
            select: {
              projectCode: true,
              name: true,
            },
          },
          workplace: {
            select: {
              workplaceCode: true,
              name: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.timeEntry.count({ where }),
    ]);

    res.json({
      success: true,
      data: entries,
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

router.patch('/time-entries/:id/approve', async (req: Request, res: Response, next) => {
  try {
    const { approve } = approveTimeEntrySchema.parse(req.body);

    const entry = await prisma.timeEntry.updateMany({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
        deletedAt: null,
      },
      data: {
        isApproved: approve,
        approvedById: req.user!.userId,
        approvedAt: new Date(),
      },
    });

    if (entry.count === 0) {
      throw createError.notFound('Time entry not found');
    }

    // Create audit log
    await prisma.timeEntryAuditLog.create({
      data: {
        timeEntryId: req.params.id,
        action: approve ? 'approved' : 'rejected',
        changedById: req.user!.userId,
        changedByType: 'admin',
        newValues: { isApproved: approve },
      },
    });

    res.json({
      success: true,
      message: `Time entry ${approve ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/time-entries/:id/audit-log', async (req: Request, res: Response, next) => {
  try {
    const logs = await prisma.timeEntryAuditLog.findMany({
      where: { timeEntryId: req.params.id },
      orderBy: { timestamp: 'desc' },
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

// ============================================
// REPORTS (Simplified - just JSON for now)
// ============================================

router.post('/reports/generate', async (req: Request, res: Response, next) => {
  try {
    const { reportType, startDate, endDate, employeeIds, projectIds, workplaceIds } =
      generateReportSchema.parse(req.body);

    const where: any = {
      companyId: req.user!.companyId,
      deletedAt: null,
      entryDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (employeeIds?.length) where.employeeId = { in: employeeIds };
    if (projectIds?.length) where.projectId = { in: projectIds };
    if (workplaceIds?.length) where.workplaceId = { in: workplaceIds };

    if (reportType === 'employee') {
      const data = await prisma.timeEntry.groupBy({
        by: ['employeeId'],
        where,
        _sum: {
          totalHours: true,
          dayHours: true,
          eveningHours: true,
          nightHours: true,
        },
      });

      res.json({ success: true, data, reportType });
    } else if (reportType === 'project') {
      const data = await prisma.timeEntry.groupBy({
        by: ['projectId'],
        where,
        _sum: {
          totalHours: true,
          dayHours: true,
          eveningHours: true,
          nightHours: true,
        },
      });

      res.json({ success: true, data, reportType });
    } else {
      const data = await prisma.timeEntry.findMany({
        where,
        include: {
          employee: true,
          project: true,
          workplace: true,
        },
      });

      res.json({ success: true, data, reportType });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
