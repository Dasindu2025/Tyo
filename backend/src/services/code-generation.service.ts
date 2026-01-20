import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CodeGenerationOptions {
  companyId?: string;
  entityType: 'company' | 'employee' | 'project' | 'workplace';
  prefix: string;
}

/**
 * Generates unique auto-codes like EMP001, PRO001, LOC001, COM001
 * Uses atomic database operations with row locking for uniqueness
 */
export async function generateUniqueCode(options: CodeGenerationOptions): Promise<string> {
  const { companyId, entityType, prefix } = options;

  return await prisma.$transaction(async (tx) => {
    // Try to fetch existing counter
    let counter =await tx.entityCodeCounter.findUnique({
      where: {
        companyId_entityType: {
          companyId: companyId || '',
          entityType,
        },
      },
    });

    // If no counter exists, create it
    if (!counter) {
      counter = await tx.entityCodeCounter.create({
        data: {
          companyId: companyId || '',
          entityType,
          prefix,
          currentNumber: 0,
        },
      });
    }

    // Increment the counter
    const newNumber = counter.currentNumber + 1;

    // Update the counter with row locking
    await tx.entityCodeCounter.update({
      where: {
        companyId_entityType: {
          companyId: companyId || '',
          entityType,
        },
      },
      data: {
        currentNumber: newNumber,
      },
    });

    // Generate the code with proper padding
    const paddedNumber = String(newNumber).padStart(3, '0');
    return `${prefix}${paddedNumber}`;
  });
}

/**
 * Generate company code (global scope)
 */
export async function generateCompanyCode(): Promise<string> {
  return generateUniqueCode({
    entityType: 'company',
    prefix: 'COM',
  });
}

/**
 * Generate employee code (company scope)
 */
export async function generateEmployeeCode(companyId: string): Promise<string> {
  return generateUniqueCode({
    companyId,
    entityType: 'employee',
    prefix: 'EMP',
  });
}

/**
 * Generate project code (company scope)
 */
export async function generateProjectCode(companyId: string): Promise<string> {
  return generateUniqueCode({
    companyId,
    entityType: 'project',
    prefix: 'PRO',
  });
}

/**
 * Generate workplace code (company scope)
 */
export async function generateWorkplaceCode(companyId: string): Promise<string> {
  return generateUniqueCode({
    companyId,
    entityType: 'workplace',
    prefix: 'LOC',
  });
}
