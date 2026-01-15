import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Tyotrack@2026', 10);

  // Create Company 1
  const company1 = await prisma.company.create({
    data: {
      name: 'Acme Corp',
      timezone: 'Europe/Helsinki',
      backdateLimitDays: 7,
      requireApproval: true,
      workingHourRules: {
        create: [
          { name: 'Day', startTime: '08:00', endTime: '18:00' },
          { name: 'Evening', startTime: '18:00', endTime: '22:00' },
          { name: 'Night', startTime: '22:00', endTime: '08:00' },
        ],
      },
    },
  });

  // Create Admin for Company 1
  await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      name: 'Acme Admin',
      password,
      role: UserRole.COMPANY_ADMIN,
      companyId: company1.id,
    },
  });

  // Create Employee for Company 1
  await prisma.user.create({
    data: {
      email: 'employee@acme.com',
      name: 'Acme Employee',
      password,
      role: UserRole.EMPLOYEE,
      companyId: company1.id,
    },
  });

  // Create Project for Company 1
  await prisma.project.create({
    data: {
      name: 'Internal Project',
      companyId: company1.id,
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
