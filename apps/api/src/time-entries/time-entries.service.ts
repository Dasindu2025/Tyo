import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimeEngineService } from '../common/time-engine.service';
import { TimeEntryStatus } from '@tyotrack/shared';
import { isAfter, startOfDay } from 'date-fns';

@Injectable()
export class TimeEntriesService {
  constructor(
    private prisma: PrismaService,
    private timeEngine: TimeEngineService,
  ) {}

  async create(userId: string, companyId: string, data: any) {
    const { projectId, startTime, endTime, description } = data;
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isAfter(start, new Date())) {
      throw new BadRequestException('Cannot log time in the future');
    }

    if (isAfter(start, end)) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Check backdate limit
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    const limitDays = user.backdateLimit ?? user.company.backdateLimitDays;
    const limitDate = startOfDay(new Date());
    limitDate.setDate(limitDate.getDate() - limitDays);

    if (isAfter(limitDate, start)) {
      throw new BadRequestException(`Backdate limit exceeded. You can only log time up to ${limitDays} days in the past.`);
    }

    // Check for overlaps
    const overlaps = await this.prisma.timeEntry.findFirst({
      where: {
        userId,
        OR: [
          { startTime: { lt: end, gte: start } },
          { endTime: { gt: start, lte: end } },
          { startTime: { lte: start }, endTime: { gte: end } },
        ],
      },
    });

    if (overlaps) {
      throw new BadRequestException('Time entry overlaps with an existing one');
    }

    // Split entry if it crosses midnight
    const segments = this.timeEngine.splitEntryByDay(start, end);
    
    // Get company rules for breakdown
    const rules = await this.prisma.workingHourRule.findMany({
      where: { companyId },
    });

    // If no rules, use defaults
    const activeRules = rules.length > 0 ? rules.map(r => ({
      name: r.name,
      start: r.startTime,
      end: r.endTime
    })) : [
      { name: 'Day', start: '08:00', end: '18:00' },
      { name: 'Evening', start: '18:00', end: '22:00' },
      { name: 'Night', start: '22:00', end: '08:00' },
    ];

    const results = await this.prisma.$transaction(
      segments.map(segment => {
        const breakdown = this.timeEngine.calculateBreakdown(segment.startTime, segment.endTime, activeRules);
        
        return this.prisma.timeEntry.create({
          data: {
            date: segment.date,
            startTime: segment.startTime,
            endTime: segment.endTime,
            durationMinutes: segment.durationMinutes,
            description,
            userId,
            projectId,
            companyId,
            status: user.company.requireApproval ? TimeEntryStatus.PENDING : TimeEntryStatus.APPROVED,
            dayHours: breakdown.day,
            eveningHours: breakdown.evening,
            nightHours: breakdown.night,
          },
        });
      })
    );

    return results;
  }

  async findAll(companyId: string, userId?: string, filters?: any) {
    const where: any = { companyId };
    if (userId) where.userId = userId;
    
    // Add date filters, status, etc.
    
    return this.prisma.timeEntry.findMany({
      where,
      include: { project: true, user: true },
      orderBy: { startTime: 'desc' },
    });
  }
}
