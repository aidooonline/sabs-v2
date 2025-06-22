import { UserRole } from '@sabs/common';

export interface User {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}