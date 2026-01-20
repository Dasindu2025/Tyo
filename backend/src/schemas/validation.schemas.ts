import { z } from 'zod';

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================
// COMPANY SCHEMAS
// ============================================

export const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  admin: z.object({
    name: z.string().min(2, 'Admin name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// EMPLOYEE SCHEMAS
// ============================================

export const createEmployeeSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
});

export const updateEmployeeSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateEmployeeProfileSchema = z.object({
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
});

// ============================================
// PROJECT SCHEMAS
// ============================================

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// WORKPLACE SCHEMAS
// ============================================

export const createWorkplaceSchema = z.object({
  name: z.string().min(2, 'Workplace name must be at least 2 characters'),
  location: z.string().optional(),
});

export const updateWorkplaceSchema = z.object({
  name: z.string().min(2).optional(),
  location: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// WORKING HOURS SCHEMAS
// ============================================

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

export const updateWorkingHoursSchema = z.object({
  dayStartTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm:ss)'),
  dayEndTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm:ss)'),
  eveningStartTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm:ss)'),
  eveningEndTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm:ss)'),
  nightStartTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm:ss)'),
  nightEndTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm:ss)'),
});

// ============================================
// TIME ENTRY SCHEMAS
// ============================================

export const createTimeEntrySchema = z
  .object({
    projectId: z.string().uuid('Invalid project ID'),
    workplaceId: z.string().uuid('Invalid workplace ID'),
    timeIn: z.string().datetime('Invalid datetime format'),
    timeOut: z.string().datetime('Invalid datetime format'),
    notes: z.string().max(500).optional(),
    isFullDay: z.boolean().optional(),
  })
  .refine((data) => new Date(data.timeOut) > new Date(data.timeIn), {
    message: 'Time out must be after time in',
    path: ['timeOut'],
  })
  .refine((data) => new Date(data.timeIn) <= new Date(), {
    message: 'Cannot create entries for future dates',
    path: ['timeIn'],
  });

export const updateTimeEntrySchema = z
  .object({
    projectId: z.string().uuid().optional(),
    workplaceId: z.string().uuid().optional(),
    timeIn: z.string().datetime().optional(),
    timeOut: z.string().datetime().optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.timeIn && data.timeOut) {
        return new Date(data.timeOut) > new Date(data.timeIn);
      }
      return true;
    },
    {
      message: 'Time out must be after time in',
      path: ['timeOut'],
    }
  );

export const approveTimeEntrySchema = z.object({
  approve: z.boolean(),
});

// ============================================
// REPORT SCHEMAS
// ============================================

export const generateReportSchema = z.object({
  reportType: z.enum(['employee', 'project', 'workplace', 'detailed']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  employeeIds: z.array(z.string().uuid()).optional(),
  projectIds: z.array(z.string().uuid()).optional(),
  workplaceIds: z.array(z.string().uuid()).optional(),
  format: z.enum(['json', 'csv', 'excel']).default('json'),
});

// ============================================
// QUERY SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  search: z.string().optional(),
});
