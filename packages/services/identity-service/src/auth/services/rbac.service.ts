import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Resource, Action, PermissionScope, PermissionEffect, UserRole, RbacAuditCategory } from '@sabs/common';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { Policy } from '../entities/policy.entity';
import { UserPermission } from '../entities/user-permission.entity';
import { RbacAuditLog } from '../entities/rbac-audit-log.entity';
import { AuthUser } from '../interfaces/jwt-payload.interface';

export interface AuthorizationContext {
  user: AuthUser;
  resource?: any;
  request?: any;
  session?: any;
  company?: any;
  location?: any;
  time?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthorizationResult {
  allowed: boolean;
  reason: string;
  appliedPermissions: Permission[];
  appliedPolicies: Policy[];
  userPermissions: UserPermission[];
  riskScore: number;
}

export interface PermissionCheck {
  resource: Resource;
  action: Action;
  scope?: PermissionScope;
  resourceId?: string;
}

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(RbacAuditLog)
    private readonly rbacAuditRepository: Repository<RbacAuditLog>,
  ) {}

  /**
   * Core authorization method - checks if user has permission for a specific action
   */
  async authorize(
    context: AuthorizationContext,
    check: PermissionCheck
  ): Promise<AuthorizationResult> {
    const startTime = Date.now();
    
    try {
      // Get user's effective permissions
      const userRole = await this.getUserRole(context.user.id);
      const rolePermissions = userRole ? userRole.getEffectivePermissions(context.user.companyId) : [];
      const userPermissions = await this.getUserPermissions(context.user.id);
      const policies = await this.getApplicablePolicies(context.user.id, check.resource, check.action);

      // Evaluate permissions
      const result = await this.evaluatePermissions(
        context,
        check,
        rolePermissions,
        userPermissions,
        policies
      );

      // Audit the authorization check
      await this.auditAuthorizationCheck(context, check, result);

      return result;

    } catch (error) {
      // Audit failed authorization
      await this.auditAuthorizationCheck(context, check, {
        allowed: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
        appliedPermissions: [],
        appliedPolicies: [],
        userPermissions: [],
        riskScore: 100,
      });

      throw error;
    }
  }

  /**
   * Batch authorization check for multiple permissions
   */
  async authorizeBatch(
    context: AuthorizationContext,
    checks: PermissionCheck[]
  ): Promise<Record<string, AuthorizationResult>> {
    const results: Record<string, AuthorizationResult> = {};

    for (const check of checks) {
      const key = `${check.resource}:${check.action}:${check.scope || 'default'}`;
      results[key] = await this.authorize(context, check);
    }

    return results;
  }

  /**
   * Check if user has permission (simple boolean check)
   */
  async hasPermission(
    userId: string,
    resource: Resource,
    action: Action,
    scope?: PermissionScope,
    resourceId?: string,
    context?: Partial<AuthorizationContext>
  ): Promise<boolean> {
    const user = context?.user || await this.getUserContext(userId);
    const fullContext: AuthorizationContext = {
      user,
      ...context,
    };

    const result = await this.authorize(fullContext, {
      resource,
      action,
      scope,
      resourceId,
    });

    return result.allowed;
  }

  /**
   * Get all permissions for a user
   */
  async getUserEffectivePermissions(userId: string): Promise<{
    rolePermissions: Permission[];
    userPermissions: UserPermission[];
    allPermissions: string[];
  }> {
    const role = await this.getUserRole(userId);
    const userPermissions = await this.getUserPermissions(userId);
    
    const rolePermissions = role ? role.getAllPermissions() : [];
    const allPermissionStrings = new Set<string>();

    // Add role permissions
    rolePermissions.forEach(p => {
      if (p.isActive) {
        allPermissionStrings.add(p.permissionString);
      }
    });

    // Add user-specific permissions (overrides)
    userPermissions.forEach(up => {
      if (up.isValid) {
        if (up.isAllow) {
          allPermissionStrings.add(up.permissionString);
        } else {
          allPermissionStrings.delete(up.permissionString);
        }
      }
    });

    return {
      rolePermissions,
      userPermissions,
      allPermissions: Array.from(allPermissionStrings),
    };
  }

  /**
   * Grant permission to user
   */
  async grantPermissionToUser(
    userId: string,
    resource: Resource,
    action: Action,
    scope: PermissionScope,
    grantedBy: string,
    options: {
      resourceId?: string;
      reason?: string;
      duration?: number;
      conditions?: Record<string, any>;
    } = {}
  ): Promise<UserPermission> {
    const userPermission = this.userPermissionRepository.create({
      userId,
      resource,
      action,
      scope,
      effect: PermissionEffect.ALLOW,
      resourceId: options.resourceId,
      grantedBy,
      grantedReason: options.reason,
      conditions: options.conditions,
      isActive: true,
      isTemporary: !!options.duration,
      expiresAt: options.duration ? new Date(Date.now() + options.duration) : null,
    });

    const saved = await this.userPermissionRepository.save(userPermission);

    // Audit the permission grant
    await this.auditPermissionGrant(userId, grantedBy, saved);

    return saved;
  }

  /**
   * Revoke permission from user
   */
  async revokePermissionFromUser(
    userId: string,
    permissionId: string,
    revokedBy: string,
    reason?: string
  ): Promise<void> {
    const userPermission = await this.userPermissionRepository.findOne({
      where: { userId, id: permissionId },
    });

    if (!userPermission) {
      throw new NotFoundException('User permission not found');
    }

    userPermission.revoke();
    await this.userPermissionRepository.save(userPermission);

    // Audit the permission revocation
    await this.auditPermissionRevoke(userId, revokedBy, userPermission, reason);
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy: string
  ): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Update user's role (simplified - in real implementation might be many-to-many)
    // This would integrate with the User entity
    
    // Audit the role assignment
    await this.auditRoleAssignment(userId, roleId, assignedBy);
  }

  /**
   * Create a custom policy
   */
  async createPolicy(
    name: string,
    description: string,
    resource: Resource,
    action: Action,
    effect: PermissionEffect,
    conditions: any[],
    createdBy: string,
    companyId?: string
  ): Promise<Policy> {
    const policy = this.policyRepository.create({
      name,
      description,
      resource,
      action,
      effect,
      conditions,
      rules: [{
        effect,
        resource,
        action,
        conditions,
      }],
      companyId,
      isActive: true,
    });

    const saved = await this.policyRepository.save(policy);

    // Audit policy creation
    await this.auditPolicyCreation(createdBy, saved);

    return saved;
  }

  /**
   * Get security analytics for a user or company
   */
  async getSecurityAnalytics(
    targetId: string,
    type: 'user' | 'company',
    days: number = 30
  ): Promise<{
    totalEvents: number;
    permissionGrants: number;
    permissionDenials: number;
    policyViolations: number;
    riskScore: number;
    eventsByCategory: Record<string, number>;
    timelineData: Array<{ date: string; events: number; riskScore: number }>;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const queryBuilder = this.rbacAuditRepository
      .createQueryBuilder('audit')
      .where('audit.createdAt >= :since', { since });

    if (type === 'user') {
      queryBuilder.andWhere('audit.userId = :targetId', { targetId });
    } else {
      queryBuilder.andWhere('audit.companyId = :targetId', { targetId });
    }

    const logs = await queryBuilder.getMany();

    const analytics = {
      totalEvents: logs.length,
      permissionGrants: logs.filter(l => l.category === RbacAuditCategory.PERMISSION_GRANTED).length,
      permissionDenials: logs.filter(l => l.category === RbacAuditCategory.PERMISSION_DENIED).length,
      policyViolations: logs.filter(l => !l.success).length,
      riskScore: logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + l.riskScore, 0) / logs.length) : 0,
      eventsByCategory: {} as Record<string, number>,
      timelineData: [] as Array<{ date: string; events: number; riskScore: number }>,
    };

    // Group by category
    logs.forEach(log => {
      analytics.eventsByCategory[log.category] = (analytics.eventsByCategory[log.category] || 0) + 1;
    });

    // Generate timeline data
    const timeline = new Map<string, { events: number; totalRisk: number; count: number }>();
    logs.forEach(log => {
      const date = log.createdAt.toISOString().split('T')[0];
      const existing = timeline.get(date) || { events: 0, totalRisk: 0, count: 0 };
      existing.events++;
      existing.totalRisk += log.riskScore;
      existing.count++;
      timeline.set(date, existing);
    });

    analytics.timelineData = Array.from(timeline.entries()).map(([date, data]) => ({
      date,
      events: data.events,
      riskScore: Math.round(data.totalRisk / data.count),
    }));

    return analytics;
  }

  // Private helper methods
  private async getUserRole(userId: string): Promise<Role | null> {
    // This would need to be implemented based on how roles are associated with users
    // For now, returning null - would need User entity integration
    return null;
  }

  private async getUserPermissions(userId: string): Promise<UserPermission[]> {
    return this.userPermissionRepository.find({
      where: { userId, isActive: true },
      relations: ['permission'],
    });
  }

  private async getApplicablePolicies(
    userId: string,
    resource: Resource,
    action: Action
  ): Promise<Policy[]> {
    return this.policyRepository.find({
      where: [
        { userId, resource, action, isActive: true },
        { resource, action, isActive: true, userId: null }, // Global policies
      ],
    });
  }

  private async evaluatePermissions(
    context: AuthorizationContext,
    check: PermissionCheck,
    rolePermissions: Permission[],
    userPermissions: UserPermission[],
    policies: Policy[]
  ): Promise<AuthorizationResult> {
    let allowed = false;
    let reason = 'No matching permissions found';
    const appliedPermissions: Permission[] = [];
    const appliedPolicies: Policy[] = [];
    let riskScore = 0;

    // Check role permissions first
    for (const permission of rolePermissions) {
      if (permission.matches(check.resource, check.action, check.scope)) {
        if (permission.allowsAccess(check.resourceId) && 
            permission.evaluateConditions(this.buildContext(context))) {
          allowed = true;
          reason = `Granted by role permission: ${permission.name}`;
          appliedPermissions.push(permission);
          riskScore += 10; // Base risk for role-based access
        }
      }
    }

    // Check user-specific permissions (can override role permissions)
    for (const userPermission of userPermissions) {
      if (userPermission.matches(check.resource, check.action, check.scope)) {
        if (userPermission.allowsAccessToResource(check.resourceId) &&
            userPermission.evaluateConditions(this.buildContext(context))) {
          
          if (userPermission.isAllow) {
            allowed = true;
            reason = `Granted by user permission: ${userPermission.permissionString}`;
            riskScore += userPermission.isTemporary ? 20 : 15;
          } else {
            allowed = false;
            reason = `Denied by user permission override: ${userPermission.permissionString}`;
            riskScore += 25; // Explicit denials are higher risk
          }
        }
      }
    }

    // Evaluate policies (can override everything)
    for (const policy of policies) {
      if (policy.matches(check.resource, check.action)) {
        const policyResult = policy.evaluate(this.buildContext(context));
        if (policyResult.allowed !== null) {
          allowed = policyResult.allowed;
          reason = `${policyResult.effect} by policy: ${policy.name}`;
          appliedPolicies.push(policy);
          riskScore += policy.effect === PermissionEffect.DENY ? 30 : 5;
        }
      }
    }

    // Additional risk scoring based on context
    if (context.ipAddress && this.isSuspiciousIp(context.ipAddress)) {
      riskScore += 20;
    }

    if (this.isOutsideBusinessHours(context.time || new Date())) {
      riskScore += 10;
    }

    return {
      allowed,
      reason,
      appliedPermissions,
      appliedPolicies,
      userPermissions,
      riskScore: Math.min(riskScore, 100),
    };
  }

  private buildContext(context: AuthorizationContext): Record<string, any> {
    return {
      user: context.user,
      resource: context.resource,
      request: context.request,
      company: context.company,
      session: context.session,
      location: context.location,
      time: context.time || new Date(),
    };
  }

  private async getUserContext(userId: string): Promise<AuthUser> {
    // This would need to fetch user data - placeholder for now
    return {
      id: userId,
      email: '',
      companyId: '',
      role: UserRole.FIELD_AGENT,
      firstName: '',
      lastName: '',
      isActive: true,
    };
  }

  private isSuspiciousIp(ipAddress: string): boolean {
    // Simplified IP checking - would need proper implementation
    return false;
  }

  private isOutsideBusinessHours(time: Date): boolean {
    const hour = time.getHours();
    return hour < 6 || hour > 22; // Outside 6 AM - 10 PM
  }

  // Audit methods
  private async auditAuthorizationCheck(
    context: AuthorizationContext,
    check: PermissionCheck,
    result: AuthorizationResult
  ): Promise<void> {
    const auditLog = RbacAuditLog.createAccessAttemptLog(
      context.user.id,
      check.resource,
      check.action,
      result.allowed,
      {
        ipAddress: context.ipAddress || '127.0.0.1',
        userAgent: context.userAgent,
        sessionId: context.session?.id,
        companyId: context.user.companyId,
        resourceId: check.resourceId,
        description: `Access ${result.allowed ? 'granted' : 'denied'}: ${result.reason}`,
        errorMessage: result.allowed ? undefined : result.reason,
        permissions: {
          appliedPermissions: result.appliedPermissions.map(p => p.permissionString),
          appliedPolicies: result.appliedPolicies.map(p => p.name),
          userPermissions: result.userPermissions.map(up => up.permissionString),
        },
      }
    );

    await this.rbacAuditRepository.save(auditLog);
  }

  private async auditPermissionGrant(
    userId: string,
    grantedBy: string,
    permission: UserPermission
  ): Promise<void> {
    const auditLog = RbacAuditLog.createPermissionAuditLog(
      RbacAuditCategory.PERMISSION_GRANTED,
      grantedBy,
      permission.resource,
      permission.action,
      permission.effect,
      {
        ipAddress: '127.0.0.1', // Would come from request context
        description: `Permission granted to user ${userId}: ${permission.permissionString}`,
        success: true,
        companyId: permission.user?.companyId,
        permissionId: permission.id,
      }
    );

    await this.rbacAuditRepository.save(auditLog);
  }

  private async auditPermissionRevoke(
    userId: string,
    revokedBy: string,
    permission: UserPermission,
    reason?: string
  ): Promise<void> {
    const auditLog = RbacAuditLog.createPermissionAuditLog(
      RbacAuditCategory.PERMISSION_DENIED,
      revokedBy,
      permission.resource,
      permission.action,
      PermissionEffect.DENY,
      {
        ipAddress: '127.0.0.1',
        description: `Permission revoked from user ${userId}: ${permission.permissionString}. Reason: ${reason || 'Not specified'}`,
        success: true,
        companyId: permission.user?.companyId,
        permissionId: permission.id,
      }
    );

    await this.rbacAuditRepository.save(auditLog);
  }

  private async auditRoleAssignment(
    userId: string,
    roleId: string,
    assignedBy: string
  ): Promise<void> {
    const auditLog = RbacAuditLog.createRoleAuditLog(
      RbacAuditCategory.ROLE_ASSIGNED,
      assignedBy,
      userId,
      roleId,
      {
        ipAddress: '127.0.0.1',
        description: `Role ${roleId} assigned to user ${userId}`,
        success: true,
      }
    );

    await this.rbacAuditRepository.save(auditLog);
  }

  private async auditPolicyCreation(
    createdBy: string,
    policy: Policy
  ): Promise<void> {
    const auditLog = RbacAuditLog.createPolicyAuditLog(
      RbacAuditCategory.POLICY_CREATED,
      createdBy,
      policy.id,
      {
        ipAddress: '127.0.0.1',
        description: `Policy created: ${policy.name}`,
        success: true,
        companyId: policy.companyId,
        policies: { policy: policy.name, effect: policy.effect },
      }
    );

    await this.rbacAuditRepository.save(auditLog);
  }
}