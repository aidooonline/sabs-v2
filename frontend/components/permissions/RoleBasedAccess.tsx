'use client';

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';

// Permission categories and actions
interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'workflow' | 'user_management' | 'system' | 'reporting' | 'configuration';
  actions: PermissionAction[];
  dependencies?: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface PermissionAction {
  id: string;
  name: string;
  description: string;
  scope: 'own' | 'team' | 'company' | 'global';
  conditions?: PermissionCondition[];
}

interface PermissionCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  permissions: RolePermission[];
  inheritsFrom?: string[];
  isSystemRole: boolean;
  isActive: boolean;
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    userCount: number;
    maxUsers?: number;
  };
}

interface RolePermission {
  permissionId: string;
  actions: string[];
  scope: 'own' | 'team' | 'company' | 'global';
  conditions?: PermissionCondition[];
  restrictions?: {
    maxAmount?: number;
    timeRestrictions?: {
      startTime: string;
      endTime: string;
      timezone: string;
    };
    ipWhitelist?: string[];
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  directPermissions: RolePermission[];
  isActive: boolean;
  lastLogin?: string;
  metadata: {
    department: string;
    manager?: string;
    delegations: Delegation[];
  };
}

interface UserRole {
  roleId: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
  conditions?: PermissionCondition[];
}

interface Delegation {
  id: string;
  fromUserId: string;
  toUserId: string;
  permissions: string[];
  startDate: string;
  endDate: string;
  reason: string;
  isActive: boolean;
  approvedBy?: string;
}

interface RoleBasedAccessProps {
  currentUser: User;
  onPermissionChange?: (userId: string, permissions: RolePermission[]) => void;
  onRoleAssignment?: (userId: string, roleId: string, assignedBy: string) => void;
  showAdvancedFeatures?: boolean;
}

// Context for role-based access
interface RBACContext {
  hasPermission: (permissionId: string, action: string, resource?: any) => boolean;
  getUserRoles: (userId: string) => Role[];
  getEffectivePermissions: (userId: string) => RolePermission[];
  canDelegate: (fromUserId: string, toUserId: string, permissions: string[]) => boolean;
  checkAccessRestrictions: (userId: string, action: string) => boolean;
}

const RBACContext = createContext<RBACContext | null>(null);

// Permission definitions
const PERMISSION_DEFINITIONS: Permission[] = [
  {
    id: 'workflow_view',
    name: 'View Workflows',
    description: 'View approval workflows and their details',
    category: 'workflow',
    riskLevel: 'low',
    actions: [
      { id: 'view_own', name: 'View Own', description: 'View workflows assigned to user', scope: 'own' },
      { id: 'view_team', name: 'View Team', description: 'View team workflows', scope: 'team' },
      { id: 'view_all', name: 'View All', description: 'View all company workflows', scope: 'company' }
    ]
  },
  {
    id: 'workflow_approve',
    name: 'Approve Workflows',
    description: 'Approve or reject approval workflows',
    category: 'workflow',
    riskLevel: 'high',
    dependencies: ['workflow_view'],
    actions: [
      { 
        id: 'approve_basic', 
        name: 'Basic Approval', 
        description: 'Approve workflows up to ₵1,000', 
        scope: 'own',
        conditions: [{ field: 'amount', operator: 'less_than', value: 1000 }]
      },
      { 
        id: 'approve_standard', 
        name: 'Standard Approval', 
        description: 'Approve workflows up to ₵10,000', 
        scope: 'team',
        conditions: [{ field: 'amount', operator: 'less_than', value: 10000 }]
      },
      { 
        id: 'approve_high_value', 
        name: 'High Value Approval', 
        description: 'Approve workflows up to ₵100,000', 
        scope: 'company',
        conditions: [{ field: 'amount', operator: 'less_than', value: 100000 }]
      },
      { 
        id: 'approve_unlimited', 
        name: 'Unlimited Approval', 
        description: 'Approve workflows of any amount', 
        scope: 'global'
      }
    ]
  },
  {
    id: 'workflow_escalate',
    name: 'Escalate Workflows',
    description: 'Escalate workflows to higher authorities',
    category: 'workflow',
    riskLevel: 'medium',
    dependencies: ['workflow_view'],
    actions: [
      { id: 'escalate_internal', name: 'Internal Escalation', description: 'Escalate within team', scope: 'team' },
      { id: 'escalate_external', name: 'External Escalation', description: 'Escalate to other departments', scope: 'company' }
    ]
  },
  {
    id: 'workflow_override',
    name: 'Override Workflows',
    description: 'Override system decisions and policies',
    category: 'workflow',
    riskLevel: 'critical',
    dependencies: ['workflow_approve'],
    actions: [
      { id: 'override_system', name: 'System Override', description: 'Override automated decisions', scope: 'company' },
      { id: 'override_policy', name: 'Policy Override', description: 'Override policy restrictions', scope: 'global' }
    ]
  },
  {
    id: 'user_management',
    name: 'User Management',
    description: 'Manage users and their access',
    category: 'user_management',
    riskLevel: 'high',
    actions: [
      { id: 'view_users', name: 'View Users', description: 'View user information', scope: 'team' },
      { id: 'create_users', name: 'Create Users', description: 'Create new users', scope: 'company' },
      { id: 'modify_users', name: 'Modify Users', description: 'Modify user information', scope: 'company' },
      { id: 'deactivate_users', name: 'Deactivate Users', description: 'Deactivate users', scope: 'company' }
    ]
  },
  {
    id: 'role_management',
    name: 'Role Management',
    description: 'Manage roles and permissions',
    category: 'user_management',
    riskLevel: 'critical',
    dependencies: ['user_management'],
    actions: [
      { id: 'view_roles', name: 'View Roles', description: 'View role definitions', scope: 'company' },
      { id: 'create_roles', name: 'Create Roles', description: 'Create custom roles', scope: 'global' },
      { id: 'modify_roles', name: 'Modify Roles', description: 'Modify role permissions', scope: 'global' },
      { id: 'assign_roles', name: 'Assign Roles', description: 'Assign roles to users', scope: 'company' }
    ]
  },
  {
    id: 'system_configuration',
    name: 'System Configuration',
    description: 'Configure system settings',
    category: 'configuration',
    riskLevel: 'critical',
    actions: [
      { id: 'view_config', name: 'View Configuration', description: 'View system configuration', scope: 'global' },
      { id: 'modify_config', name: 'Modify Configuration', description: 'Modify system settings', scope: 'global' }
    ]
  },
  {
    id: 'reporting',
    name: 'Reporting',
    description: 'Access reports and analytics',
    category: 'reporting',
    riskLevel: 'low',
    actions: [
      { id: 'view_basic_reports', name: 'Basic Reports', description: 'View basic reports', scope: 'own' },
      { id: 'view_team_reports', name: 'Team Reports', description: 'View team reports', scope: 'team' },
      { id: 'view_company_reports', name: 'Company Reports', description: 'View company-wide reports', scope: 'company' },
      { id: 'export_reports', name: 'Export Reports', description: 'Export report data', scope: 'company' }
    ]
  }
];

// Default role definitions
const DEFAULT_ROLES: Role[] = [
  {
    id: 'clerk',
    name: 'Clerk',
    description: 'Basic approval clerk with limited permissions',
    level: 1,
    isSystemRole: true,
    isActive: true,
    permissions: [
      { permissionId: 'workflow_view', actions: ['view_own'], scope: 'own' },
      { permissionId: 'workflow_approve', actions: ['approve_basic'], scope: 'own' },
      { permissionId: 'workflow_escalate', actions: ['escalate_internal'], scope: 'team' },
      { permissionId: 'reporting', actions: ['view_basic_reports'], scope: 'own' }
    ],
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'system',
      userCount: 0
    }
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Team manager with supervisory permissions',
    level: 2,
    isSystemRole: true,
    isActive: true,
    inheritsFrom: ['clerk'],
    permissions: [
      { permissionId: 'workflow_view', actions: ['view_team'], scope: 'team' },
      { permissionId: 'workflow_approve', actions: ['approve_standard'], scope: 'team' },
      { permissionId: 'workflow_escalate', actions: ['escalate_external'], scope: 'company' },
      { permissionId: 'user_management', actions: ['view_users'], scope: 'team' },
      { permissionId: 'reporting', actions: ['view_team_reports'], scope: 'team' }
    ],
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'system',
      userCount: 0
    }
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Company administrator with elevated permissions',
    level: 3,
    isSystemRole: true,
    isActive: true,
    inheritsFrom: ['manager'],
    permissions: [
      { permissionId: 'workflow_view', actions: ['view_all'], scope: 'company' },
      { permissionId: 'workflow_approve', actions: ['approve_high_value'], scope: 'company' },
      { permissionId: 'workflow_override', actions: ['override_system'], scope: 'company' },
      { permissionId: 'user_management', actions: ['create_users', 'modify_users', 'deactivate_users'], scope: 'company' },
      { permissionId: 'role_management', actions: ['view_roles', 'assign_roles'], scope: 'company' },
      { permissionId: 'reporting', actions: ['view_company_reports', 'export_reports'], scope: 'company' }
    ],
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'system',
      userCount: 0
    }
  },
  {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'System super administrator with all permissions',
    level: 4,
    isSystemRole: true,
    isActive: true,
    inheritsFrom: ['admin'],
    permissions: [
      { permissionId: 'workflow_approve', actions: ['approve_unlimited'], scope: 'global' },
      { permissionId: 'workflow_override', actions: ['override_policy'], scope: 'global' },
      { permissionId: 'role_management', actions: ['create_roles', 'modify_roles'], scope: 'global' },
      { permissionId: 'system_configuration', actions: ['view_config', 'modify_config'], scope: 'global' }
    ],
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'system',
      userCount: 0,
      maxUsers: 3
    }
  }
];

