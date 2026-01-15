import { Injectable } from '@nestjs/common';
import { addMinutes, differenceInMinutes, format, parse, startOfDay, endOfDay, isBefore, isAfter, addDays, subDays } from 'date-fns';

export interface TimeSegment {
  date: Date;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
}

export interface HourBreakdown {
  day: number;
  evening: number;
  night: number;
}

@Injectable()
export class TimeEngineService {
  /**
   * Splits a time entry into day-based segments if it crosses midnight.
   */
  splitEntryByDay(startTime: Date, endTime: Date): TimeSegment[] {
    const segments: TimeSegment[] = [];
    let currentStart = new Date(startTime);
    const finalEnd = new Date(endTime);

    while (currentStart < finalEnd) {
      const dayEnd = endOfDay(currentStart);
      const segmentEnd = isBefore(dayEnd, finalEnd) ? dayEnd : finalEnd;

      segments.push({
        date: startOfDay(currentStart),
        startTime: new Date(currentStart),
        endTime: new Date(segmentEnd),
        durationMinutes: differenceInMinutes(segmentEnd, currentStart),
      });

      if (isBefore(dayEnd, finalEnd)) {
        currentStart = addMinutes(dayEnd, 1); // Move to start of next day
        // Adjust currentStart back to strict 00:00 of next day
        currentStart = startOfDay(currentStart);
      } else {
        break;
      }
    }

    return segments;
  }

  /**
   * Calculates the breakdown of Day/Evening/Night hours based on company rules.
   * Default rules:
   * Day: 08:00 - 18:00
   * Evening: 18:00 - 22:00
   * Night: 22:00 - 08:00
   */
  calculateBreakdown(
    startTime: Date,
    endTime: Date,
    rules: { name: string; start: string; end: string }[]
  ): HourBreakdown {
    const breakdown = { day: 0, evening: 0, night: 0 };
    
    // For simplicity, we process minute by minute or use a more efficient interval check.
    // Given the constraints, a 1-minute step is reliable for all boundary cases.
    let current = new Date(startTime);
    while (current < endTime) {
      const timeStr = format(current, 'HH:mm');
      
      const matchedRule = rules.find(r => {
        const [hStart, mStart] = r.start.split(':').map(Number);
        const [hEnd, mEnd] = r.end.split(':').map(Number);
        
        const currentH = current.getHours();
        const currentM = current.getMinutes();
        
        const currentVal = currentH * 60 + currentM;
        const startVal = hStart * 60 + mStart;
        const endVal = hEnd * 60 + mEnd;
        
        if (startVal < endVal) {
          return currentVal >= startVal && currentVal < endVal;
        } else {
          // Cross-midnight rule (e.g., Night 22:00 - 08:00)
          return currentVal >= startVal || currentVal < endVal;
        }
      });
      
      if (matchedRule) {
        const key = matchedRule.name.toLowerCase() as keyof HourBreakdown;
        breakdown[key] = (breakdown[key] || 0) + 1;
      }
      
      current = addMinutes(current, 1);
    }
    
    return {
      day: breakdown.day / 60,
      evening: breakdown.evening / 60,
      night: breakdown.night / 60,
    };
  }
}
