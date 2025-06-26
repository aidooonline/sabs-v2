'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  roles: UserRole[];
  department: string;
  manager?: string;
  workload: {
    current: number;
    capacity: number;
    averageProcessingTime: number; // in minutes
    slaCompliance: number; // percentage
  };
  skills: string[];
  availability: {
    isAvailable: boolean;
    workingHours: {
      start: string;
      end: string;
      timezone: string;
    };
    outOfOffice?: {
      start: string;
      end: string;
      reason: string;
    };
  };
  performance: {
    accuracyRate: number;
    avgDecisionTime: number;
    escalationRate: number;
    customerSatisfaction: number;
  };
  specializations: string[];
  certifications: string[];
  languages: string[];
  metadata: {
    lastAssignment: string;
    totalAssignments: number;
    isActive: boolean;
    joinedDate: string;
  };
}

interface UserRole {
  roleId: string;
  roleName: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
  permissions: string[];
}

interface Workflow {
  id: string;
  customerId: string;
  customerName: string;
  type: 'withdrawal' | 'deposit' | 'transfer' | 'loan';
  amount: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  complexity: 'simple' | 'moderate' | 'complex';
  requiresSpecialization?: string[];
  requiredSkills?: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  expectedProcessingTime: number; // in minutes
  slaDeadline: string;
  assignedTo?: string;
  assignedBy?: string;
  assignedAt?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'escalated';
  metadata: {
    createdAt: string;
    estimatedEffort: number;
    businessValue: number;
    customerTier: 'bronze' | 'silver' | 'gold' | 'platinum';
    region: string;
    language: string;
  };
}

interface AssignmentRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  conditions: AssignmentCondition[];
  actions: AssignmentAction[];
  createdBy: string;
  createdAt: string;
  lastModified: string;
  executionCount: number;
  successRate: number;
}

interface AssignmentCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'contains';
  value: any;
  weight?: number;
}

interface AssignmentAction {
  type: 'assign_to_user' | 'assign_to_team' | 'assign_by_skill' | 'assign_by_workload' | 'escalate';
  parameters: {
    userId?: string;
    teamId?: string;
    skills?: string[];
    maxWorkload?: number;
    escalationLevel?: number;
  };
}

interface AssignmentRecommendation {
  userId: string;
  user: User;
  score: number;
  reasons: string[];
  estimatedCompletionTime: string;
  confidence: number;
  alternativeOptions: {
    userId: string;
    score: number;
    reasons: string[];
  }[];
}

interface UserAssignmentWorkflowProps {
  workflows: Workflow[];
  users: User[];
  currentUser: User;
  onAssignWorkflow?: (workflowId: string, userId: string, assignedBy: string) => void;
  onBulkAssign?: (assignments: { workflowId: string; userId: string }[]) => void;
  onCreateAssignmentRule?: (rule: Omit<AssignmentRule, 'id' | 'createdAt' | 'lastModified' | 'executionCount' | 'successRate'>) => void;
  showAdvancedFeatures?: boolean;
}