export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  currentUser,
  onPermissionChange,
  onRoleAssignment,
  showAdvancedFeatures = false
}) => {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [permissions] = useState<Permission[]>(PERMISSION_DEFINITIONS);
  const [users, setUsers] = useState<User[]>([currentUser]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleMatrix, setShowRoleMatrix] = useState(false);
  const [showDelegationModal, setShowDelegationModal] = useState(false);

  // Calculate effective permissions for a user
  const getEffectivePermissions = useCallback((userId: string): RolePermission[] => {
    const user = users.find(u => u.id === userId);
    if (!user) return [];

    const effectivePermissions: Map<string, RolePermission> = new Map();

    // Start with direct permissions
    user.directPermissions.forEach(perm => {
      effectivePermissions.set(`${perm.permissionId}_${perm.scope}`, perm);
    });

    // Add role-based permissions
    user.roles.forEach(userRole => {
      if (!userRole.isActive) return;
      
      const role = roles.find(r => r.id === userRole.roleId);
      if (!role || !role.isActive) return;

      // Get all permissions from role hierarchy
      const rolePermissions = getRolePermissions(role);
      rolePermissions.forEach(perm => {
        const key = `${perm.permissionId}_${perm.scope}`;
        const existing = effectivePermissions.get(key);
        
        if (!existing || isHigherScope(perm.scope, existing.scope)) {
          effectivePermissions.set(key, perm);
        }
      });
    });

    // Add delegated permissions
    const now = new Date();
    user.metadata.delegations.forEach(delegation => {
      if (!delegation.isActive) return;
      if (new Date(delegation.startDate) > now || new Date(delegation.endDate) < now) return;

      delegation.permissions.forEach(permId => {
        // Find the permission in the delegator's permissions
        const delegator = users.find(u => u.id === delegation.fromUserId);
        if (delegator) {
          const delegatorPerms = getEffectivePermissions(delegation.fromUserId);
          const delegatedPerm = delegatorPerms.find(p => p.permissionId === permId);
          if (delegatedPerm) {
            effectivePermissions.set(`${delegatedPerm.permissionId}_${delegatedPerm.scope}`, delegatedPerm);
          }
        }
      });
    });

    return Array.from(effectivePermissions.values());
  }, [users, roles]);

  // Get permissions from role hierarchy
  const getRolePermissions = useCallback((role: Role): RolePermission[] => {
    const allPermissions: RolePermission[] = [...role.permissions];

    // Add inherited permissions
    if (role.inheritsFrom) {
      role.inheritsFrom.forEach(parentRoleId => {
        const parentRole = roles.find(r => r.id === parentRoleId);
        if (parentRole) {
          const parentPermissions = getRolePermissions(parentRole);
          allPermissions.push(...parentPermissions);
        }
      });
    }

    return allPermissions;
  }, [roles]);

  // Check if scope A is higher than scope B
  const isHigherScope = useCallback((scopeA: string, scopeB: string): boolean => {
    const scopeHierarchy = { own: 1, team: 2, company: 3, global: 4 };
    return (scopeHierarchy[scopeA as keyof typeof scopeHierarchy] || 0) > 
           (scopeHierarchy[scopeB as keyof typeof scopeHierarchy] || 0);
  }, []);

  // Check if user has permission
  const hasPermission = useCallback((
    userId: string, 
    permissionId: string, 
    action: string, 
    resource?: any
  ): boolean => {
    const userPermissions = getEffectivePermissions(userId);
    const permission = userPermissions.find(p => p.permissionId === permissionId);
    
    if (!permission || !permission.actions.includes(action)) {
      return false;
    }

    // Check conditions
    if (permission.conditions && resource) {
      const conditionsMet = permission.conditions.every(condition => {
        const resourceValue = resource[condition.field];
        switch (condition.operator) {
          case 'equals':
            return resourceValue === condition.value;
          case 'greater_than':
            return resourceValue > condition.value;
          case 'less_than':
            return resourceValue < condition.value;
          case 'in':
            return Array.isArray(condition.value) && condition.value.includes(resourceValue);
          case 'not_in':
            return Array.isArray(condition.value) && !condition.value.includes(resourceValue);
          default:
            return true;
        }
      });
      
      if (!conditionsMet) return false;
    }

    // Check restrictions
    if (permission.restrictions) {
      if (permission.restrictions.maxAmount && resource?.amount > permission.restrictions.maxAmount) {
        return false;
      }

      if (permission.restrictions.timeRestrictions) {
        const now = new Date();
        const userTime = new Date(now.toLocaleString('en-US', { 
          timeZone: permission.restrictions.timeRestrictions.timezone 
        }));
        const currentTime = userTime.getHours() * 100 + userTime.getMinutes();
        const startTime = parseInt(permission.restrictions.timeRestrictions.startTime.replace(':', ''));
        const endTime = parseInt(permission.restrictions.timeRestrictions.endTime.replace(':', ''));
        
        if (currentTime < startTime || currentTime > endTime) {
          return false;
        }
      }
    }

    return true;
  }, [getEffectivePermissions]);

  // Check if user can delegate permissions
  const canDelegate = useCallback((
    fromUserId: string, 
    toUserId: string, 
    permissionIds: string[]
  ): boolean => {
    const fromUser = users.find(u => u.id === fromUserId);
    const toUser = users.find(u => u.id === toUserId);
    
    if (!fromUser || !toUser) return false;

    const fromPermissions = getEffectivePermissions(fromUserId);
    
    return permissionIds.every(permId => {
      const permission = fromPermissions.find(p => p.permissionId === permId);
      return permission && permission.scope !== 'own'; // Can't delegate personal permissions
    });
  }, [users, getEffectivePermissions]);

  // Get permission matrix for display
  const getPermissionMatrix = useMemo(() => {
    return roles.map(role => ({
      role,
      permissions: permissions.map(permission => ({
        permission,
        granted: getRolePermissions(role).some(rp => rp.permissionId === permission.id),
        actions: getRolePermissions(role)
          .filter(rp => rp.permissionId === permission.id)
          .flatMap(rp => rp.actions)
      }))
    }));
  }, [roles, permissions, getRolePermissions]);

  // Get risk level color
  const getRiskLevelColor = useCallback((riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Get scope badge color
  const getScopeColor = useCallback((scope: string) => {
    switch (scope) {
      case 'own': return 'bg-blue-100 text-blue-800';
      case 'team': return 'bg-green-100 text-green-800';
      case 'company': return 'bg-purple-100 text-purple-800';
      case 'global': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // RBAC Context value
  const rbacContextValue: RBACContext = {
    hasPermission: (permissionId: string, action: string, resource?: any) => 
      hasPermission(currentUser.id, permissionId, action, resource),
    getUserRoles: (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return [];
      return user.roles.map(ur => roles.find(r => r.id === ur.roleId)).filter(Boolean) as Role[];
    },
    getEffectivePermissions,
    canDelegate,
    checkAccessRestrictions: (userId: string, action: string) => {
      // Implementation for checking IP restrictions, time restrictions, etc.
      return true;
    }
  };

  return (
    <RBACContext.Provider value={rbacContextValue}>
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Role-Based Access Control</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage user roles, permissions, and access controls
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowRoleMatrix(!showRoleMatrix)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
                Permission Matrix
              </button>
              
              {showAdvancedFeatures && (
                <button
                  onClick={() => setShowDelegationModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Delegate Permissions
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Roles Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Roles</h3>
              <div className="space-y-3">
                {roles.map(role => (
                  <div
                    key={role.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRole?.id === role.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{role.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Level {role.level}
                          </span>
                          {role.isSystemRole && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              System Role
                            </span>
                          )}
                          {role.metadata.maxUsers && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Limited ({role.metadata.userCount}/{role.metadata.maxUsers})
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {role.metadata.userCount} users
                        </div>
                        <div className="text-xs text-gray-500">
                          {role.permissions.length} permissions
                        </div>
                      </div>
                    </div>

                    {/* Role hierarchy */}
                    {role.inheritsFrom && role.inheritsFrom.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600">
                          Inherits from: {role.inheritsFrom.map(parentId => {
                            const parentRole = roles.find(r => r.id === parentId);
                            return parentRole?.name;
                          }).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Role Details */}
            <div>
              {selectedRole ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {selectedRole.name} Permissions
                  </h3>
                  
                  <div className="space-y-4">
                    {getRolePermissions(selectedRole).map((rolePermission, index) => {
                      const permission = permissions.find(p => p.id === rolePermission.permissionId);
                      if (!permission) return null;

                      return (
                        <div key={`${rolePermission.permissionId}_${index}`} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{permission.name}</h4>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(permission.riskLevel)}`}>
                                {permission.riskLevel}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScopeColor(rolePermission.scope)}`}>
                                {rolePermission.scope}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{permission.description}</p>
                          
                          <div className="space-y-2">
                            <div>
                              <span className="text-xs font-medium text-gray-700">Actions:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {rolePermission.actions.map(actionId => {
                                  const action = permission.actions.find(a => a.id === actionId);
                                  return action ? (
                                    <span key={actionId} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                      {action.name}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                            
                            {rolePermission.conditions && rolePermission.conditions.length > 0 && (
                              <div>
                                <span className="text-xs font-medium text-gray-700">Conditions:</span>
                                <div className="mt-1 space-y-1">
                                  {rolePermission.conditions.map((condition, idx) => (
                                    <div key={idx} className="text-xs text-gray-600">
                                      {condition.field} {condition.operator} {JSON.stringify(condition.value)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {rolePermission.restrictions && (
                              <div>
                                <span className="text-xs font-medium text-gray-700">Restrictions:</span>
                                <div className="mt-1 space-y-1">
                                  {rolePermission.restrictions.maxAmount && (
                                    <div className="text-xs text-gray-600">
                                      Max Amount: ₵{rolePermission.restrictions.maxAmount.toLocaleString()}
                                    </div>
                                  )}
                                  {rolePermission.restrictions.timeRestrictions && (
                                    <div className="text-xs text-gray-600">
                                      Time: {rolePermission.restrictions.timeRestrictions.startTime} - {rolePermission.restrictions.timeRestrictions.endTime}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No role selected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a role to view its permissions and configuration.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Permission Matrix Modal */}
        {showRoleMatrix && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Permission Matrix</h3>
                <button
                  onClick={() => setShowRoleMatrix(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permission
                      </th>
                      {roles.map(role => (
                        <th key={role.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {role.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {permissions.map(permission => (
                      <tr key={permission.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                            <div className="text-sm text-gray-500">{permission.description}</div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRiskLevelColor(permission.riskLevel)}`}>
                              {permission.riskLevel}
                            </span>
                          </div>
                        </td>
                        {getPermissionMatrix.map(({ role, permissions: rolePerms }) => {
                          const rolePerm = rolePerms.find(rp => rp.permission.id === permission.id);
                          return (
                            <td key={role.id} className="px-6 py-4 whitespace-nowrap text-center">
                              {rolePerm?.granted ? (
                                <div>
                                  <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {rolePerm.actions.slice(0, 2).join(', ')}
                                    {rolePerm.actions.length > 2 && ` +${rolePerm.actions.length - 2}`}
                                  </div>
                                </div>
                              ) : (
                                <svg className="w-5 h-5 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </RBACContext.Provider>
  );
};

// Hook to use RBAC context
export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within a RoleBasedAccess provider');
  }
  return context;
};

// Permission check component
export const PermissionGate: React.FC<{
  permission: string;
  action: string;
  resource?: any;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ permission, action, resource, fallback, children }) => {
  const { hasPermission } = useRBAC();
  
  if (hasPermission(permission, action, resource)) {
    return <>{children}</>;
  }
  
  return <>{fallback || null}</>;
};