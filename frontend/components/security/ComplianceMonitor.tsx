'use client';

import React, { useState, useCallback, useMemo } from 'react';

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'regulatory' | 'internal' | 'security' | 'operational';
  regulation: string; // e.g., "GDPR", "SOX", "PCI-DSS"
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  conditions: ComplianceCondition[];
  actions: ComplianceAction[];
  lastUpdated: string;
  nextReview: string;
}

interface ComplianceCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
  value: any;
  timeframe?: number; // in hours
}

interface ComplianceAction {
  type: 'alert' | 'block' | 'log' | 'escalate' | 'notify';
  target: string;
  parameters: Record<string, any>;
}

interface ComplianceViolation {
  id: string;
  ruleId: string;
  ruleName: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  workflowId?: string;
  userId: string;
  userName: string;
  violationType: 'data_access' | 'approval_limit' | 'time_violation' | 'policy_breach' | 'authorization';
  detectedAt: string;
  resolvedAt?: string;
  details: {
    triggeredBy: string;
    context: Record<string, any>;
    evidence: string[];
    impact: string;
    remediation?: string;
  };
  assignedTo?: string;
  notes: ComplianceNote[];
}

interface ComplianceNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: string;
  type: 'investigation' | 'remediation' | 'resolution' | 'escalation';
}

interface ComplianceMetrics {
  totalRules: number;
  activeRules: number;
  violations: {
    total: number;
    open: number;
    resolved: number;
    byRegulation: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  complianceScore: number; // 0-100
  trends: {
    period: string;
    violations: number;
    improvements: number;
  }[];
}

interface ComplianceMonitorProps {
  complianceRules: ComplianceRule[];
  violations: ComplianceViolation[];
  complianceMetrics: ComplianceMetrics;
  onUpdateViolation?: (violationId: string, updates: Partial<ComplianceViolation>) => void;
  onCreateRule?: (rule: Omit<ComplianceRule, 'id'>) => void;
  onToggleRule?: (ruleId: string, isActive: boolean) => void;
  canManageCompliance?: boolean;
}

export const ComplianceMonitor: React.FC<ComplianceMonitorProps> = ({
  complianceRules,
  violations,
  complianceMetrics,
  onUpdateViolation,
  onCreateRule,
  onToggleRule,
  canManageCompliance = false
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'violations' | 'rules' | 'reports'>('dashboard');
  const [selectedViolation, setSelectedViolation] = useState<ComplianceViolation | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRegulation, setFilterRegulation] = useState<string>('all');
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);

  // Get unique regulations
  const regulations = useMemo(() => {
    const regs = Array.from(new Set(complianceRules.map(r => r.regulation)));
    return ['all', ...regs];
  }, [complianceRules]);

  // Filter violations
  const filteredViolations = useMemo(() => {
    return violations.filter(violation => {
      if (filterSeverity !== 'all' && violation.severity !== filterSeverity) return false;
      if (filterStatus !== 'all' && violation.status !== filterStatus) return false;
      if (filterRegulation !== 'all') {
        const rule = complianceRules.find(r => r.id === violation.ruleId);
        if (!rule || rule.regulation !== filterRegulation) return false;
      }
      return true;
    });
  }, [violations, filterSeverity, filterStatus, filterRegulation, complianceRules]);

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

  // Get status color
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-100';
      case 'investigating': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'false_positive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Get compliance score color
  const getComplianceScoreColor = useCallback((score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  }, []);

  // Handle violation status update
  const handleViolationUpdate = useCallback((violationId: string, field: string, value: any) => {
    if (onUpdateViolation) {
      onUpdateViolation(violationId, { [field]: value });
    }
  }, [onUpdateViolation]);

  // Handle rule toggle
  const handleRuleToggle = useCallback((ruleId: string, isActive: boolean) => {
    if (onToggleRule) {
      onToggleRule(ruleId, isActive);
    }
  }, [onToggleRule]);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Compliance Monitor</h2>
            <p className="text-sm text-gray-600 mt-1">
              Track regulatory compliance and policy adherence across all operations
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm text-gray-600">Compliance Score</div>
              <div className={`text-2xl font-bold ${getComplianceScoreColor(complianceMetrics.complianceScore)}`}>
                {complianceMetrics.complianceScore}%
              </div>
            </div>
            