export const UserAssignmentWorkflow: React.FC<UserAssignmentWorkflowProps> = ({
  workflows,
  users,
  currentUser,
  onAssignWorkflow,
  onBulkAssign,
  onCreateAssignmentRule,
  showAdvancedFeatures = false
}) => {
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<'manual' | 'smart' | 'bulk'>('manual');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<Map<string, AssignmentRecommendation[]>>(new Map());
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [assignmentRules, setAssignmentRules] = useState<AssignmentRule[]>([]);
  const [workloadView, setWorkloadView] = useState<'overview' | 'detailed'>('overview');
  const [filterCriteria, setFilterCriteria] = useState({
    department: '',
    role: '',
    availability: 'all',
    workloadLevel: 'all',
    skills: [] as string[],
    specializations: [] as string[]
  });

  // Calculate assignment recommendations
  const calculateRecommendations = useCallback((workflowId: string): AssignmentRecommendation[] => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return [];

    const recommendations: AssignmentRecommendation[] = [];

    users.forEach(user => {
      if (!user.metadata.isActive || !user.availability.isAvailable) return;

      let score = 0;
      const reasons: string[] = [];
      let confidence = 0;

      // Check role compatibility
      const hasCompatibleRole = user.roles.some(role => {
        const roleCompatibility = checkRoleCompatibility(role, workflow);
        if (roleCompatibility > 0) {
          score += roleCompatibility * 20;
          reasons.push(`Has compatible role: ${role.roleName}`);
          return true;
        }
        return false;
      });

      if (!hasCompatibleRole) return;

      // Check skills match
      if (workflow.requiredSkills) {
        const skillsMatch = workflow.requiredSkills.filter(skill => 
          user.skills.includes(skill)
        );
        const skillsScore = (skillsMatch.length / workflow.requiredSkills.length) * 15;
        score += skillsScore;
        if (skillsMatch.length > 0) {
          reasons.push(`Has ${skillsMatch.length}/${workflow.requiredSkills.length} required skills`);
        }
      }

      // Check specializations
      if (workflow.requiresSpecialization) {
        const specializationMatch = workflow.requiresSpecialization.some(spec => 
          user.specializations.includes(spec)
        );
        if (specializationMatch) {
          score += 15;
          reasons.push('Has required specialization');
        }
      }

      // Check workload capacity
      const workloadCapacity = (user.workload.capacity - user.workload.current) / user.workload.capacity;
      if (workloadCapacity > 0.7) {
        score += 15;
        reasons.push('Low workload - high availability');
      } else if (workloadCapacity > 0.3) {
        score += 8;
        reasons.push('Moderate workload');
      } else {
        score -= 10;
        reasons.push('High workload - limited availability');
      }

      // Check performance metrics
      if (user.performance.accuracyRate > 0.9) {
        score += 10;
        reasons.push('High accuracy rate');
      }
      if (user.performance.avgDecisionTime < workflow.expectedProcessingTime) {
        score += 8;
        reasons.push('Fast decision processing');
      }
      if (user.performance.escalationRate < 0.1) {
        score += 7;
        reasons.push('Low escalation rate');
      }

      // Check SLA compliance
      if (user.workload.slaCompliance > 0.95) {
        score += 10;
        reasons.push('Excellent SLA compliance');
      }

      // Check language compatibility
      if (user.languages.includes(workflow.metadata.language)) {
        score += 5;
        reasons.push('Language compatibility');
      }

      // Check complexity handling
      if (workflow.complexity === 'complex' && user.specializations.includes('complex_cases')) {
        score += 12;
        reasons.push('Specialized in complex cases');
      }

      // Check priority handling
      if (workflow.priority === 'urgent' && user.skills.includes('urgent_processing')) {
        score += 10;
        reasons.push('Skilled in urgent processing');
      }

      // Calculate confidence based on data completeness
      confidence = Math.min(100, (reasons.length / 8) * 100);

      // Estimate completion time
      const estimatedTime = Math.max(
        workflow.expectedProcessingTime,
        user.performance.avgDecisionTime * (1 + user.workload.current / user.workload.capacity)
      );

      const estimatedCompletionTime = new Date(
        Date.now() + estimatedTime * 60000
      ).toLocaleTimeString();

      recommendations.push({
        userId: user.id,
        user,
        score: Math.round(score),
        reasons,
        estimatedCompletionTime,
        confidence: Math.round(confidence),
        alternativeOptions: []
      });
    });

    // Sort by score and add alternatives
    recommendations.sort((a, b) => b.score - a.score);
    
    // Add alternative options for top recommendations
    recommendations.slice(0, 5).forEach(rec => {
      rec.alternativeOptions = recommendations
        .filter(r => r.userId !== rec.userId)
        .slice(0, 3)
        .map(alt => ({
          userId: alt.userId,
          score: alt.score,
          reasons: alt.reasons.slice(0, 2)
        }));
    });

    return recommendations.slice(0, 10);
  }, [workflows, users]);

  // Check role compatibility with workflow
  const checkRoleCompatibility = useCallback((role: UserRole, workflow: Workflow): number => {
    const roleAmountLimits = {
      'clerk': 1000,
      'manager': 10000,
      'admin': 100000,
      'super_admin': Infinity
    };

    const roleComplexity = {
      'clerk': ['simple'],
      'manager': ['simple', 'moderate'],
      'admin': ['simple', 'moderate', 'complex'],
      'super_admin': ['simple', 'moderate', 'complex']
    };

    const limit = roleAmountLimits[role.roleId as keyof typeof roleAmountLimits] || 0;
    const complexity = roleComplexity[role.roleId as keyof typeof roleComplexity] || [];

    if (workflow.amount > limit) return 0;
    if (!complexity.includes(workflow.complexity)) return 0;

    return 1;
  }, []);

  // Apply automatic assignment rules
  const applyAssignmentRules = useCallback((workflows: Workflow[]): Map<string, string> => {
    const assignments = new Map<string, string>();
    const activeRules = assignmentRules.filter(rule => rule.isActive).sort((a, b) => b.priority - a.priority);

    workflows.forEach(workflow => {
      if (workflow.assignedTo) return;

      for (const rule of activeRules) {
        const matches = rule.conditions.every(condition => {
          const fieldValue = getFieldValue(workflow, condition.field);
          return evaluateCondition(fieldValue, condition.operator, condition.value);
        });

        if (matches) {
          const assignee = executeAssignmentAction(workflow, rule.actions[0]);
          if (assignee) {
            assignments.set(workflow.id, assignee);
            break;
          }
        }
      }
    });

    return assignments;
  }, [assignmentRules]);

  // Execute assignment action
  const executeAssignmentAction = useCallback((workflow: Workflow, action: AssignmentAction): string | null => {
    switch (action.type) {
      case 'assign_to_user':
        return action.parameters.userId || null;
      
      case 'assign_by_skill':
        if (action.parameters.skills) {
          const skillMatches = users.filter(user => 
            user.metadata.isActive &&
            user.availability.isAvailable &&
            action.parameters.skills!.some(skill => user.skills.includes(skill))
          );
          return skillMatches.length > 0 ? skillMatches[0].id : null;
        }
        return null;
      
      case 'assign_by_workload':
        const availableUsers = users.filter(user => 
          user.metadata.isActive &&
          user.availability.isAvailable &&
          user.workload.current < (action.parameters.maxWorkload || user.workload.capacity)
        );
        availableUsers.sort((a, b) => a.workload.current - b.workload.current);
        return availableUsers.length > 0 ? availableUsers[0].id : null;
      
      default:
        return null;
    }
  }, [users]);

  // Get field value from workflow
  const getFieldValue = useCallback((workflow: Workflow, field: string): any => {
    const fieldMap: Record<string, any> = {
      'amount': workflow.amount,
      'type': workflow.type,
      'priority': workflow.priority,
      'complexity': workflow.complexity,
      'riskLevel': workflow.riskLevel,
      'customerTier': workflow.metadata.customerTier,
      'region': workflow.metadata.region,
      'language': workflow.metadata.language
    };
    return fieldMap[field];
  }, []);

  // Evaluate condition
  const evaluateCondition = useCallback((fieldValue: any, operator: string, conditionValue: any): boolean => {
    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'greater_than':
        return fieldValue > conditionValue;
      case 'less_than':
        return fieldValue < conditionValue;
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      default:
        return false;
    }
  }, []);

  // Get user workload status
  const getUserWorkloadStatus = useCallback((user: User): { status: string; color: string; level: number } => {
    const utilization = user.workload.current / user.workload.capacity;
    
    if (utilization >= 0.9) {
      return { status: 'Overloaded', color: 'text-red-600 bg-red-100', level: 4 };
    } else if (utilization >= 0.7) {
      return { status: 'High', color: 'text-orange-600 bg-orange-100', level: 3 };
    } else if (utilization >= 0.4) {
      return { status: 'Moderate', color: 'text-yellow-600 bg-yellow-100', level: 2 };
    } else {
      return { status: 'Low', color: 'text-green-600 bg-green-100', level: 1 };
    }
  }, []);

  // Get priority color
  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Get complexity color
  const getComplexityColor = useCallback((complexity: string) => {
    switch (complexity) {
      case 'complex': return 'text-purple-600 bg-purple-100';
      case 'moderate': return 'text-blue-600 bg-blue-100';
      case 'simple': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Filter users based on criteria
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (filterCriteria.department && user.department !== filterCriteria.department) return false;
      if (filterCriteria.role && !user.roles.some(r => r.roleId === filterCriteria.role)) return false;
      if (filterCriteria.availability === 'available' && !user.availability.isAvailable) return false;
      if (filterCriteria.availability === 'unavailable' && user.availability.isAvailable) return false;
      
      if (filterCriteria.workloadLevel !== 'all') {
        const workloadStatus = getUserWorkloadStatus(user);
        if (filterCriteria.workloadLevel !== workloadStatus.status.toLowerCase()) return false;
      }
      
      if (filterCriteria.skills.length > 0) {
        const hasSkills = filterCriteria.skills.some(skill => user.skills.includes(skill));
        if (!hasSkills) return false;
      }
      
      if (filterCriteria.specializations.length > 0) {
        const hasSpecializations = filterCriteria.specializations.some(spec => user.specializations.includes(spec));
        if (!hasSpecializations) return false;
      }
      
      return true;
    });
  }, [users, filterCriteria, getUserWorkloadStatus]);

  // Get unassigned workflows
  const unassignedWorkflows = useMemo(() => {
    return workflows.filter(w => !w.assignedTo && w.status === 'pending');
  }, [workflows]);

  // Handle workflow assignment
  const handleAssignWorkflow = useCallback((workflowId: string, userId: string) => {
    if (onAssignWorkflow) {
      onAssignWorkflow(workflowId, userId, currentUser.id);
    }
  }, [onAssignWorkflow, currentUser.id]);

  // Handle bulk assignment
  const handleBulkAssign = useCallback(() => {
    if (!onBulkAssign || selectedWorkflows.length === 0 || !selectedUser) return;

    const assignments = selectedWorkflows.map(workflowId => ({
      workflowId,
      userId: selectedUser.id
    }));

    onBulkAssign(assignments);
    setSelectedWorkflows([]);
    setSelectedUser(null);
  }, [onBulkAssign, selectedWorkflows, selectedUser]);

  // Handle smart assignment
  const handleSmartAssign = useCallback(() => {
    const assignments = applyAssignmentRules(unassignedWorkflows);
    if (assignments.size > 0 && onBulkAssign) {
      const assignmentArray = Array.from(assignments.entries()).map(([workflowId, userId]) => ({
        workflowId,
        userId
      }));
      onBulkAssign(assignmentArray);
    }
  }, [unassignedWorkflows, applyAssignmentRules, onBulkAssign]);

  // Load recommendations for selected workflows
  useEffect(() => {
    if (showRecommendations && selectedWorkflows.length > 0) {
      const newRecommendations = new Map();
      selectedWorkflows.forEach(workflowId => {
        const recs = calculateRecommendations(workflowId);
        newRecommendations.set(workflowId, recs);
      });
      setRecommendations(newRecommendations);
    }
  }, [showRecommendations, selectedWorkflows, calculateRecommendations]);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">User Assignment Workflow</h2>
            <p className="text-sm text-gray-600 mt-1">
              Assign workflows to users based on skills, workload, and availability
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={assignmentMode}
              onChange={(e) => setAssignmentMode(e.target.value as 'manual' | 'smart' | 'bulk')}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="manual">Manual Assignment</option>
              <option value="smart">Smart Assignment</option>
              <option value="bulk">Bulk Assignment</option>
            </select>
            
            <button
              onClick={() => setWorkloadView(workloadView === 'overview' ? 'detailed' : 'overview')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {workloadView === 'overview' ? 'Detailed View' : 'Overview'}
            </button>
            
            {showAdvancedFeatures && (
              <button
                onClick={() => setShowRuleBuilder(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Assignment Rules
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-md">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unassigned</p>
                <p className="text-2xl font-semibold text-gray-900">{unassignedWorkflows.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-md">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.availability.isAvailable).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500 rounded-md">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Workload</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(users.reduce((acc, u) => acc + (u.workload.current / u.workload.capacity), 0) / users.length * 100)}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-md">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">SLA Compliance</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(users.reduce((acc, u) => acc + u.workload.slaCompliance, 0) / users.length * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Mode Actions */}
        {assignmentMode === 'manual' && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Assignment</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Unassigned Workflows */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Unassigned Workflows</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {unassignedWorkflows.map(workflow => (
                    <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">{workflow.customerName}</h5>
                          <p className="text-sm text-gray-600">
                            {workflow.type.charAt(0).toUpperCase() + workflow.type.slice(1)} - ₵{workflow.amount.toLocaleString()}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(workflow.priority)}`}>
                              {workflow.priority}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(workflow.complexity)}`}>
                              {workflow.complexity}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => {
                              setSelectedWorkflows([workflow.id]);
                              setShowRecommendations(true);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Get Recommendations
                          </button>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignWorkflow(workflow.id, e.target.value);
                              }
                            }}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Assign to...</option>
                            {filteredUsers.map(user => (
                              <option key={user.id} value={user.id}>
                                {user.name} ({getUserWorkloadStatus(user).status})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User List */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Available Users</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredUsers.map(user => {
                    const workloadStatus = getUserWorkloadStatus(user);
                    return (
                      <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900">{user.name}</h5>
                              <p className="text-sm text-gray-600">{user.department}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${workloadStatus.color}`}>
                                  {workloadStatus.status}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {user.workload.current}/{user.workload.capacity}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {user.performance.accuracyRate * 100}% accuracy
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.workload.slaCompliance * 100}% SLA
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {assignmentMode === 'smart' && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Smart Assignment</h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-blue-700">
                  Smart assignment uses AI to match workflows with the best available users based on skills, workload, and performance.
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">
                  {unassignedWorkflows.length} workflows ready for smart assignment
                </p>
              </div>
              <button
                onClick={handleSmartAssign}
                disabled={unassignedWorkflows.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Apply Smart Assignment
              </button>
            </div>
          </div>
        )}

        {assignmentMode === 'bulk' && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Assignment</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Select Workflows</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {unassignedWorkflows.map(workflow => (
                    <label key={workflow.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedWorkflows.includes(workflow.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWorkflows([...selectedWorkflows, workflow.id]);
                          } else {
                            setSelectedWorkflows(selectedWorkflows.filter(id => id !== workflow.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{workflow.customerName}</div>
                        <div className="text-sm text-gray-600">
                          {workflow.type} - ₵{workflow.amount.toLocaleString()}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Select User</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.map(user => {
                    const workloadStatus = getUserWorkloadStatus(user);
                    return (
                      <label key={user.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="selectedUser"
                          checked={selectedUser?.id === user.id}
                          onChange={() => setSelectedUser(user)}
                          className="border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.department}</div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${workloadStatus.color}`}>
                            {workloadStatus.status}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                
                {selectedWorkflows.length > 0 && selectedUser && (
                  <div className="mt-4">
                    <button
                      onClick={handleBulkAssign}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Assign {selectedWorkflows.length} Workflows to {selectedUser.name}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Modal */}
        {showRecommendations && selectedWorkflows.length > 0 && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Assignment Recommendations</h3>
                <button
                  onClick={() => setShowRecommendations(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                {selectedWorkflows.map(workflowId => {
                  const workflow = workflows.find(w => w.id === workflowId);
                  const workflowRecs = recommendations.get(workflowId) || [];
                  
                  return (
                    <div key={workflowId} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        {workflow?.customerName} - {workflow?.type}
                      </h4>
                      
                      <div className="space-y-3">
                        {workflowRecs.slice(0, 5).map((rec, index) => (
                          <div key={rec.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{rec.user.name}</div>
                                <div className="text-sm text-gray-600">{rec.user.department}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {rec.reasons.slice(0, 2).join(', ')}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-semibold text-green-600">{rec.score}%</div>
                              <div className="text-xs text-gray-500">
                                ETA: {rec.estimatedCompletionTime}
                              </div>
                              <button
                                onClick={() => {
                                  handleAssignWorkflow(workflowId, rec.userId);
                                  setShowRecommendations(false);
                                }}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                              >
                                Assign
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};