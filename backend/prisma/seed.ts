import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/auth.utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Super Admin
  const superAdmin = await prisma.superAdmin.create({
    data: {
      email: 'superadmin@worktime.com',
      passwordHash: await hashPassword('password123'),
      name: 'Super Administrator',
    },
  });
  console.log('✅ Created Super Admin');

  // Create Company 1
  const company1 = await prisma.company.create({
    data: {
      companyCode: 'COM001',
      name: 'Tech Solutions Inc',
      email: 'info@techsolutions.com',
      phone: '+1-555-0100',
      address: '123 Tech Street, Silicon Valley, CA 94000',
      createdById: superAdmin.id,
      admins: {
        create: {
          name: 'John Admin',
          email: 'admin@techsolutions.com',
          passwordHash: await hashPassword('password123'),
        },
      },
      workingHourTypes: {
        create: {
          dayStartTime: '06:00:00',
          dayEndTime: '18:00:00',
          eveningStartTime: '18:00:00',
          eveningEndTime: '22:00:00',
          nightStartTime: '22:00:00',
          nightEndTime: '06:00:00',
        },
      },
    },
    include: { admins: true },
  });
  console.log('✅ Created Company 1: Tech Solutions Inc');

  const admin1 = company1.admins[0];

  // Create Employees for Company 1
  const employees1 = await Promise.all([
    prisma.employee.create({
      data: {
        companyId: company1.id,
        employeeCode: 'EMP001',
        email: 'alice@techsolutions.com',
        passwordHash: await hashPassword('password123'),
        firstName: 'Alice',
        lastName: 'Johnson',
        phone: '+1-555-0101',
        hireDate: new Date('2024-01-15'),
        createdById: admin1.id,
      },
    }),
    prisma.employee.create({
      data: {
        companyId: company1.id,
        employeeCode: 'EMP002',
        email: 'bob@techsolutions.com',
        passwordHash: await hashPassword('password123'),
        firstName: 'Bob',
        lastName: 'Smith',
        phone: '+1-555-0102',
        hireDate: new Date('2024-02-01'),
        createdById: admin1.id,
      },
    }),
    prisma.employee.create({
      data: {
        companyId: company1.id,
        employeeCode: 'EMP003',
        email: 'carol@techsolutions.com',
        passwordHash: await hashPassword('password123'),
        firstName: 'Carol',
        lastName: 'Williams',
        phone: '+1-555-0103',
        hireDate: new Date('2024-03-10'),
        createdById: admin1.id,
      },
    }),
  ]);
  console.log('✅ Created 3 employees for Tech Solutions Inc');

  // Create Projects for Company 1
  const projects1 = await Promise.all([
    prisma.project.create({
      data: {
        companyId: company1.id,
        projectCode: 'PRO001',
        name: 'Website Redesign',
        description: 'Complete overhaul of company website',
        createdById: admin1.id,
      },
    }),
    prisma.project.create({
      data: {
        companyId: company1.id,
        projectCode: 'PRO002',
        name: 'Mobile App Development',
        description: 'iOS and Android app development',
        createdById: admin1.id,
      },
    }),
  ]);
  console.log('✅ Created 2 projects for Tech Solutions Inc');

  // Create Workplaces for Company 1
  const workplaces1 = await Promise.all([
    prisma.workplace.create({
      data: {
        companyId: company1.id,
        workplaceCode: 'LOC001',
        name: 'Main Office',
        location: '123 Tech Street',
        createdById: admin1.id,
      },
    }),
    prisma.workplace.create({
      data: {
        companyId: company1.id,
        workplaceCode: 'LOC002',
        name: 'Remote',
        location: 'Work from home',
        createdById: admin1.id,
      },
    }),
  ]);
  console.log('✅ Created 2 workplaces for Tech Solutions Inc');

  // Create sample time entries
  await prisma.timeEntry.createMany({
    data: [
      {
        companyId: company1.id,
        employeeId: employees1[0].id,
        projectId: projects1[0].id,
        workplaceId: workplaces1[0].id,
        entryDate: new Date('2026-01-15'),
        timeIn: new Date('2026-01-15T09:00:00'),
        timeOut: new Date('2026-01-15T17:30:00'),
        totalHours: 8.5,
        dayHours: 8.5,
        eveningHours: 0,
        nightHours: 0,
        notes: 'Regular workday',
      },
      {
        companyId: company1.id,
        employeeId: employees1[0].id,
        projectId: projects1[1].id,
        workplaceId: workplaces1[1].id,
        entryDate: new Date('2026-01-16'),
        timeIn: new Date('2026-01-16T10:00:00'),
        timeOut: new Date('2026-01-16T19:00:00'),
        totalHours: 9,
        dayHours: 8,
        eveningHours: 1,
        nightHours: 0,
        notes: 'Remote work with overtime',
      },
    ],
  });
  console.log('✅ Created sample time entries');

  // Initialize code counters
  await prisma.entityCodeCounter.createMany({
    data: [
      { companyId: '', entityType: 'company', prefix: 'COM', currentNumber: 1 },
      { companyId: company1.id, entityType: 'employee', prefix: 'EMP', currentNumber: 3 },
      { companyId: company1.id, entityType: 'project', prefix: 'PRO', currentNumber: 2 },
      { companyId: company1.id, entityType: 'workplace', prefix: 'LOC', currentNumber: 2 },
    ],
  });
  console.log('✅ Initialized code counters');

  console.log('\n📊 Seed Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin: superadmin@worktime.com / password123');
  console.log('Company Admin: admin@techsolutions.com / password123');
  console.log('Employees:');
  console.log('  - alice@techsolutions.com / password123');
  console.log('  - bob@techsolutions.com / password123');
  console.log('  - carol@techsolutions.com / password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
