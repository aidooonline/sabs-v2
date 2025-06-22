import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { PermissionEffect, PolicyCondition, ContextType, Resource, Action } from '@sabs/common';
import { Role } from './role.entity';
import { User } from '../../users/entities/user.entity';

export interface PolicyRule {
  effect: PermissionEffect;
  resource: Resource | string;
  action: Action | string;
  conditions?: PolicyConditionRule[];
}

export interface PolicyConditionRule {
  field: string;
  operator: PolicyCondition;
  value: any;
  contextType: ContextType;
}

@Entity('policies')
@Index(['name'])
@Index(['resource', 'action'])
@Index(['effect'])
@Index(['companyId'])
@Index(['isActive'])
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ 
    type: 'enum', 
    enum: PermissionEffect,
    name: 'effect'
  })
  effect: PermissionEffect;

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

  @Column({ type: 'json' })
  rules: PolicyRule[];

  @Column({ type: 'json', nullable: true })
  conditions: PolicyConditionRule[];

  @Column({ name: 'company_id', nullable: true })
  companyId: string; // Company-specific policy (null for system policies)

  @Column({ name: 'role_id', nullable: true })
  roleId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean; // System-defined policy (cannot be deleted)

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'priority', default: 0 })
  priority: number; // Higher priority policies override lower ones

  @Column({ name: 'valid_from', type: 'timestamp', nullable: true })
  validFrom: Date;

  @Column({ name: 'valid_until', type: 'timestamp', nullable: true })
  validUntil: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Role, role => role.policies, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Computed properties
  get isAllow(): boolean {
    return this.effect === PermissionEffect.ALLOW;
  }

  get isDeny(): boolean {
    return this.effect === PermissionEffect.DENY;
  }

  get isEffectivelyActive(): boolean {
    return this.isActive && this.isValidAtTime(new Date());
  }

  get isRolePolicy(): boolean {
    return !!this.roleId;
  }

  get isUserPolicy(): boolean {
    return !!this.userId;
  }

  get isGlobalPolicy(): boolean {
    return !this.companyId;
  }

  // Business logic methods
  isValidAtTime(time: Date): boolean {
    if (this.validFrom && time < this.validFrom) {
      return false;
    }
    
    if (this.validUntil && time > this.validUntil) {
      return false;
    }
    
    return true;
  }

  matches(resource: Resource, action: Action): boolean {
    const resourceMatch = this.resource === resource || this.resource === '*' as any;
    const actionMatch = this.action === action || this.action === '*' as any;
    
    return resourceMatch && actionMatch;
  }

  evaluateConditions(context: Record<string, any>): boolean {
    if (!this.conditions || this.conditions.length === 0) {
      return true;
    }

    return this.conditions.every(condition => 
      this.evaluateCondition(condition, context)
    );
  }

  private evaluateCondition(condition: PolicyConditionRule, context: Record<string, any>): boolean {
    const contextValue = this.getContextValue(condition.contextType, condition.field, context);
    const expectedValue = condition.value;

    switch (condition.operator) {
      case PolicyCondition.EQUALS:
        return contextValue === expectedValue;
      
      case PolicyCondition.NOT_EQUALS:
        return contextValue !== expectedValue;
      
      case PolicyCondition.IN:
        return Array.isArray(expectedValue) && expectedValue.includes(contextValue);
      
      case PolicyCondition.NOT_IN:
        return Array.isArray(expectedValue) && !expectedValue.includes(contextValue);
      
      case PolicyCondition.GREATER_THAN:
        return contextValue > expectedValue;
      
      case PolicyCondition.LESS_THAN:
        return contextValue < expectedValue;
      
      case PolicyCondition.CONTAINS:
        return String(contextValue).includes(String(expectedValue));
      
      case PolicyCondition.STARTS_WITH:
        return String(contextValue).startsWith(String(expectedValue));
      
      case PolicyCondition.ENDS_WITH:
        return String(contextValue).endsWith(String(expectedValue));
      
      case PolicyCondition.EXISTS:
        return contextValue !== undefined && contextValue !== null;
      
      case PolicyCondition.NOT_EXISTS:
        return contextValue === undefined || contextValue === null;
      
      case PolicyCondition.TIME_BETWEEN:
        if (!Array.isArray(expectedValue) || expectedValue.length !== 2) return false;
        const [start, end] = expectedValue;
        const currentTime = new Date(contextValue);
        return currentTime >= new Date(start) && currentTime <= new Date(end);
      
      case PolicyCondition.IP_IN_RANGE:
        return this.isIpInRange(contextValue, expectedValue);
      
      case PolicyCondition.HAS_ROLE:
        const userRoles = context.user?.roles || [];
        return userRoles.includes(expectedValue);
      
      case PolicyCondition.IS_OWNER:
        return context.user?.id === context.resource?.ownerId;
      
      case PolicyCondition.SAME_COMPANY:
        return context.user?.companyId === context.resource?.companyId;
      
      default:
        return false;
    }
  }

  private getContextValue(contextType: ContextType, field: string, context: Record<string, any>): any {
    switch (contextType) {
      case ContextType.USER:
        return context.user?.[field];
      
      case ContextType.COMPANY:
        return context.company?.[field];
      
      case ContextType.RESOURCE:
        return context.resource?.[field];
      
      case ContextType.REQUEST:
        return context.request?.[field];
      
      case ContextType.TIME:
        return new Date();
      
      case ContextType.LOCATION:
        return context.location?.[field];
      
      case ContextType.SESSION:
        return context.session?.[field];
      
      default:
        return context[field];
    }
  }

  private isIpInRange(ip: string, range: string): boolean {
    // Simplified IP range check (would need a proper implementation)
    if (range.includes('/')) {
      // CIDR notation
      return this.isIpInCidr(ip, range);
    }
    
    if (range.includes('-')) {
      // Range notation (e.g., 192.168.1.1-192.168.1.100)
      const [start, end] = range.split('-');
      return this.isIpBetween(ip, start, end);
    }
    
    // Exact match
    return ip === range;
  }

  private isIpInCidr(ip: string, cidr: string): boolean {
    // Simplified CIDR check - would need proper implementation
    const [network, mask] = cidr.split('/');
    // Implementation would go here
    return ip.startsWith(network.split('.').slice(0, 2).join('.'));
  }

  private isIpBetween(ip: string, start: string, end: string): boolean {
    // Simplified IP range check - would need proper implementation
    return ip >= start && ip <= end;
  }

  evaluate(context: Record<string, any>): {
    allowed: boolean;
    effect: PermissionEffect;
    policy: Policy;
  } {
    if (!this.isActive) {
      return {
        allowed: false,
        effect: PermissionEffect.DENY,
        policy: this,
      };
    }

    const conditionsMatch = this.evaluateConditions(context);
    
    return {
      allowed: conditionsMatch && this.isAllow,
      effect: conditionsMatch ? this.effect : PermissionEffect.DENY,
      policy: this,
    };
  }

  static createTimeBasedPolicy(
    name: string,
    resource: Resource,
    action: Action,
    effect: PermissionEffect,
    validFrom: Date,
    validUntil: Date,
    companyId?: string
  ): Partial<Policy> {
    return {
      name,
      description: `Time-based policy for ${resource}:${action}`,
      effect,
      resource,
      action,
      rules: [{
        effect,
        resource,
        action,
        conditions: [{
          field: 'currentTime',
          operator: PolicyCondition.TIME_BETWEEN,
          value: [validFrom, validUntil],
          contextType: ContextType.TIME,
        }],
      }],
      validFrom,
      validUntil,
      companyId,
      isActive: true,
    };
  }

  static createOwnershipPolicy(
    name: string,
    resource: Resource,
    action: Action,
    companyId?: string
  ): Partial<Policy> {
    return {
      name,
      description: `Ownership-based policy for ${resource}:${action}`,
      effect: PermissionEffect.ALLOW,
      resource,
      action,
      rules: [{
        effect: PermissionEffect.ALLOW,
        resource,
        action,
        conditions: [{
          field: 'ownerId',
          operator: PolicyCondition.IS_OWNER,
          value: true,
          contextType: ContextType.RESOURCE,
        }],
      }],
      companyId,
      isActive: true,
    };
  }
}