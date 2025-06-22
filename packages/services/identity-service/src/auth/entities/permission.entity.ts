import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, Index } from 'typeorm';
import { Resource, Action, PermissionScope } from '@sabs/common';
import { Role } from './role.entity';

@Entity('permissions')
@Index(['resource', 'action', 'scope'])
@Index(['resource', 'action'])
@Index(['scope'])
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

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
    default: PermissionScope.COMPANY
  })
  scope: PermissionScope;

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string; // Specific resource ID (for resource-level permissions)

  @Column({ type: 'json', nullable: true })
  conditions: Record<string, any>; // Additional conditions for permission

  @Column({ name: 'is_system', default: false })
  isSystem: boolean; // System-defined permission (cannot be deleted)

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'priority', default: 0 })
  priority: number; // Higher priority permissions override lower ones

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[];

  // Computed properties
  get permissionString(): string {
    return `${this.resource}:${this.action}:${this.scope}`;
  }

  get isGlobal(): boolean {
    return this.scope === PermissionScope.GLOBAL;
  }

  get isCompanyScoped(): boolean {
    return this.scope === PermissionScope.COMPANY;
  }

  get isPersonalScoped(): boolean {
    return this.scope === PermissionScope.PERSONAL;
  }

  // Business logic methods
  matches(resource: Resource, action: Action, scope?: PermissionScope): boolean {
    const resourceMatch = this.resource === resource || this.resource === '*' as any;
    const actionMatch = this.action === action || this.action === '*' as any;
    const scopeMatch = !scope || this.scope === scope || this.isGlobal;

    return resourceMatch && actionMatch && scopeMatch;
  }

  allowsAccess(resourceId?: string): boolean {
    if (!this.isActive) {
      return false;
    }

    // If permission is resource-specific, check resource ID
    if (this.resourceId && resourceId && this.resourceId !== resourceId) {
      return false;
    }

    return true;
  }

  evaluateConditions(context: Record<string, any>): boolean {
    if (!this.conditions) {
      return true;
    }

    // Evaluate all conditions (simplified version)
    for (const [key, value] of Object.entries(this.conditions)) {
      const contextValue = context[key];
      
      if (Array.isArray(value)) {
        if (!value.includes(contextValue)) {
          return false;
        }
      } else if (typeof value === 'object' && value.operator) {
        // Complex condition evaluation would go here
        // For now, simple equality check
        if (contextValue !== value.value) {
          return false;
        }
      } else if (contextValue !== value) {
        return false;
      }
    }

    return true;
  }

  static createPermissionString(resource: Resource, action: Action, scope: PermissionScope): string {
    return `${resource}:${action}:${scope}`;
  }

  static parsePermissionString(permissionString: string): {
    resource: Resource;
    action: Action;
    scope: PermissionScope;
  } | null {
    const parts = permissionString.split(':');
    if (parts.length !== 3) {
      return null;
    }

    const [resource, action, scope] = parts;
    return {
      resource: resource as Resource,
      action: action as Action,
      scope: scope as PermissionScope,
    };
  }
}