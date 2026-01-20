import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WorkingHourTypes {
  dayStart: number; // Minutes from midnight (e.g., 360 for 06:00)
  dayEnd: number;
  eveningStart: number;
  eveningEnd: number;
  nightStart: number;
  nightEnd: number;
}

/**
 * Convert time string (HH:mm:ss) to minutes from midnight
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Fetch working hour types for a company
 */
async function getWorkingHourTypes(companyId: string): Promise<WorkingHourTypes> {
  const config = await prisma.workingHourType.findUnique({
    where: { companyId },
  });

  if (!config) {
    // Default values if not configured
    return {
      dayStart: 360, // 06:00
      dayEnd: 1080, // 18:00
      eveningStart: 1080, // 18:00
      eveningEnd: 1320, // 22:00
      nightStart: 1320, // 22:00
      nightEnd: 360, // 06:00 (next day)
    };
  }

  return {
    dayStart: timeToMinutes(config.dayStartTime),
    dayEnd: timeToMinutes(config.dayEndTime),
    eveningStart: timeToMinutes(config.eveningStartTime),
    eveningEnd: timeToMinutes(config.eveningEndTime),
    nightStart: timeToMinutes(config.nightStartTime),
    nightEnd: timeToMinutes(config.nightEndTime),
  };
}

/**
 * Check if a time (in minutes from midnight) falls within a range
 * Handles wrap-around for night hours
 */
function isInRange(time: number, start: number, end: number): boolean {
  if (start <= end) {
    // Normal range (e.g., 06:00 - 18:00)
    return time >= start && time < end;
  } else {
    // Wrap-around range (e.g., 22:00 - 06:00)
    return time >= start || time < end;
  }
}

interface HourBreakdown {
  totalHours: number;
  dayHours: number;
  eveningHours: number;
  nightHours: number;
}

/**
 * Calculate hour type breakdown (day/evening/night hours)
 * Processes time minute-by-minute for accuracy
 */
export async function calculateHourTypes(
  timeIn: Date,
  timeOut: Date,
  companyId: string
): Promise<HourBreakdown> {
  const hourTypes = await getWorkingHourTypes(companyId);

  let dayMinutes = 0;
  let eveningMinutes = 0;
  let nightMinutes = 0;

  let current = new Date(timeIn);
  const end = new Date(timeOut);

  // Process minute by minute
  while (current < end) {
    const minutesFromMidnight = current.getHours() * 60 + current.getMinutes();

    // Determine which type this minute belongs to
    if (isInRange(minutesFromMidnight, hourTypes.dayStart, hourTypes.dayEnd)) {
      dayMinutes++;
    } else if (isInRange(minutesFromMidnight, hourTypes.eveningStart, hourTypes.eveningEnd)) {
      eveningMinutes++;
    } else {
      nightMinutes++;
    }

    // Move to next minute
    current = new Date(current.getTime() + 60000);
  }

  return {
    totalHours: parseFloat(((timeOut.getTime() - timeIn.getTime()) / 3600000).toFixed(2)),
    dayHours: parseFloat((dayMinutes / 60).toFixed(2)),
    eveningHours: parseFloat((eveningMinutes / 60).toFixed(2)),
    nightHours: parseFloat((nightMinutes / 60).toFixed(2)),
  };
}
