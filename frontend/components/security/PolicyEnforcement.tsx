'use client';

import React, { useState, useCallback, useMemo } from 'react';

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'access_control' | 'data_protection' | 'transaction_limits' | 'time_restrictions' | 'compliance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  enforcement: 'warn' | 'block' | 'require_approval' | 'log_only';
  rules: PolicyRule[];
  exceptions: PolicyException[];
  createdBy: string;
  createdAt: string;
  lastModified: string;
  nextReview: string;
  metadata: {
    applicableRoles: string[];
    affectedSystems: string[];
    businessJustification: string;
    regulatoryBasis?: string;
  };
}

interface PolicyRule {
  id: string;
  name: string;
  condition: PolicyCondition;
  action: PolicyAction;
  isActive: boolean;
  weight: number; // 0-1
}

interface PolicyCondition {
  type: 'simple' | 'complex' | 'time_based' | 'role_based' | 'amount_based';
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'contains' | 'regex';
  value: any;
  logicalOperator?: 'AND' | 'OR';
  subConditions?: PolicyCondition[];
}

interface PolicyAction {
  type: 'allow' | 'deny' | 'require_approval' | 'require_mfa' | 'log' | 'notify' | 'escalate';
  parameters: {
    message?: string;
    approvalLevel?: string;
    notificationTargets?: string[];
    escalationLevel?: number;
    blockDuration?: number; // in minutes
  };
}

interface PolicyException {
  id: string;
  reason: string;
  requestedBy: string;
  approvedBy: string;
  approvedAt: string;
  expiresAt: string;
  conditions: PolicyCondition[];
  isActive: boolean;
}

interface PolicyViolation {
  id: string;
  policyId: string;
  policyName: string;
  violationType: 'access_denied' | 'limit_exceeded' | 'unauthorized_action' | 'compliance_breach' | 'time_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  userName: string;
  workflowId?: string;
  description: string;
  context: {
    action: string;
    resource: string;
    timestamp: string;
    ip: string;
    userAgent: string;
    requestDetails: Record<string, any>;
  };
  enforcement: {
    action: string;
    blocked: boolean;
    requiresApproval: boolean;
    notificationsSent: string[];
  };
  resolution?: {
    status: 'resolved' | 'dismissed' | 'escalated';
    resolvedBy: string;
    resolvedAt: string;
    notes: string;
  };
}

interface PolicyEnforcementResult {
  allowed: boolean;
  action: string;
  message: string;
  violatedPolicies: string[];
  requiredApprovals: string[];
  enforcementActions: string[];
  riskScore: number;
  recommendations: string[];
}

interface PolicyEnforcementProps {
  policies: SecurityPolicy[];
  violations: PolicyViolation[];
  onEnforcePolicy?: (context: any) => PolicyEnforcementResult;
  onCreatePolicy?: (policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'lastModified'>) => void;
  onUpdatePolicy?: (policyId: string, updates: Partial<SecurityPolicy>) => void;
  onCreateException?: (exception: Omit<PolicyException, 'id'>) => void;
  onResolveViolation?: (violationId: string, resolution: PolicyViolation['resolution']) => void;
  canManagePolicies?: boolean;
}

