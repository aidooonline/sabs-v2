import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@sabs/common';
import { AuthUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Super admins can access all companies
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Extract companyId from request params, query, or body
    const requestedCompanyId = 
      request.params?.companyId || 
      request.query?.companyId || 
      request.body?.companyId;

    // If no company ID in request, user can only access their own company data
    if (!requestedCompanyId) {
      return true; // Will be filtered by application logic using user.companyId
    }

    // Users can only access data from their own company
    if (user.companyId !== requestedCompanyId) {
      throw new ForbiddenException('Access denied: cannot access data from another company');
    }

    return true;
  }
}