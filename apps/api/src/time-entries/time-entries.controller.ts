import { Controller, Post, Body, Get, UseGuards, Request, Query } from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('time-entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('time-entries')
export class TimeEntriesController {
  constructor(private timeEntriesService: TimeEntriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new time entry' })
  async create(@Request() req, @Body() data: any) {
    return this.timeEntriesService.create(req.user.userId, req.user.companyId, data);
  }

  @Get()
  @ApiOperation({ summary: 'Get time entries' })
  async findAll(@Request() req, @Query() filters: any) {
    // Basic multi-tenancy: always filter by companyId
    const userId = req.user.role === 'EMPLOYEE' ? req.user.userId : undefined;
    return this.timeEntriesService.findAll(req.user.companyId, userId, filters);
  }
}
