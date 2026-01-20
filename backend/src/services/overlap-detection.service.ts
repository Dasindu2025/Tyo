import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Detect if a time entry overlaps with existing entries for an employee
 */
export async function detectOverlap(
  employeeId: string,
  timeIn: Date,
  timeOut: Date,
  companyId: string,
  excludeEntryId?: string
): Promise<boolean> {
  const entryDate = timeIn.toISOString().split('T')[0];

  const overlap = await prisma.timeEntry.findFirst({
    where: {
      employeeId,
      companyId,
      entryDate: new Date(entryDate),
      deletedAt: null,
      id: excludeEntryId ? { not: excludeEntryId } : undefined,
      OR: [
        // New entry starts during existing entry
        {
          timeIn: { lte: timeIn },
          timeOut: { gt: timeIn },
        },
        // New entry ends during existing entry
        {
          timeIn: { lt: timeOut },
          timeOut: { gte: timeOut },
        },
        // New entry completely contains existing entry
        {
          timeIn: { gte: timeIn },
          timeOut: { lte: timeOut },
        },
      ],
    },
  });

  return overlap !== null;
}
