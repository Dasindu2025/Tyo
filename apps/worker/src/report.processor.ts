import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { stringify } from 'csv-stringify/sync';

@Processor('reports')
@Injectable()
export class ReportProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`Processing job ${job.id} for company ${job.data.companyId}`);
    
    const { companyId, startDate, endDate } = job.data;

    const entries = await this.prisma.timeEntry.findMany({
      where: {
        companyId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        user: true,
        project: true,
      },
    });

    const csvData = entries.map(e => ({
      Date: e.date.toISOString().split('T')[0],
      Employee: e.user.name,
      Project: e.project.name,
      Start: e.startTime.toISOString(),
      End: e.endTime.toISOString(),
      Duration: e.durationMinutes,
      DayHours: e.dayHours,
      EveningHours: e.eveningHours,
      NightHours: e.nightHours,
    }));

    const csvString = stringify(csvData, { header: true });
    
    // In a real app, we would upload to S3 and return the link
    console.log('CSV Report Generated locally (length):', csvString.length);
    
    return { success: true, count: entries.length };
  }
}