export const PolicyEnforcement: React.FC<PolicyEnforcementProps> = ({
  policies,
  violations,
  onEnforcePolicy,
  onCreatePolicy,
  onUpdatePolicy,
  onCreateException,
  onResolveViolation,
  canManagePolicies = false
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'policies' | 'violations' | 'enforcement'>('dashboard');
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null);
  const [selectedViolation, setSelectedViolation] = useState<PolicyViolation | null>(null);
  const [showPolicyBuilder, setShowPolicyBuilder] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [testContext, setTestContext] = useState<any>({});

  // Policy statistics
  const policyStats = useMemo(() => {
    const stats = {
      total: policies.length,
      active: policies.filter(p => p.isActive).length,
      byCategory: {} as Record<string, number>,
      byEnforcement: {} as Record<string, number>
    };

    policies.forEach(policy => {
      stats.byCategory[policy.category] = (stats.byCategory[policy.category] || 0) + 1;
      stats.byEnforcement[policy.enforcement] = (stats.byEnforcement[policy.enforcement] || 0) + 1;
    });

    return stats;
  }, [policies]);

  // Violation statistics
  const violationStats = useMemo(() => {
    const stats = {
      total: violations.length,
      open: violations.filter(v => !v.resolution).length,
      bySeverity: {} as Record<string, number>,
      byType: {} as Record<string, number>
    };

    violations.forEach(violation => {
      stats.bySeverity[violation.severity] = (stats.bySeverity[violation.severity] || 0) + 1;
      stats.byType[violation.violationType] = (stats.byType[violation.violationType] || 0) + 1;
    });

    return stats;
  }, [violations]);

  // Filter violations
  const filteredViolations = useMemo(() => {
    return violations.filter(violation => {
      if (filterSeverity !== 'all' && violation.severity !== filterSeverity) return false;
      if (filterCategory !== 'all') {
        const policy = policies.find(p => p.id === violation.policyId);
        if (!policy || policy.category !== filterCategory) return false;
      }
      return true;
    });
  }, [violations, filterSeverity, filterCategory, policies]);

  // Get category color
  const getCategoryColor = useCallback((category: string) => {
    switch (category) {
      case 'access_control': return 'bg-blue-100 text-blue-800';
      case 'data_protection': return 'bg-green-100 text-green-800';
      case 'transaction_limits': return 'bg-yellow-100 text-yellow-800';
      case 'time_restrictions': return 'bg-purple-100 text-purple-800';
      case 'compliance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Get enforcement color
  const getEnforcementColor = useCallback((enforcement: string) => {
    switch (enforcement) {
      case 'block': return 'text-red-600 bg-red-100';
      case 'require_approval': return 'text-orange-600 bg-orange-100';
      case 'warn': return 'text-yellow-600 bg-yellow-100';
      case 'log_only': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Get severity color
  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Handle policy toggle
  const handlePolicyToggle = useCallback((policyId: string, isActive: boolean) => {
    if (onUpdatePolicy) {
      onUpdatePolicy(policyId, { isActive });
    }
  }, [onUpdatePolicy]);

  // Handle test enforcement
  const handleTestEnforcement = useCallback(() => {
    if (onEnforcePolicy && testContext) {
      const result = onEnforcePolicy(testContext);
      // Handle result display - could show in a modal or alert
      console.log('Enforcement Result:', result);
    }
  }, [onEnforcePolicy, testContext]);

  // Handle resolve violation
  const handleResolveViolation = useCallback((violationId: string, status: string, notes: string) => {
    if (onResolveViolation) {
      onResolveViolation(violationId, {
        status: status as any,
        resolvedBy: 'current_user', // This should come from auth context
        resolvedAt: new Date().toISOString(),
        notes
      });
    }
  }, [onResolveViolation]);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Security Policy Enforcement</h2>
            <p className="text-sm text-gray-600 mt-1">
              Automated security controls and policy compliance monitoring
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm text-gray-600">Active Policies</div>
              <div className="text-2xl font-bold text-blue-600">{policyStats.active}/{policyStats.total}</div>
            </div>
            
            {canManagePolicies && (
              <button
                onClick={() => setShowPolicyBuilder(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Policy
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'policies'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Policies ({policyStats.active})
          </button>
          <button
            onClick={() => setActiveTab('violations')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'violations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Violations ({violationStats.open})
          </button>
          <button
            onClick={() => setActiveTab('enforcement')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'enforcement'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Test Enforcement
          </button>
        </nav>
      </div>

      <div className="p-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Policies</p>
                    <p className="text-2xl font-semibold text-gray-900">{policyStats.active}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-red-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Open Violations</p>
                    <p className="text-2xl font-semibold text-gray-900">{violationStats.open}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Blocked Actions</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {violations.filter(v => v.enforcement.blocked).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-green-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {violations.length > 0 ? Math.round((1 - violationStats.open / violations.length) * 100) : 100}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Policy Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Policies by Category</h4>
                <div className="space-y-2">
                  {Object.entries(policyStats.byCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{category.replace('_', ' ')}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Enforcement Actions</h4>
                <div className="space-y-2">
                  {Object.entries(policyStats.byEnforcement).map(([enforcement, count]) => (
                    <div key={enforcement} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{enforcement.replace('_', ' ')}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Violations */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Violations</h3>
              <div className="space-y-3">
                {violations.filter(v => !v.resolution).slice(0, 5).map(violation => (
                  <div key={violation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">{violation.policyName}</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(violation.severity)}`}>
                            {violation.severity}
                          </span>
                          {violation.enforcement.blocked && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Blocked
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{violation.description}</p>
                        <div className="mt-1 text-xs text-gray-500">
                          User: {violation.userName} • {new Date(violation.context.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedViolation(violation)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Security Policies</h3>
              <p className="text-sm text-gray-600">Manage and configure security policy rules</p>
            </div>
            
            <div className="space-y-4">
              {policies.map(policy => (
                <div key={policy.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">{policy.name}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(policy.category)}`}>
                          {policy.category.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEnforcementColor(policy.enforcement)}`}>
                          {policy.enforcement.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          policy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {policy.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">{policy.description}</p>
                      
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Rules: {policy.rules.length}</span>
                        <span>Exceptions: {policy.exceptions.length}</span>
                        <span>Next Review: {new Date(policy.nextReview).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {canManagePolicies && (
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={policy.isActive}
                            onChange={(e) => handlePolicyToggle(policy.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Active</span>
                        </label>
                      )}
                      
                      <button
                        onClick={() => setSelectedPolicy(policy)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Violations Tab */}
        {activeTab === 'violations' && (
          <div>
            {/* Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="access_control">Access Control</option>
                <option value="data_protection">Data Protection</option>
                <option value="transaction_limits">Transaction Limits</option>
                <option value="time_restrictions">Time Restrictions</option>
                <option value="compliance">Compliance</option>
              </select>
            </div>

            {/* Violations List */}
            <div className="space-y-4">
              {filteredViolations.map(violation => (
                <div key={violation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">{violation.policyName}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(violation.severity)}`}>
                          {violation.severity}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {violation.violationType.replace('_', ' ')}
                        </span>
                        {violation.enforcement.blocked && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Action Blocked
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">{violation.description}</p>
                      
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>User: {violation.userName}</span>
                        <span>Time: {new Date(violation.context.timestamp).toLocaleString()}</span>
                        <span>Action: {violation.context.action}</span>
                        {violation.resolution && (
                          <span className="text-green-600">Resolved</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {canManagePolicies && !violation.resolution && (
                        <button
                          onClick={() => handleResolveViolation(violation.id, 'resolved', 'Manual resolution')}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Resolve
                        </button>
                      )}
                      
                      <button
                        onClick={() => setSelectedViolation(violation)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Enforcement Tab */}
        {activeTab === 'enforcement' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Policy Enforcement Testing</h3>
              <p className="text-sm text-gray-600">Test policy enforcement with sample scenarios</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Test Context</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <input
                      type="text"
                      value={testContext.userId || ''}
                      onChange={(e) => setTestContext((prev: any) => ({ ...prev, userId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="user123"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                    <select
                      value={testContext.action || ''}
                                             onChange={(e) => setTestContext((prev: any) => ({ ...prev, action: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select action</option>
                      <option value="approve_withdrawal">Approve Withdrawal</option>
                      <option value="reject_transaction">Reject Transaction</option>
                      <option value="escalate_workflow">Escalate Workflow</option>
                      <option value="modify_limits">Modify Limits</option>
                      <option value="override_decision">Override Decision</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₵)</label>
                    <input
                      type="number"
                      value={testContext.amount || ''}
                                             onChange={(e) => setTestContext((prev: any) => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="10000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                    <input
                      type="text"
                      value={testContext.resource || ''}
                                             onChange={(e) => setTestContext((prev: any) => ({ ...prev, resource: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="workflow/WF123"
                    />
                  </div>
                  
                  <button
                    onClick={handleTestEnforcement}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    Test Enforcement
                  </button>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Enforcement Result</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Results will appear here after running the test. This would show:
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>Whether the action is allowed or blocked</li>
                    <li>Which policies were violated</li>
                    <li>Required approvals or additional steps</li>
                    <li>Risk assessment scores</li>
                    <li>Recommended actions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Policy Details Modal */}
      {selectedPolicy && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Policy Details</h3>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedPolicy.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedPolicy.category)}`}>
                    {selectedPolicy.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900">{selectedPolicy.description}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedPolicy.priority)}`}>
                    {selectedPolicy.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Enforcement</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEnforcementColor(selectedPolicy.enforcement)}`}>
                    {selectedPolicy.enforcement.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    selectedPolicy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedPolicy.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Policy Rules</label>
                <div className="space-y-3">
                  {selectedPolicy.rules.map(rule => (
                    <div key={rule.id} className="border border-gray-200 rounded p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{rule.name}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {rule.condition.field} {rule.condition.operator} {JSON.stringify(rule.condition.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedPolicy.exceptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Policy Exceptions</label>
                  <div className="space-y-2">
                    {selectedPolicy.exceptions.map(exception => (
                      <div key={exception.id} className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{exception.reason}</span>
                          <span className="text-xs text-gray-500">
                            Expires: {new Date(exception.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Violation Details Modal */}
      {selectedViolation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Violation Details</h3>
              <button
                onClick={() => setSelectedViolation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Policy</label>
                  <p className="text-sm text-gray-900">{selectedViolation.policyName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="text-sm text-gray-900">{selectedViolation.userName}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900">{selectedViolation.description}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Severity</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedViolation.severity)}`}>
                    {selectedViolation.severity}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm text-gray-900">{selectedViolation.violationType.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Blocked</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    selectedViolation.enforcement.blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {selectedViolation.enforcement.blocked ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Context</label>
                <div className="mt-1 bg-gray-50 p-3 rounded text-sm">
                  <div><strong>Action:</strong> {selectedViolation.context.action}</div>
                  <div><strong>Resource:</strong> {selectedViolation.context.resource}</div>
                  <div><strong>IP:</strong> {selectedViolation.context.ip}</div>
                  <div><strong>Time:</strong> {new Date(selectedViolation.context.timestamp).toLocaleString()}</div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Enforcement Action</label>
                <p className="text-sm text-gray-900">{selectedViolation.enforcement.action}</p>
              </div>
              
              {selectedViolation.resolution && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resolution</label>
                  <div className="mt-1 bg-green-50 p-3 rounded text-sm">
                    <div><strong>Status:</strong> {selectedViolation.resolution.status}</div>
                    <div><strong>Resolved by:</strong> {selectedViolation.resolution.resolvedBy}</div>
                    <div><strong>Date:</strong> {new Date(selectedViolation.resolution.resolvedAt).toLocaleString()}</div>
                    <div><strong>Notes:</strong> {selectedViolation.resolution.notes}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};