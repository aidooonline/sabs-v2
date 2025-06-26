'use client';

import React, { useState, useEffect } from 'react';
import type { ApprovalWorkflow, ApprovalStage, WorkflowPermissions } from '../../../../types/approval';

interface HierarchyEnforcementProps {
  workflow: ApprovalWorkflow;
  permissions?: WorkflowPermissions;
  currentUserRole: string;
  currentUserId: string;
  onHierarchyUpdate: (hierarchyData: HierarchyUpdateData) => Promise<void>;
  isLoading?: boolean;
}

export interface HierarchyUpdateData {
  workflowId: string;
  action: 'delegate' | 'reassign' | 'escalate' | 'override_hierarchy';
  targetUserId?: string;
  targetRole?: string;
  delegation?: DelegationRequest;
  hierarchyOverride?: HierarchyOverride;
  justification: string;
  temporaryDelegation: boolean;
  delegationPeriod?: {
    startDate: string;
    endDate: string;
  };
  notifyStakeholders: boolean;
  auditReason: string;
}

interface DelegationRequest {
  delegateToUserId: string;
  delegateToUserName: string;
  delegateToRole: string;
  delegationType: 'temporary' | 'permanent' | 'specific_workflow';
  scope: 'single_workflow' | 'role_based' | 'department_wide';
  conditions: string[];
  authorityLevel: 'full' | 'limited' | 'review_only';
  expirationDate?: string;
  canSubDelegate: boolean;
}

interface HierarchyOverride {
  overrideType: 'emergency' | 'business_critical' | 'policy_exception';
  skipLevels: number;
  targetStage: ApprovalStage;
  businessJustification: string;
  riskAcknowledgment: string;
  approverOverride: boolean;
  complianceApproval: boolean;
}

interface HierarchyLevel {
  level: number;
  stage: ApprovalStage;
  role: string;
  title: string;
  description: string;
  authorityLimits: {
    maxAmount: number;
    requiresEscalation: boolean;
    canOverride: boolean;
  };
  requiredApprovers: number;
  timeoutHours: number;
}

interface UserRoleInfo {
  userId: string;
  userName: string;
  role: string;
  level: number;
  department: string;
  isAvailable: boolean;
  workload: number;
  delegations: ActiveDelegation[];
}

interface ActiveDelegation {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  scope: string;
  authorityLevel: string;
  expirationDate?: string;
  isActive: boolean;
}

