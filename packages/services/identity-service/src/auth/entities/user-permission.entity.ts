import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { Resource, Action, PermissionScope, PermissionEffect } from '@sabs/common';
import { User } from '../../users/entities/user.entity';
import { Permission } from './permission.entity';

@Entity('user_permissions')
@Index(['userId', 'resource', 'action'])
@Index(['userId', 'permissionId'])
@Index(['effect'])
@Unique(['userId', 'permissionId'])
export class UserPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'permission_id', nullable: true })
  permissionId: string; // Reference to system permission

  @Column({ 
    type: 'enum', 
    enum: Resource,
    name: 'resource'
  })
  resource: Resource;

  @Column({ 
    type: 'enum', 
    enum: Action,
    name: 'action'
  })
  action: Action;

  @Column({ 
    type: 'enum', 
    enum: PermissionScope,
    name: 'scope',
    default: PermissionScope.PERSONAL
  })
  scope: PermissionScope;

  @Column({ 
    type: 'enum', 
    enum: PermissionEffect,
    name: 'effect',
    default: PermissionEffect.ALLOW
  })
  effect: PermissionEffect;

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string; // Specific resource ID

  @Column({ type: 'json', nullable: true })
  conditions: Record<string, any>;

  @Column({ name: 'granted_by', nullable: true })
  grantedBy: string; // User ID who granted this permission

  @Column({ name: 'granted_reason', type: 'text', nullable: true })
  grantedReason: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_temporary', default: false })
  isTemporary: boolean;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, user => user.userPermissions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Permission, { nullable: true })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'granted_by' })
  grantedByUser: User;

  // Computed properties
  get isExpired(): boolean {
    return this.expiresAt && new Date() > this.expiresAt;
  }

  get isValid(): boolean {
    return this.isActive && !this.isExpired;
  }

  get isAllow(): boolean {
    return this.effect === PermissionEffect.ALLOW;
  }

  get isDeny(): boolean {
    return this.effect === PermissionEffect.DENY;
  }

  get permissionString(): string {
    return `${this.resource}:${this.action}:${this.scope}`;
  }

  get isOverride(): boolean {
    return !!this.permissionId; // Override of existing permission
  }

  get isCustomGrant(): boolean {
    return !this.permissionId; // Custom permission grant
  }

  // Business logic methods
  matches(resource: Resource, action: Action, scope?: PermissionScope): boolean {
    const resourceMatch = this.resource === resource;
    const actionMatch = this.action === action;
    const scopeMatch = !scope || this.scope === scope || this.scope === PermissionScope.GLOBAL;

    return resourceMatch && actionMatch && scopeMatch;
  }

  allowsAccessToResource(resourceId?: string): boolean {
    if (!this.isValid) {
      return false;
    }

    // If permission is resource-specific, check resource ID
    if (this.resourceId && resourceId && this.resourceId !== resourceId) {
      return false;
    }

    return this.isAllow;
  }

  evaluateConditions(context: Record<string, any>): boolean {
    if (!this.conditions) {
      return true;
    }

    // Simplified condition evaluation (same logic as Permission entity)
    for (const [key, value] of Object.entries(this.conditions)) {
      const contextValue = context[key];
      
      if (Array.isArray(value)) {
        if (!value.includes(contextValue)) {
          return false;
        }
      } else if (typeof value === 'object' && value.operator) {
        if (contextValue !== value.value) {
          return false;
        }
      } else if (contextValue !== value) {
        return false;
      }
    }

    return true;
  }

  setExpiration(duration: number): void {
    this.isTemporary = true;
    this.expiresAt = new Date(Date.now() + duration);
  }

  extend(additionalTime: number): void {
    if (this.expiresAt) {
      this.expiresAt = new Date(this.expiresAt.getTime() + additionalTime);
    } else {
      this.setExpiration(additionalTime);
    }
  }

  revoke(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  // Static factory methods
  static createTemporaryGrant(
    userId: string,
    resource: Resource,
    action: Action,
    scope: PermissionScope,
    durationMs: number,
    grantedBy: string,
    reason?: string,
    resourceId?: string
  ): Partial<UserPermission> {
    return {
      userId,
      resource,
      action,
      scope,
      effect: PermissionEffect.ALLOW,
      resourceId,
      grantedBy,
      grantedReason: reason,
      isActive: true,
      isTemporary: true,
      expiresAt: new Date(Date.now() + durationMs),
    };
  }

  static createPermanentGrant(
    userId: string,
    resource: Resource,
    action: Action,
    scope: PermissionScope,
    grantedBy: string,
    reason?: string,
    resourceId?: string
  ): Partial<UserPermission> {
    return {
      userId,
      resource,
      action,
      scope,
      effect: PermissionEffect.ALLOW,
      resourceId,
      grantedBy,
      grantedReason: reason,
      isActive: true,
      isTemporary: false,
    };
  }

  static createDenyOverride(
    userId: string,
    permissionId: string,
    grantedBy: string,
    reason: string
  ): Partial<UserPermission> {
    return {
      userId,
      permissionId,
      effect: PermissionEffect.DENY,
      grantedBy,
      grantedReason: reason,
      isActive: true,
      isTemporary: false,
    };
  }

  static createResourceSpecificGrant(
    userId: string,
    resource: Resource,
    action: Action,
    resourceId: string,
    grantedBy: string,
    reason?: string,
    duration?: number
  ): Partial<UserPermission> {
    const grant = UserPermission.createPermanentGrant(
      userId,
      resource,
      action,
      PermissionScope.ASSIGNED,
      grantedBy,
      reason,
      resourceId
    );

    if (duration) {
      grant.isTemporary = true;
      grant.expiresAt = new Date(Date.now() + duration);
    }

    return grant;
  }
}