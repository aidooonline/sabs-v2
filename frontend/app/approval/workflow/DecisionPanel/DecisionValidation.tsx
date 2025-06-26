'use client';

import React, { useState, useEffect } from 'react';
import type { ApprovalWorkflow, ApprovalAction, WorkflowPermissions } from '../../../../types/approval';

interface DecisionValidationProps {
  workflow: ApprovalWorkflow;
  selectedAction: ApprovalAction;
  permissions?: WorkflowPermissions;
  decisionData: DecisionFormData;
  onValidationComplete: (validationResult: ValidationResult) => void;
  onValidationError: (errors: ValidationError[]) => void;
  isLoading?: boolean;
}

export interface DecisionFormData {
  action: ApprovalAction;
  notes: string;
  conditions?: string[];
  riskAssessment?: string;
  businessJustification?: string;
  authorizationMethod: 'pin' | 'otp' | 'biometric' | 'digital_signature';
  authorizationCode?: string;
  requiresDualApproval?: boolean;
  secondaryApproverId?: string;
  escalationReason?: string;
  overrideFlags?: string[];
  complianceChecks?: ComplianceValidation[];
}

export interface ValidationResult {
  isValid: boolean;
  validationChecks: ValidationCheck[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresSecondaryApproval: boolean;
  recommendedAction?: ApprovalAction;
  warnings: ValidationWarning[];
  confirmationRequired: boolean;
  preSubmissionChecks: PreSubmissionCheck[];
}

interface ValidationCheck {
  checkType: string;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  message: string;
  requirement: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  autoFixable: boolean;
  details?: string;
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'warning' | 'error';
  canProceed: boolean;
}

interface ValidationWarning {
  type: string;
  message: string;
  recommendation: string;
  canProceed: boolean;
  requiresAcknowledgment: boolean;
}

interface PreSubmissionCheck {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'skipped';
  required: boolean;
  validator: () => Promise<boolean>;
}

interface ComplianceValidation {
  regulation: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'pending_review';
  evidence?: string[];
  reviewerNotes?: string;
}

interface DualApprovalRequest {
  primaryApproverId: string;
  primaryApproverName: string;
  secondaryApproverId: string;
  secondaryApproverName: string;
  requiredByPolicy: boolean;
  requiredByAmount: boolean;
  requiredByRisk: boolean;
  coordinationMethod: 'sequential' | 'concurrent' | 'hierarchical';
  timeoutHours: number;
}

export const DecisionValidation: React.FC<DecisionValidationProps> = ({
  workflow,
  selectedAction,
  permissions,
  decisionData,
  onValidationComplete,
  onValidationError,
  isLoading = false
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationInProgress, setValidationInProgress] = useState(false);
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState<Set<string>>(new Set());
  const [completedChecks, setCompletedChecks] = useState<Set<string>>(new Set());
  const [dualApprovalData, setDualApprovalData] = useState<DualApprovalRequest | null>(null);

  // Validation rules configuration
  const validationRules: Record<ApprovalAction, {
    minNotesLength: number;
    requiresRiskAssessment: boolean;
    requiresComplianceCheck: boolean;
    maxAmountWithoutSecondary: number;
    blockedRiskLevels: string[];
  }> = {
    approve: {
      minNotesLength: 25,
      requiresRiskAssessment: true,
      requiresComplianceCheck: true,
      maxAmountWithoutSecondary: 50000,
      blockedRiskLevels: ['critical']
    },
    reject: {
      minNotesLength: 50,
      requiresRiskAssessment: false,
      requiresComplianceCheck: false,
      maxAmountWithoutSecondary: Infinity,
      blockedRiskLevels: []
    },
    escalate: {
      minNotesLength: 30,
      requiresRiskAssessment: true,
      requiresComplianceCheck: false,
      maxAmountWithoutSecondary: Infinity,
      blockedRiskLevels: []
    },
    request_info: {
      minNotesLength: 20,
      requiresRiskAssessment: false,
      requiresComplianceCheck: false,
      maxAmountWithoutSecondary: Infinity,
      blockedRiskLevels: []
    },
    conditional_approve: {
      minNotesLength: 40,
      requiresRiskAssessment: true,
      requiresComplianceCheck: true,
      maxAmountWithoutSecondary: 25000,
      blockedRiskLevels: ['critical']
    },
    override: {
      minNotesLength: 100,
      requiresRiskAssessment: true,
      requiresComplianceCheck: true,
      maxAmountWithoutSecondary: 10000,
      blockedRiskLevels: []
    }
  };

  // Run validation when decision data changes
  useEffect(() => {
    if (decisionData.action && decisionData.notes) {
      runValidation();
    }
  }, [decisionData, selectedAction]);

  const runValidation = async () => {
    setValidationInProgress(true);
    
    try {
      const checks = await performValidationChecks();
      const riskLevel = calculateRiskLevel();
      const requiresSecondary = checkSecondaryApprovalRequirement();
      const warnings = generateWarnings();
      const preChecks = generatePreSubmissionChecks();
      
      const result: ValidationResult = {
        isValid: checks.every(check => check.status !== 'failed'),
        validationChecks: checks,
        riskLevel,
        requiresSecondaryApproval: requiresSecondary,
        warnings,
        confirmationRequired: riskLevel === 'high' || riskLevel === 'critical',
        preSubmissionChecks: preChecks
      };

      setValidationResult(result);
      
      if (result.isValid) {
        onValidationComplete(result);
      } else {
        const errors = checks
          .filter(check => check.status === 'failed')
          .map(check => ({
            field: check.checkType,
            message: check.message,
            code: check.requirement,
            severity: check.severity === 'critical' ? 'error' as const : 'warning' as const,
            canProceed: check.severity !== 'critical'
          }));
        onValidationError(errors);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setValidationInProgress(false);
    }
  };

  const performValidationChecks = async (): Promise<ValidationCheck[]> => {
    const checks: ValidationCheck[] = [];
    const rules = validationRules[selectedAction];

    // Notes length validation
    checks.push({
      checkType: 'notes_length',
      status: decisionData.notes.length >= rules.minNotesLength ? 'passed' : 'failed',
      message: decisionData.notes.length >= rules.minNotesLength 
        ? `Notes meet minimum length requirement (${decisionData.notes.length}/${rules.minNotesLength})`
        : `Notes too short (${decisionData.notes.length}/${rules.minNotesLength} characters required)`,
      requirement: `Minimum ${rules.minNotesLength} characters required`,
      severity: 'error',
      autoFixable: false
    });

    // Authorization method validation
    checks.push({
      checkType: 'authorization_method',
      status: decisionData.authorizationMethod ? 'passed' : 'failed',
      message: decisionData.authorizationMethod 
        ? `Authorization method: ${decisionData.authorizationMethod}`
        : 'Authorization method required',
      requirement: 'Valid authorization method required',
      severity: 'error',
      autoFixable: false
    });

    // Risk assessment validation
    if (rules.requiresRiskAssessment) {
      const hasRiskAssessment = workflow.riskAssessment && workflow.riskAssessment.riskScore > 0;
      checks.push({
        checkType: 'risk_assessment',
        status: hasRiskAssessment ? 'passed' : 'warning',
        message: hasRiskAssessment 
          ? `Risk assessment completed (Score: ${workflow.riskAssessment.riskScore})`
          : 'Risk assessment not completed or outdated',
        requirement: 'Current risk assessment required',
        severity: 'warning',
        autoFixable: false
      });
    }

    // Amount vs authority validation
    const hasAuthority = checkAmountAuthority();
    checks.push({
      checkType: 'amount_authority',
      status: hasAuthority ? 'passed' : 'failed',
      message: hasAuthority 
        ? `Amount within approval authority`
        : `Amount exceeds approval authority for ${selectedAction}`,
      requirement: 'Amount must be within approval authority',
      severity: 'error',
      autoFixable: false
    });

    // Compliance validation
    if (rules.requiresComplianceCheck) {
      const hasCompliance = checkComplianceStatus();
      checks.push({
        checkType: 'compliance_check',
        status: hasCompliance.status,
        message: hasCompliance.message,
        requirement: 'Compliance requirements must be met',
        severity: hasCompliance.status === 'failed' ? 'error' : 'warning',
        autoFixable: false
      });
    }

    // Risk level blocking
    if (rules.blockedRiskLevels.includes(workflow.riskAssessment.overallRisk)) {
      checks.push({
        checkType: 'risk_level_block',
        status: 'failed',
        message: `Action blocked due to ${workflow.riskAssessment.overallRisk} risk level`,
        requirement: `${selectedAction} not allowed for ${workflow.riskAssessment.overallRisk} risk transactions`,
        severity: 'critical',
        autoFixable: false
      });
    }

    // Workflow status validation
    checks.push({
      checkType: 'workflow_status',
      status: workflow.status === 'pending' ? 'passed' : 'failed',
      message: workflow.status === 'pending' 
        ? 'Workflow available for processing'
        : `Workflow status: ${workflow.status} - cannot be processed`,
      requirement: 'Workflow must be in pending status',
      severity: 'critical',
      autoFixable: false
    });

    // Time-based validations
    const isWithinBusinessHours = checkBusinessHours();
    checks.push({
      checkType: 'business_hours',
      status: isWithinBusinessHours ? 'passed' : 'warning',
      message: isWithinBusinessHours 
        ? 'Processing within business hours'
        : 'Processing outside normal business hours',
      requirement: 'Preferably processed during business hours',
      severity: 'info',
      autoFixable: false
    });

    return checks;
  };

  const calculateRiskLevel = (): 'low' | 'medium' | 'high' | 'critical' => {
    const baseRisk = workflow.riskAssessment.overallRisk;
    const amount = workflow.withdrawalRequest.amount;
    
    // Escalate risk based on action and amount
    if (selectedAction === 'override' || amount > 100000) {
      return 'critical';
    }
    
    if (selectedAction === 'approve' && amount > 50000) {
      return baseRisk === 'low' ? 'medium' : 'high';
    }
    
    return baseRisk;
  };

  const checkSecondaryApprovalRequirement = (): boolean => {
    const amount = workflow.withdrawalRequest.amount;
    const rules = validationRules[selectedAction];
    const riskLevel = workflow.riskAssessment.overallRisk;
    
    return amount > rules.maxAmountWithoutSecondary || 
           riskLevel === 'critical' || 
           selectedAction === 'override' ||
           workflow.complianceFlags.some(flag => flag.severity === 'critical');
  };

  const generateWarnings = (): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];
    
    // High-value transaction warning
    if (workflow.withdrawalRequest.amount > 75000) {
      warnings.push({
        type: 'high_value',
        message: 'High-value transaction requires careful review',
        recommendation: 'Verify customer identity and transaction legitimacy',
        canProceed: true,
        requiresAcknowledgment: true
      });
    }

    // Unusual activity warning
    if (workflow.riskAssessment.fraudIndicators.length > 0) {
      warnings.push({
        type: 'fraud_indicators',
        message: `${workflow.riskAssessment.fraudIndicators.length} fraud indicators detected`,
        recommendation: 'Review fraud indicators before proceeding',
        canProceed: true,
        requiresAcknowledgment: true
      });
    }

    // Time-sensitive warning
    const timeInQueue = Date.now() - new Date(workflow.createdAt).getTime();
    const hoursInQueue = timeInQueue / (1000 * 60 * 60);
    
    if (hoursInQueue > 24) {
      warnings.push({
        type: 'time_sensitive',
        message: `Workflow has been pending for ${Math.round(hoursInQueue)} hours`,
        recommendation: 'Consider priority processing to meet SLA',
        canProceed: true,
        requiresAcknowledgment: false
      });
    }

    return warnings;
  };