export const HierarchyEnforcement: React.FC<HierarchyEnforcementProps> = ({
  workflow,
  permissions,
  currentUserRole,
  currentUserId,
  onHierarchyUpdate,
  isLoading = false
}) => {
  const [showDelegationModal, setShowDelegationModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [hierarchyData, setHierarchyData] = useState<HierarchyUpdateData>({
    workflowId: workflow.id,
    action: 'delegate',
    justification: '',
    temporaryDelegation: true,
    notifyStakeholders: true,
    auditReason: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableUsers, setAvailableUsers] = useState<UserRoleInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRoleInfo | null>(null);

  // Hierarchy configuration
  const hierarchyLevels: HierarchyLevel[] = [
    {
      level: 1,
      stage: 'clerk_review',
      role: 'clerk',
      title: 'Clerk Review',
      description: 'Initial verification and documentation review',
      authorityLimits: {
        maxAmount: 1000,
        requiresEscalation: true,
        canOverride: false
      },
      requiredApprovers: 1,
      timeoutHours: 2
    },
    {
      level: 2,
      stage: 'manager_review',
      role: 'manager',
      title: 'Manager Review',
      description: 'Supervisory approval and risk assessment',
      authorityLimits: {
        maxAmount: 10000,
        requiresEscalation: true,
        canOverride: true
      },
      requiredApprovers: 1,
      timeoutHours: 4
    },
    {
      level: 3,
      stage: 'admin_review',
      role: 'admin',
      title: 'Admin Review',
      description: 'High-value transaction and exception handling',
      authorityLimits: {
        maxAmount: 100000,
        requiresEscalation: false,
        canOverride: true
      },
      requiredApprovers: 1,
      timeoutHours: 8
    },
    {
      level: 4,
      stage: 'final_authorization',
      role: 'super_admin',
      title: 'Final Authorization',
      description: 'Ultimate approval authority for critical transactions',
      authorityLimits: {
        maxAmount: Infinity,
        requiresEscalation: false,
        canOverride: true
      },
      requiredApprovers: 1,
      timeoutHours: 24
    }
  ];

  // Mock user data - in real implementation, this would come from an API
  useEffect(() => {
    const mockUsers: UserRoleInfo[] = [
      {
        userId: 'user-1',
        userName: 'John Manager',
        role: 'manager',
        level: 2,
        department: 'Operations',
        isAvailable: true,
        workload: 5,
        delegations: []
      },
      {
        userId: 'user-2',
        userName: 'Sarah Admin',
        role: 'admin',
        level: 3,
        department: 'Compliance',
        isAvailable: true,
        workload: 3,
        delegations: []
      },
      {
        userId: 'user-3',
        userName: 'Mike Supervisor',
        role: 'manager',
        level: 2,
        department: 'Risk',
        isAvailable: false,
        workload: 8,
        delegations: [
          {
            id: 'del-1',
            fromUserId: 'user-3',
            fromUserName: 'Mike Supervisor',
            toUserId: 'user-1',
            toUserName: 'John Manager',
            scope: 'department_wide',
            authorityLevel: 'limited',
            expirationDate: '2025-01-25',
            isActive: true
          }
        ]
      }
    ];
    setAvailableUsers(mockUsers);
  }, []);

  const getCurrentLevel = (): HierarchyLevel | null => {
    return hierarchyLevels.find(level => level.stage === workflow.currentStage) || null;
  };

  const getNextLevel = (): HierarchyLevel | null => {
    const currentLevel = getCurrentLevel();
    if (!currentLevel) return null;
    return hierarchyLevels.find(level => level.level === currentLevel.level + 1) || null;
  };

  const canUserApproveAtStage = (stage: ApprovalStage): boolean => {
    const level = hierarchyLevels.find(l => l.stage === stage);
    if (!level) return false;

    // Check if user role matches required level
    return currentUserRole === level.role || 
           (level.role === 'manager' && ['admin', 'super_admin'].includes(currentUserRole)) ||
           (level.role === 'admin' && currentUserRole === 'super_admin');
  };

  const hasAuthorityForAmount = (amount: number): boolean => {
    const userLevel = hierarchyLevels.find(l => l.role === currentUserRole);
    return userLevel ? amount <= userLevel.authorityLimits.maxAmount : false;
  };

  const getEligibleDelegates = (): UserRoleInfo[] => {
    const currentLevel = getCurrentLevel();
    if (!currentLevel) return [];

    return availableUsers.filter(user => {
      // Can delegate to same level or higher
      return user.level >= currentLevel.level && 
             user.userId !== currentUserId &&
             user.isAvailable;
    });
  };

  const getWorkflowPath = (): HierarchyLevel[] => {
    const amount = workflow.withdrawalRequest.amount;
    const path: HierarchyLevel[] = [];

    for (const level of hierarchyLevels) {
      path.push(level);
      if (amount <= level.authorityLimits.maxAmount && !level.authorityLimits.requiresEscalation) {
        break;
      }
    }

    return path;
  };

  const handleInputChange = (field: keyof HierarchyUpdateData, value: any) => {
    setHierarchyData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateHierarchyAction = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!hierarchyData.justification.trim() || hierarchyData.justification.length < 50) {
      newErrors.justification = 'Justification must be at least 50 characters';
    }

    if (!hierarchyData.auditReason.trim() || hierarchyData.auditReason.length < 30) {
      newErrors.auditReason = 'Audit reason must be at least 30 characters';
    }

    if (hierarchyData.action === 'delegate' && !hierarchyData.targetUserId) {
      newErrors.targetUserId = 'Target user must be selected for delegation';
    }

    if (hierarchyData.temporaryDelegation && hierarchyData.delegationPeriod) {
      const startDate = new Date(hierarchyData.delegationPeriod.startDate);
      const endDate = new Date(hierarchyData.delegationPeriod.endDate);
      
      if (endDate <= startDate) {
        newErrors.delegationPeriod = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateHierarchyAction()) {
      try {
        await onHierarchyUpdate(hierarchyData);
        setShowDelegationModal(false);
        setShowOverrideModal(false);
        // Reset form
        setHierarchyData({
          workflowId: workflow.id,
          action: 'delegate',
          justification: '',
          temporaryDelegation: true,
          notifyStakeholders: true,
          auditReason: ''
        });
      } catch (error) {
        console.error('Hierarchy action failed:', error);
      }
    }
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const workflowPath = getWorkflowPath();
  const eligibleDelegates = getEligibleDelegates();

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900">Approval Hierarchy</h4>
            <p className="text-sm text-gray-600 mt-1">
              Workflow progression through organizational approval levels
            </p>
          </div>
        </div>

        {/* Workflow Path Visualization */}
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-900 mb-4">Approval Path</h5>
          <div className="flex items-center space-x-4 overflow-x-auto pb-4">
            {workflowPath.map((level, index) => (
              <div key={level.stage} className="flex items-center flex-shrink-0">
                <div className={`relative flex flex-col items-center ${
                  workflow.currentStage === level.stage ? 'text-blue-600' :
                  index < workflowPath.findIndex(l => l.stage === workflow.currentStage) ? 'text-green-600' :
                  'text-gray-400'
                }`}>
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-medium text-sm ${
                    workflow.currentStage === level.stage ? 'border-blue-600 bg-blue-50' :
                    index < workflowPath.findIndex(l => l.stage === workflow.currentStage) ? 'border-green-600 bg-green-50' :
                    'border-gray-300 bg-white'
                  }`}>
                    {level.level}
                  </div>
                  <div className="text-center mt-2 max-w-24">
                    <p className="text-xs font-medium truncate">{level.title}</p>
                    <p className="text-xs text-gray-500 truncate">{level.role}</p>
                  </div>
                  
                  {workflow.currentStage === level.stage && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Current
                      </span>
                    </div>
                  )}
                </div>
                
                {index < workflowPath.length - 1 && (
                  <div className={`w-8 h-1 mx-2 ${
                    index < workflowPath.findIndex(l => l.stage === workflow.currentStage) ? 'bg-green-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Stage Details */}
        {currentLevel && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-md font-medium text-gray-900">Current Stage: {currentLevel.title}</h5>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                canUserApproveAtStage(currentLevel.stage) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {canUserApproveAtStage(currentLevel.stage) ? 'Authorized' : 'Not Authorized'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Required Role</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{currentLevel.role}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Authority Limit</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  ${currentLevel.authorityLimits.maxAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Timeout</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{currentLevel.timeoutHours}h</p>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-sm text-gray-600">{currentLevel.description}</p>
            </div>

            {/* Authority Check */}
            {!hasAuthorityForAmount(workflow.withdrawalRequest.amount) && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-orange-600 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h6 className="text-sm font-medium text-orange-900">Amount Exceeds Authority</h6>
                    <p className="text-sm text-orange-800 mt-1">
                      Transaction amount (${workflow.withdrawalRequest.amount.toLocaleString()}) exceeds your approval authority. 
                      Escalation to {nextLevel?.title || 'higher level'} required.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {permissions?.canEscalate && nextLevel && (
            <button
              onClick={() => {
                setHierarchyData(prev => ({ ...prev, action: 'escalate', targetRole: nextLevel.role }));
                setShowDelegationModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              <span>Escalate to {nextLevel.title}</span>
            </button>
          )}

          {permissions?.canReassign && eligibleDelegates.length > 0 && (
            <button
              onClick={() => {
                setHierarchyData(prev => ({ ...prev, action: 'delegate' }));
                setShowDelegationModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>Delegate</span>
            </button>
          )}

          {permissions?.canReassign && (
            <button
              onClick={() => {
                setHierarchyData(prev => ({ ...prev, action: 'reassign' }));
                setShowDelegationModal(true);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>Reassign</span>
            </button>
          )}

          {permissions?.canOverride && (
            <button
              onClick={() => {
                setHierarchyData(prev => ({ ...prev, action: 'override_hierarchy' }));
                setShowOverrideModal(true);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Override Hierarchy</span>
            </button>
          )}
        </div>

        {/* Active Delegations */}
        {availableUsers.some(user => user.delegations.length > 0) && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Active Delegations</h5>
            <div className="space-y-2">
              {availableUsers.flatMap(user => user.delegations.filter(d => d.isActive)).map((delegation) => (
                <div key={delegation.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {delegation.fromUserName} → {delegation.toUserName}
                    </p>
                    <p className="text-xs text-blue-700">
                      {delegation.scope} | {delegation.authorityLevel} authority
                      {delegation.expirationDate && ` | Expires: ${new Date(delegation.expirationDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delegation/Reassignment Modal */}
      {showDelegationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {hierarchyData.action === 'escalate' ? 'Escalate Workflow' :
                 hierarchyData.action === 'delegate' ? 'Delegate Approval' :
                 'Reassign Workflow'}
              </h3>
              <button
                onClick={() => setShowDelegationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* User Selection */}
              {hierarchyData.action !== 'escalate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select User <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {eligibleDelegates.map((user) => (
                      <div
                        key={user.userId}
                        onClick={() => {
                          setSelectedUser(user);
                          handleInputChange('targetUserId', user.userId);
                          handleInputChange('targetRole', user.role);
                        }}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          hierarchyData.targetUserId === user.userId
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{user.userName}</h4>
                            <p className="text-sm text-gray-600">{user.role} - {user.department}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isAvailable ? 'Available' : 'Busy'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">Workload: {user.workload}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.targetUserId && (
                    <span className="text-xs text-red-500">{errors.targetUserId}</span>
                  )}
                </div>
              )}

              {/* Justification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={hierarchyData.justification}
                  onChange={(e) => handleInputChange('justification', e.target.value)}
                  rows={3}
                  className={`block w-full border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.justification ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Provide justification for this hierarchy action (minimum 50 characters)..."
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {hierarchyData.justification.length} / 50 minimum characters
                  </span>
                  {errors.justification && (
                    <span className="text-xs text-red-500">{errors.justification}</span>
                  )}
                </div>
              </div>

              {/* Audit Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audit Reason <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={hierarchyData.auditReason}
                  onChange={(e) => handleInputChange('auditReason', e.target.value)}
                  className={`block w-full border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.auditReason ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Brief audit reason for tracking purposes..."
                />
                {errors.auditReason && (
                  <span className="text-xs text-red-500">{errors.auditReason}</span>
                )}
              </div>

              {/* Delegation Options */}
              {hierarchyData.action === 'delegate' && (
                <>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="temporary-delegation"
                      checked={hierarchyData.temporaryDelegation}
                      onChange={(e) => handleInputChange('temporaryDelegation', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="temporary-delegation" className="text-sm text-gray-700">
                      Temporary Delegation
                    </label>
                  </div>

                  {hierarchyData.temporaryDelegation && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="datetime-local"
                          value={hierarchyData.delegationPeriod?.startDate || ''}
                          onChange={(e) => handleInputChange('delegationPeriod', {
                            ...hierarchyData.delegationPeriod,
                            startDate: e.target.value
                          })}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="datetime-local"
                          value={hierarchyData.delegationPeriod?.endDate || ''}
                          onChange={(e) => handleInputChange('delegationPeriod', {
                            ...hierarchyData.delegationPeriod,
                            endDate: e.target.value
                          })}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Notification */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notify-stakeholders"
                  checked={hierarchyData.notifyStakeholders}
                  onChange={(e) => handleInputChange('notifyStakeholders', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="notify-stakeholders" className="text-sm text-gray-700">
                  Notify stakeholders of hierarchy change
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDelegationModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 
                 hierarchyData.action === 'escalate' ? 'Escalate' :
                 hierarchyData.action === 'delegate' ? 'Delegate' :
                 'Reassign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hierarchy Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-5 border w-full max-w-xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Override Approval Hierarchy
              </h3>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h5 className="text-sm font-medium text-red-900">Hierarchy Override Warning</h5>
                  <p className="text-sm text-red-800 mt-1">
                    This action bypasses standard approval hierarchy and requires strong justification. 
                    Use only in emergency or business-critical situations.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Override Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={hierarchyData.justification}
                  onChange={(e) => handleInputChange('justification', e.target.value)}
                  rows={4}
                  className={`block w-full border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 ${
                    errors.justification ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Provide detailed justification for overriding approval hierarchy..."
                />
                {errors.justification && (
                  <span className="text-xs text-red-500">{errors.justification}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audit Reason <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={hierarchyData.auditReason}
                  onChange={(e) => handleInputChange('auditReason', e.target.value)}
                  className={`block w-full border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 ${
                    errors.auditReason ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Audit trail reason..."
                />
                {errors.auditReason && (
                  <span className="text-xs text-red-500">{errors.auditReason}</span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Override Hierarchy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};