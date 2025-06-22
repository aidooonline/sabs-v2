import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { RbacAuditCategory, Resource, Action, PermissionEffect } from '@sabs/common';
import { User } from '../../users/entities/user.entity';

@Entity('rbac_audit_logs')
@Index(['category', 'createdAt'])
@Index(['userId', 'category'])
@Index(['resource', 'action'])
@Index(['companyId', 'createdAt'])
export class RbacAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    type: 'enum', 
    enum: RbacAuditCategory,
    name: 'category'
  })
  category: RbacAuditCategory;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'target_user_id', nullable: true })
  targetUserId: string; // User being acted upon

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ 
    type: 'enum', 
    enum: Resource,
    name: 'resource',
    nullable: true
  })
  resource: Resource;

  @Column({ 
    type: 'enum', 
    enum: Action,
    name: 'action',
    nullable: true
  })
  action: Action;

  @Column({ 
    type: 'enum', 
    enum: PermissionEffect,
    name: 'effect',
    nullable: true
  })
  effect: PermissionEffect;

  @Column({ name: 'permission_id', nullable: true })
  permissionId: string;

  @Column({ name: 'role_id', nullable: true })
  roleId: string;

  @Column({ name: 'policy_id', nullable: true })
  policyId: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string; // Specific resource being accessed

  @Column({ name: 'ip_address', length: 45 })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'json', nullable: true })
  context: Record<string, any>; // Request context and metadata

  @Column({ type: 'json', nullable: true })
  permissions: Record<string, any>; // Permissions evaluated

  @Column({ type: 'json', nullable: true })
  policies: Record<string, any>; // Policies applied

  @Column({ default: true })
  success: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'risk_score', default: 0 })
  riskScore: number; // Calculated risk score for the action

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User;

  // Computed properties
  get isSecurityEvent(): boolean {
    return [
      RbacAuditCategory.PERMISSION_DENIED,
      RbacAuditCategory.PRIVILEGE_ESCALATION,
      RbacAuditCategory.ACCESS_ATTEMPT,
    ].includes(this.category);
  }

  get isAdministrativeEvent(): boolean {
    return [
      RbacAuditCategory.ROLE_ASSIGNED,
      RbacAuditCategory.ROLE_REMOVED,
      RbacAuditCategory.POLICY_CREATED,
      RbacAuditCategory.POLICY_UPDATED,
      RbacAuditCategory.POLICY_DELETED,
    ].includes(this.category);
  }

  get isHighRisk(): boolean {
    return this.riskScore >= 80;
  }

  get isMediumRisk(): boolean {
    return this.riskScore >= 50 && this.riskScore < 80;
  }

  get isLowRisk(): boolean {
    return this.riskScore < 50;
  }

  // Business logic methods
  static createPermissionAuditLog(
    category: RbacAuditCategory,
    userId: string,
    resource: Resource,
    action: Action,
    effect: PermissionEffect,
    context: {
      ipAddress: string;
      userAgent?: string;
      sessionId?: string;
      companyId?: string;
      resourceId?: string;
      permissionId?: string;
      description: string;
      success: boolean;
      errorMessage?: string;
      permissions?: Record<string, any>;
      policies?: Record<string, any>;
    }
  ): Partial<RbacAuditLog> {
    return {
      category,
      userId,
      resource,
      action,
      effect,
      companyId: context.companyId,
      permissionId: context.permissionId,
      resourceId: context.resourceId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      description: context.description,
      success: context.success,
      errorMessage: context.errorMessage,
      permissions: context.permissions,
      policies: context.policies,
      context: {
        timestamp: new Date().toISOString(),
        ...context,
      },
      riskScore: RbacAuditLog.calculateRiskScore(category, effect, context.success),
    };
  }

  static createRoleAuditLog(
    category: RbacAuditCategory.ROLE_ASSIGNED | RbacAuditCategory.ROLE_REMOVED,
    userId: string,
    targetUserId: string,
    roleId: string,
    context: {
      ipAddress: string;
      userAgent?: string;
      sessionId?: string;
      companyId?: string;
      description: string;
      success: boolean;
      errorMessage?: string;
    }
  ): Partial<RbacAuditLog> {
    return {
      category,
      userId,
      targetUserId,
      roleId,
      companyId: context.companyId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      description: context.description,
      success: context.success,
      errorMessage: context.errorMessage,
      context: {
        timestamp: new Date().toISOString(),
        ...context,
      },
      riskScore: RbacAuditLog.calculateRiskScore(category, PermissionEffect.ALLOW, context.success),
    };
  }

  static createPolicyAuditLog(
    category: RbacAuditCategory.POLICY_CREATED | RbacAuditCategory.POLICY_UPDATED | RbacAuditCategory.POLICY_DELETED,
    userId: string,
    policyId: string,
    context: {
      ipAddress: string;
      userAgent?: string;
      sessionId?: string;
      companyId?: string;
      description: string;
      success: boolean;
      errorMessage?: string;
      policies?: Record<string, any>;
    }
  ): Partial<RbacAuditLog> {
    return {
      category,
      userId,
      policyId,
      companyId: context.companyId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      description: context.description,
      success: context.success,
      errorMessage: context.errorMessage,
      policies: context.policies,
      context: {
        timestamp: new Date().toISOString(),
        ...context,
      },
      riskScore: RbacAuditLog.calculateRiskScore(category, PermissionEffect.ALLOW, context.success),
    };
  }

  private static calculateRiskScore(
    category: RbacAuditCategory,
    effect: PermissionEffect,
    success: boolean
  ): number {
    let baseScore = 10; // Base risk score

    // Category-based scoring
    switch (category) {
      case RbacAuditCategory.PERMISSION_DENIED:
        baseScore += success ? 30 : 50; // Higher risk if denial was expected
        break;
      case RbacAuditCategory.PRIVILEGE_ESCALATION:
        baseScore += 70; // High risk activity
        break;
      case RbacAuditCategory.POLICY_CREATED:
      case RbacAuditCategory.POLICY_UPDATED:
      case RbacAuditCategory.POLICY_DELETED:
        baseScore += 40; // Medium-high risk
        break;
      case RbacAuditCategory.ROLE_ASSIGNED:
      case RbacAuditCategory.ROLE_REMOVED:
        baseScore += 30; // Medium risk
        break;
      case RbacAuditCategory.ACCESS_ATTEMPT:
        baseScore += success ? 5 : 25; // Low risk if successful, medium if failed
        break;
      default:
        baseScore += 10;
    }

    // Effect-based scoring
    if (effect === PermissionEffect.DENY) {
      baseScore += 20;
    }

    // Success/failure scoring
    if (!success) {
      baseScore += 15; // Failed operations are more suspicious
    }

    return Math.min(baseScore, 100); // Cap at 100
  }

  static createAccessAttemptLog(
    userId: string,
    resource: Resource,
    action: Action,
    success: boolean,
    context: {
      ipAddress: string;
      userAgent?: string;
      sessionId?: string;
      companyId?: string;
      resourceId?: string;
      description: string;
      errorMessage?: string;
      permissions?: Record<string, any>;
    }
  ): Partial<RbacAuditLog> {
    return {
      category: RbacAuditCategory.ACCESS_ATTEMPT,
      userId,
      resource,
      action,
      effect: success ? PermissionEffect.ALLOW : PermissionEffect.DENY,
      companyId: context.companyId,
      resourceId: context.resourceId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      description: context.description,
      success,
      errorMessage: context.errorMessage,
      permissions: context.permissions,
      context: {
        timestamp: new Date().toISOString(),
        ...context,
      },
      riskScore: RbacAuditLog.calculateRiskScore(
        RbacAuditCategory.ACCESS_ATTEMPT,
        success ? PermissionEffect.ALLOW : PermissionEffect.DENY,
        success
      ),
    };
  }
}