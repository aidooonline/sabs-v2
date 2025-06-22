import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UserRole } from '@sabs/common';
import { Permission } from './permission.entity';
import { User } from '../../users/entities/user.entity';
import { Policy } from './policy.entity';

@Entity('roles')
@Index(['name'])
@Index(['roleType'])
@Index(['companyId'])
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ 
    type: 'enum', 
    enum: UserRole,
    name: 'role_type'
  })
  roleType: UserRole;

  @Column({ name: 'company_id', nullable: true })
  companyId: string; // Company-specific roles (null for system roles)

  @Column({ name: 'is_system', default: false })
  isSystem: boolean; // System-defined role (cannot be deleted)

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean; // Default role for new users of this type

  @Column({ name: 'priority', default: 0 })
  priority: number; // Role hierarchy priority

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Additional role metadata

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Role hierarchy relationships
  @ManyToOne(() => Role, role => role.childRoles, { nullable: true })
  @JoinColumn({ name: 'parent_role_id' })
  parentRole: Role;

  @OneToMany(() => Role, role => role.parentRole)
  childRoles: Role[];

  // Permission relationships
  @ManyToMany(() => Permission, permission => permission.roles, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  // Policy relationships
  @OneToMany(() => Policy, policy => policy.role)
  policies: Policy[];

  // User relationships
  @OneToMany(() => User, user => user.roleEntity)
  users: User[];

  // Computed properties
  get isGlobalRole(): boolean {
    return !this.companyId;
  }

  get isCompanyRole(): boolean {
    return !!this.companyId;
  }

  get permissionCount(): number {
    return this.permissions?.length || 0;
  }

  get userCount(): number {
    return this.users?.length || 0;
  }

  // Business logic methods
  hasPermission(permissionId: string): boolean {
    if (!this.permissions) return false;
    return this.permissions.some(p => p.id === permissionId);
  }

  hasPermissionFor(resource: string, action: string, scope?: string): boolean {
    if (!this.permissions) return false;
    
    return this.permissions.some(permission => 
      permission.matches(resource as any, action as any, scope as any)
    );
  }

  addPermission(permission: Permission): void {
    if (!this.permissions) {
      this.permissions = [];
    }
    
    if (!this.hasPermission(permission.id)) {
      this.permissions.push(permission);
    }
  }

  removePermission(permissionId: string): void {
    if (!this.permissions) return;
    
    this.permissions = this.permissions.filter(p => p.id !== permissionId);
  }

  getAllPermissions(): Permission[] {
    const allPermissions = [...(this.permissions || [])];
    
    // Include permissions from parent roles (inheritance)
    if (this.parentRole) {
      const parentPermissions = this.parentRole.getAllPermissions();
      parentPermissions.forEach(permission => {
        if (!allPermissions.some(p => p.id === permission.id)) {
          allPermissions.push(permission);
        }
      });
    }
    
    return allPermissions;
  }

  getEffectivePermissions(companyId?: string): Permission[] {
    const allPermissions = this.getAllPermissions();
    
    return allPermissions.filter(permission => {
      // Global permissions are always effective
      if (permission.isGlobal) return true;
      
      // Company-scoped permissions need matching company
      if (permission.isCompanyScoped && companyId) {
        return !permission.resourceId || permission.resourceId === companyId;
      }
      
      // Personal permissions are always effective (checked at runtime)
      if (permission.isPersonalScoped) return true;
      
      return false;
    });
  }

  canManageRole(targetRole: Role): boolean {
    // Super admin can manage all roles
    if (this.roleType === UserRole.SUPER_ADMIN) {
      return true;
    }
    
    // Company admin can manage roles within their company
    if (this.roleType === UserRole.COMPANY_ADMIN) {
      return targetRole.companyId === this.companyId && 
             targetRole.roleType !== UserRole.SUPER_ADMIN;
    }
    
    // Other roles cannot manage roles
    return false;
  }

  isHigherPriorityThan(otherRole: Role): boolean {
    return this.priority > otherRole.priority;
  }

  clone(newName: string, companyId?: string): Partial<Role> {
    return {
      name: newName,
      description: this.description,
      roleType: this.roleType,
      companyId: companyId || this.companyId,
      isSystem: false,
      isActive: true,
      isDefault: false,
      priority: this.priority,
      metadata: { ...this.metadata },
      permissions: this.permissions,
    };
  }

  static createDefaultRoleConfig(roleType: UserRole, companyId?: string): Partial<Role> {
    const configs = {
      [UserRole.SUPER_ADMIN]: {
        name: 'Super Administrator',
        description: 'Platform super administrator with full access',
        priority: 1000,
        isSystem: true,
        isDefault: true,
      },
      [UserRole.COMPANY_ADMIN]: {
        name: 'Company Administrator',
        description: 'Company administrator with full company access',
        priority: 800,
        isSystem: false,
        isDefault: true,
      },
      [UserRole.CLERK]: {
        name: 'Clerk',
        description: 'Clerk with cash management and reconciliation access',
        priority: 600,
        isSystem: false,
        isDefault: true,
      },
      [UserRole.FIELD_AGENT]: {
        name: 'Field Agent',
        description: 'Field agent with transaction processing access',
        priority: 400,
        isSystem: false,
        isDefault: true,
      },
    };

    return {
      ...configs[roleType],
      roleType,
      companyId,
      isActive: true,
    };
  }
}