  const generatePreSubmissionChecks = (): PreSubmissionCheck[] => {
    const checks: PreSubmissionCheck[] = [
      {
        id: 'customer_verification',
        title: 'Customer Identity Verification',
        description: 'Verify customer identity matches transaction request',
        status: 'pending',
        required: selectedAction === 'approve',
        validator: async () => {
          // Mock validation - in real implementation, this would call an API
          return workflow.withdrawalRequest.customer.accountStatus === 'active';
        }
      },
      {
        id: 'document_review',
        title: 'Supporting Documents Review',
        description: 'Review all uploaded supporting documents',
        status: 'pending',
        required: workflow.withdrawalRequest.documents.length > 0,
        validator: async () => {
          return workflow.withdrawalRequest.documents.every(doc => 
            doc.verificationStatus === 'verified'
          );
        }
      },
      {
        id: 'risk_mitigation',
        title: 'Risk Mitigation Assessment',
        description: 'Assess and document risk mitigation measures',
        status: 'pending',
        required: workflow.riskAssessment.overallRisk !== 'low',
        validator: async () => {
          return workflow.riskAssessment.recommendations.length > 0;
        }
      },
      {
        id: 'compliance_clearance',
        title: 'Compliance Clearance',
        description: 'Ensure all compliance requirements are met',
        status: 'pending',
        required: true,
        validator: async () => {
          return !workflow.complianceFlags.some(flag => 
            flag.severity === 'critical' && !flag.resolvedAt
          );
        }
      }
    ];

    return checks;
  };

