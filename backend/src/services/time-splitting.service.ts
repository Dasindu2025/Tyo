import { calculateHourTypes } from './hour-calculation.service';

interface TimeEntryInput {
  employeeId: string;
  projectId: string;
  workplaceId: string;
  timeIn: Date;
  timeOut: Date;
  notes?: string;
  isFullDay?: boolean;
}

interface SplitTimeEntry {
  entryDate: string; // YYYY-MM-DD format
  timeIn: Date;
  timeOut: Date;
  totalHours: number;
  dayHours: number;
  eveningHours: number;
  nightHours: number;
}

/**
 * Splits time entries that cross midnight into separate entries per day
 * Each entry gets its own hour calculations
 */
export async function splitTimeEntry(
  input: TimeEntryInput,
  companyId: string
): Promise<SplitTimeEntry[]> {
  const { timeIn, timeOut } = input;
  const entries: SplitTimeEntry[] = [];

  let currentStart = new Date(timeIn);
  const finalEnd = new Date(timeOut);

  while (currentStart < finalEnd) {
    // Calculate end of current day (23:59:59.999)
    const dayEnd = new Date(currentStart);
    dayEnd.setHours(23, 59, 59, 999);

    // Determine the end time for this entry
    const currentEnd = finalEnd <= dayEnd ? finalEnd : dayEnd;

    // Calculate hour breakdown for this segment
    const hourBreakdown = await calculateHourTypes(currentStart, currentEnd, companyId);

    // Extract date in YYYY-MM-DD format
    const entryDate = currentStart.toISOString().split('T')[0];

    entries.push({
      entryDate,
      timeIn: currentStart,
      timeOut: currentEnd,
      totalHours: hourBreakdown.totalHours,
      dayHours: hourBreakdown.dayHours,
      eveningHours: hourBreakdown.eveningHours,
      nightHours: hourBreakdown.nightHours,
    });

    // Move to the start of the next day
    if (currentEnd === dayEnd && finalEnd > dayEnd) {
      currentStart = new Date(dayEnd.getTime() + 1);
    } else {
      break;
    }
  }

  return entries;
}

/**
 * Check if time entry needs to be split (crosses midnight)
 */
export function needsSplitting(timeIn: Date, timeOut: Date): boolean {
  return timeIn.toDateString() !== timeOut.toDateString();
}
