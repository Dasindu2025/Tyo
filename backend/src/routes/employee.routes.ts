import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createTimeEntrySchema,
  updateTimeEntrySchema,
  updateEmployeeProfileSchema,
} from '../schemas/validation.schemas';
import { hashPassword } from '../utils/auth.utils';
import { splitTimeEntry, needsSplitting } from '../services/time-splitting.service';
import { detectOverlap } from '../services/overlap-detection.service';
import { createError } from '../utils/app-error';
import { authenticate, requireRole, requireCompany } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// All routes require employee authentication
router.use(authenticate);
router.use(requireRole('employee'));
router.use(requireCompany);

// ============================================
// PROFILE
// ============================================

router.get('/profile', async (req: Request, res: Response, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        hireDate: true,
        createdAt: true,
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

router.patch('/profile', async (req: Request, res: Response, next) => {
  try {
    const data = updateEmployeeProfileSchema.parse(req.body);

    const updateData: any = {};
    if (data.phone) updateData.phone = data.phone;
    if (data.password) updateData.passwordHash = await hashPassword(data.password);

    await prisma.employee.update({
      where: { id: req.user!.userId },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// TIME ENTRIES
// ============================================

router.get('/time-entries', async (req: Request, res: Response, next) => {
  try {
    const { startDate, endDate, projectId, workplaceId } = req.query;

    const where: any = {
      employeeId: req.user!.userId,
      companyId: req.user!.companyId,
      deletedAt: null,
    };

    if (startDate && endDate) {
      where.entryDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (projectId) where.projectId = projectId;
    if (workplaceId) where.workplaceId = workplaceId;

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
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
      orderBy: [{ entryDate: 'desc' }, { timeIn: 'desc' }],
    });

    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
});

router.post('/time-entries', async (req: Request, res: Response, next) => {
  try {
    const data = createTimeEntrySchema.parse(req.body);

    const timeIn = new Date(data.timeIn);
    const timeOut = new Date(data.timeOut);

    // Check for overlaps
    const hasOverlap = await detectOverlap(
      req.user!.userId,
      timeIn,
      timeOut,
      req.user!.companyId!
    );

    if (hasOverlap) {
      throw createError.conflict('Time entry overlaps with existing entry');
    }

    // Split if crosses midnight
    if (needsSplitting(timeIn, timeOut)) {
      const splitEntries = await splitTimeEntry(
        {
          employeeId: req.user!.userId,
          projectId: data.projectId,
          workplaceId: data.workplaceId,
          timeIn,
          timeOut,
          notes: data.notes,
          isFullDay: data.isFullDay,
        },
        req.user!.companyId!
      );

      // Create multiple entries
      const createdEntries = await Promise.all(
        splitEntries.map((entry) =>
          prisma.timeEntry.create({
            data: {
              companyId: req.user!.companyId!,
              employeeId: req.user!.userId,
              projectId: data.projectId,
              workplaceId: data.workplaceId,
              entryDate: new Date(entry.entryDate),
              timeIn: entry.timeIn,
              timeOut: entry.timeOut,
              totalHours: entry.totalHours,
              dayHours: entry.dayHours,
              eveningHours: entry.eveningHours,
              nightHours: entry.nightHours,
              notes: data.notes,
              isFullDay: data.isFullDay || false,
            },
          })
        )
      );

      res.status(201).json({
        success: true,
        data: createdEntries,
        message: `Time entry split into ${createdEntries.length} entries across days`,
      });
    } else {
      // Single entry
      const [splitEntry] = await splitTimeEntry(
        {
          employeeId: req.user!.userId,
          projectId: data.projectId,
          workplaceId: data.workplaceId,
          timeIn,
          timeOut,
          notes: data.notes,
          isFullDay: data.isFullDay,
        },
        req.user!.companyId!
      );

      const entry = await prisma.timeEntry.create({
        data: {
          companyId: req.user!.companyId!,
          employeeId: req.user!.userId,
          projectId: data.projectId,
          workplaceId: data.workplaceId,
          entryDate: new Date(splitEntry.entryDate),
          timeIn: splitEntry.timeIn,
          timeOut: splitEntry.timeOut,
          totalHours: splitEntry.totalHours,
          dayHours: splitEntry.dayHours,
          eveningHours: splitEntry.eveningHours,
          nightHours: splitEntry.nightHours,
          notes: data.notes,
          isFullDay: data.isFullDay || false,
        },
      });

      // Create audit log
      await prisma.timeEntryAuditLog.create({
        data: {
          timeEntryId: entry.id,
          action: 'created',
          changedById: req.user!.userId,
          changedByType: 'employee',
          newValues: entry,
        },
      });

      res.status(201).json({
        success: true,
        data: entry,
        message: 'Time entry created successfully',
      });
    }
  } catch (error) {
    next(error);
  }
});

router.patch('/time-entries/:id', async (req: Request, res: Response, next) => {
  try {
    const data = updateTimeEntrySchema.parse(req.body);

    // Check if entry exists and is not approved
    const existing = await prisma.timeEntry.findFirst({
      where: {
        id: req.params.id,
        employeeId: req.user!.userId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw createError.notFound('Time entry not found');
    }

    if (existing.isApproved === true) {
      throw createError.forbidden('Cannot edit approved time entry');
    }

    // Store old values for audit log
    const oldValues = { ...existing };

    await prisma.timeEntry.update({
      where: { id: req.params.id },
      data,
    });

    // Create audit log
    await prisma.timeEntryAuditLog.create({
      data: {
        timeEntryId: req.params.id,
        action: 'updated',
        changedById: req.user!.userId,
        changedByType: 'employee',
        oldValues: oldValues as any,
        newValues: data,
      },
    });

    res.json({
      success: true,
      message: 'Time entry updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/time-entries/:id', async (req: Request, res: Response, next) => {
  try {
    // Check if entry exists and is not approved
    const existing = await prisma.timeEntry.findFirst({
      where: {
        id: req.params.id,
        employeeId: req.user!.userId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw createError.notFound('Time entry not found');
    }

    if (existing.isApproved === true) {
      throw createError.forbidden('Cannot delete approved time entry');
    }

    await prisma.timeEntry.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    // Create audit log
    await prisma.timeEntryAuditLog.create({
      data: {
        timeEntryId: req.params.id,
        action: 'deleted',
        changedById: req.user!.userId,
        changedByType: 'employee',
        oldValues: existing as any,
      },
    });

    res.json({
      success: true,
      message: 'Time entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// CALENDAR DATA
// ============================================

router.get('/calendar/:year/:month', async (req: Request, res: Response, next) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month); // 1-12

    // Get first and last day of month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const entries = await prisma.timeEntry.findMany({
      where: {
        employeeId: req.user!.userId,
        companyId: req.user!.companyId,
        deletedAt: null,
        entryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        workplace: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { entryDate: 'asc' },
    });

    // Group by date
    const groupedByDate: Record<string, any> = {};

    entries.forEach((entry) => {
      const dateKey = entry.entryDate.toISOString().split('T')[0];

      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          date: dateKey,
          totalHours: 0,
          entryCount: 0,
          entries: [],
        };
      }

      groupedByDate[dateKey].totalHours += Number(entry.totalHours);
      groupedByDate[dateKey].entryCount++;
      groupedByDate[dateKey].entries.push({
        id: entry.id,
        projectName: entry.project.name,
        workplaceName: entry.workplace.name,
        timeIn: entry.timeIn,
        timeOut: entry.timeOut,
        hours: Number(entry.totalHours),
        isApproved: entry.isApproved,
      });
    });

    const days = Object.values(groupedByDate);

    res.json({ success: true, data: { days } });
  } catch (error) {
    next(error);
  }
});

// ============================================
// RESOURCES (Projects & Workplaces)
// ============================================

router.get('/projects', async (req: Request, res: Response, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        companyId: req.user!.companyId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        projectCode: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
});

router.get('/workplaces', async (req: Request, res: Response, next) => {
  try {
    const workplaces = await prisma.workplace.findMany({
      where: {
        companyId: req.user!.companyId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        workplaceCode: true,
        name: true,
        location: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: workplaces });
  } catch (error) {
    next(error);
  }
});

export default router;