            {canManageCompliance && (
              <button
                onClick={() => setShowRuleBuilder(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Rule
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
            onClick={() => setActiveTab('violations')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'violations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Violations ({complianceMetrics.violations.open})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'rules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rules ({complianceMetrics.activeRules})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reports
          </button>
        </nav>
      </div>

      <div className="p-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Rules</p>
                    <p className="text-2xl font-semibold text-gray-900">{complianceMetrics.activeRules}</p>
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
                    <p className="text-2xl font-semibold text-gray-900">{complianceMetrics.violations.open}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-green-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Resolved</p>
                    <p className="text-2xl font-semibold text-gray-900">{complianceMetrics.violations.resolved}</p>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${complianceMetrics.complianceScore >= 90 ? 'bg-green-50' : complianceMetrics.complianceScore >= 75 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-md ${complianceMetrics.complianceScore >= 90 ? 'bg-green-500' : complianceMetrics.complianceScore >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                    <p className="text-2xl font-semibold text-gray-900">{complianceMetrics.complianceScore}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Regulation Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Violations by Regulation</h4>
                <div className="space-y-2">
                  {Object.entries(complianceMetrics.violations.byRegulation).map(([regulation, count]) => (
                    <div key={regulation} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{regulation}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Severity Distribution</h4>
                <div className="space-y-2">
                  {Object.entries(complianceMetrics.violations.bySeverity).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{severity}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
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
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
              </select>
              
              <select
                value={filterRegulation}
                onChange={(e) => setFilterRegulation(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {regulations.map(reg => (
                  <option key={reg} value={reg}>
                    {reg === 'all' ? 'All Regulations' : reg}
                  </option>
                ))}
              </select>
            </div>

            {/* Violations List */}
            <div className="space-y-4">
              {filteredViolations.map((violation) => (
                <div key={violation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">{violation.ruleName}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(violation.severity)}`}>
                          {violation.severity}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(violation.status)}`}>
                          {violation.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">{violation.description}</p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>User: {violation.userName}</span>
                        <span>Detected: {new Date(violation.detectedAt).toLocaleString()}</span>
                        <span>Type: {violation.violationType.replace('_', ' ')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {canManageCompliance && violation.status === 'open' && (
                        <select
                          value={violation.status}
                          onChange={(e) => handleViolationUpdate(violation.id, 'status', e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="open">Open</option>
                          <option value="investigating">Investigating</option>
                          <option value="resolved">Resolved</option>
                          <option value="false_positive">False Positive</option>
                        </select>
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

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Compliance Rules</h3>
              <p className="text-sm text-gray-600">Manage compliance rules and policies</p>
            </div>
            
            <div className="space-y-4">
              {complianceRules.map((rule) => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">{rule.name}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(rule.severity)}`}>
                          {rule.severity}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {rule.regulation}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Category: {rule.category}</span>
                        <span>Conditions: {rule.conditions.length}</span>
                        <span>Next Review: {new Date(rule.nextReview).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {canManageCompliance && (
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={rule.isActive}
                            onChange={(e) => handleRuleToggle(rule.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Active</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Compliance Reports</h3>
              <p className="text-sm text-gray-600">Generate detailed compliance and regulatory reports</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-2">GDPR Compliance Report</h4>
                <p className="text-sm text-gray-600 mb-4">Data protection and privacy compliance status</p>
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                  Generate Report
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-2">SOX Compliance Report</h4>
                <p className="text-sm text-gray-600 mb-4">Financial controls and audit trails</p>
                <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm">
                  Generate Report
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-2">Internal Policy Report</h4>
                <p className="text-sm text-gray-600 mb-4">Company policy adherence summary</p>
                <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
                  <label className="block text-sm font-medium text-gray-700">Rule</label>
                  <p className="text-sm text-gray-900">{selectedViolation.ruleName}</p>
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
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedViolation.status)}`}>
                    {selectedViolation.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm text-gray-900">{selectedViolation.violationType.replace('_', ' ')}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Impact</label>
                <p className="text-sm text-gray-900">{selectedViolation.details.impact}</p>
              </div>
              
              {selectedViolation.details.evidence.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Evidence</label>
                  <div className="space-y-1">
                    {selectedViolation.details.evidence.map((evidence, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {evidence}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedViolation.notes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Investigation Notes</label>
                  <div className="space-y-2">
                    {selectedViolation.notes.map((note) => (
                      <div key={note.id} className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{note.authorName}</span>
                          <span className="text-xs text-gray-500">{new Date(note.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-600">{note.content}</p>
                      </div>
                    ))}
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