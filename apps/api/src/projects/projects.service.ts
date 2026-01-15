import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.project.findMany({ where: { companyId, isActive: true } });
  }

  async create(companyId: string, data: any) {
    return this.prisma.project.create({ data: { ...data, companyId } });
  }
}
