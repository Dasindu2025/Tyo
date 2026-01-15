import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const TimeEntrySchema = z.object({
  projectId: z.string().uuid(),
  date: z.string(), // ISO string
  startTime: z.string(), // ISO string or simple time string
  endTime: z.string(), // ISO string or simple time string
  description: z.string().optional(),
});

export const CompanySchema = z.object({
  name: z.string().min(2),
  timezone: z.string(),
  backdateLimitDays: z.number().min(0).max(365),
});
