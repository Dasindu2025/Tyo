export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum TimeEntryStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
}

export interface Company {
  id: string;
  name: string;
  settings: CompanySettings;
}

export interface CompanySettings {
  timezone: string;
  dateFormat: string;
  backdateLimitDays: number;
  requireApproval: boolean;
}