  const checkAmountAuthority = (): boolean => {
    // Mock authority check - in real implementation, this would check user permissions
    const amount = workflow.withdrawalRequest.amount;
    
    if (selectedAction === 'approve') {
      return amount <= 100000; // Mock approval limit
    }
    
    return true; // Other actions generally allowed
  };

  const checkComplianceStatus = (): { status: 'passed' | 'failed' | 'warning', message: string } => {
    const criticalFlags = workflow.complianceFlags.filter(flag => 
      flag.severity === 'critical' && !flag.resolvedAt
    );
    
    if (criticalFlags.length > 0) {
      return {
        status: 'failed',
        message: `${criticalFlags.length} critical compliance issues unresolved`
      };
    }
    
    const warningFlags = workflow.complianceFlags.filter(flag => 
      flag.severity === 'warning' && !flag.resolvedAt
    );
    
    if (warningFlags.length > 0) {
      return {
        status: 'warning',
        message: `${warningFlags.length} compliance warnings present`
      };
    }
    
    return {
      status: 'passed',
      message: 'All compliance requirements met'
    };
  };

  const checkBusinessHours = (): boolean => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Business hours: Monday-Friday 8 AM - 6 PM
    return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
  };

  const executePreSubmissionCheck = async (checkId: string) => {
    const check = validationResult?.preSubmissionChecks.find(c => c.id === checkId);
    if (!check) return;

    try {
      const result = await check.validator();
      
      setValidationResult(prev => {
        if (!prev) return prev;
        
        const updatedChecks = prev.preSubmissionChecks.map(c => 
          c.id === checkId ? { ...c, status: (result ? 'completed' : 'failed') as 'completed' | 'failed' } : c
        );
        
        return { ...prev, preSubmissionChecks: updatedChecks };
      });
      
      if (result) {
        setCompletedChecks(prev => new Set(prev).add(checkId));
      }
    } catch (error) {
      console.error(`Pre-submission check ${checkId} failed:`, error);
    }
  };

  const acknowledgeWarning = (warningType: string) => {
    setAcknowledgedWarnings(prev => new Set(prev).add(warningType));
  };

  const canProceedWithValidation = (): boolean => {
    if (!validationResult) return false;
    
    const hasFailedCriticalChecks = validationResult.validationChecks.some(
      check => check.status === 'failed' && check.severity === 'critical'
    );
    
    if (hasFailedCriticalChecks) return false;
    
    const requiredWarningsAcknowledged = validationResult.warnings
      .filter(w => w.requiresAcknowledgment)
      .every(w => acknowledgedWarnings.has(w.type));
    
    if (!requiredWarningsAcknowledged) return false;
    
    const requiredChecksCompleted = validationResult.preSubmissionChecks
      .filter(c => c.required)
      .every(c => completedChecks.has(c.id) || c.status === 'completed');
    
    return requiredChecksCompleted;
  };

  const getValidationStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'skipped':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (!validationResult && !validationInProgress) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-800">
            Decision validation will run automatically when you provide required information.
          </p>
        </div>
      </div>
    );
  }

  if (validationInProgress) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <svg className="animate-spin w-6 h-6 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-gray-700">Running decision validation...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900">Decision Validation</h4>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive validation of approval decision
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              validationResult?.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {validationResult?.isValid ? 'Validation Passed' : 'Validation Issues'}
            </span>
            
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              validationResult?.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
              validationResult?.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              validationResult?.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {validationResult?.riskLevel.toUpperCase()} Risk
            </span>
          </div>
        </div>

        {/* Validation Checks */}
        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-3">Validation Checks</h5>
            <div className="space-y-2">
              {validationResult?.validationChecks.map((check, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getValidationStatusColor(check.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        {check.status === 'passed' && (
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {check.status === 'warning' && (
                          <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        {check.status === 'failed' && (
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{check.message}</p>
                        <p className="text-xs text-gray-600 mt-1">{check.requirement}</p>
                        {check.details && (
                          <p className="text-xs text-gray-500 mt-1">{check.details}</p>
                        )}
                      </div>
                    </div>
                    
                    {check.autoFixable && (
                      <button className="ml-3 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                        Auto Fix
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {validationResult && validationResult.warnings.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-3">Warnings & Recommendations</h5>
              <div className="space-y-2">
                {validationResult.warnings.map((warning, index) => (
                  <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-900">{warning.message}</p>
                        <p className="text-sm text-yellow-800 mt-1">{warning.recommendation}</p>
                      </div>
                      
                      {warning.requiresAcknowledgment && (
                        <button
                          onClick={() => acknowledgeWarning(warning.type)}
                          disabled={acknowledgedWarnings.has(warning.type)}
                          className={`ml-3 text-xs px-3 py-1 rounded ${
                            acknowledgedWarnings.has(warning.type)
                              ? 'bg-green-100 text-green-800 cursor-not-allowed'
                              : 'bg-yellow-600 text-white hover:bg-yellow-700'
                          }`}
                        >
                          {acknowledgedWarnings.has(warning.type) ? 'Acknowledged' : 'Acknowledge'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pre-submission Checks */}
          {validationResult && validationResult.preSubmissionChecks.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-3">Pre-submission Checks</h5>
              <div className="space-y-2">
                {validationResult.preSubmissionChecks.map((check) => (
                  <div key={check.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{check.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{check.description}</p>
                        {check.required && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                            Required
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          check.status === 'completed' ? 'bg-green-100 text-green-800' :
                          check.status === 'failed' ? 'bg-red-100 text-red-800' :
                          check.status === 'skipped' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {check.status}
                        </span>
                        
                        {check.status === 'pending' && (
                          <button
                            onClick={() => executePreSubmissionCheck(check.id)}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            Validate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Secondary Approval Requirement */}
          {validationResult?.requiresSecondaryApproval && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <div>
                  <h6 className="text-sm font-medium text-blue-900">Secondary Approval Required</h6>
                  <p className="text-sm text-blue-800 mt-1">
                    This decision requires approval from a second authorized user due to:
                  </p>
                  <ul className="list-disc list-inside text-xs text-blue-700 mt-2 space-y-1">
                    {workflow.withdrawalRequest.amount > 50000 && <li>High transaction amount</li>}
                    {workflow.riskAssessment.overallRisk === 'critical' && <li>Critical risk level</li>}
                    {selectedAction === 'override' && <li>Override action selected</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Final Validation Status */}
          <div className={`p-4 rounded-lg border ${
            canProceedWithValidation() ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              {canProceedWithValidation() ? (
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <p className={`text-sm font-medium ${
                canProceedWithValidation() ? 'text-green-900' : 'text-red-900'
              }`}>
                {canProceedWithValidation() 
                  ? 'Decision validation complete - ready to proceed'
                  : 'Validation incomplete - address all issues before proceeding'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};