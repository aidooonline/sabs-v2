'use client';

import React, { useState } from 'react';
import type { ApprovalWorkflow, WorkflowPermissions } from '../../../../types/approval';

interface OverrideControlsProps {
  workflow: ApprovalWorkflow;
  permissions?: WorkflowPermissions;
  onOverride: (overrideData: OverrideData) => Promise<void>;
  isLoading?: boolean;
}

export interface OverrideData {
  overrideType: 'system_decision' | 'risk_assessment' | 'policy_exception' | 'emergency_approval';
  justification: string;
  riskAcknowledgment: string;
  supervisorApproval?: string;
  emergencyReason?: string;
  mitigationPlan: string;
  evidenceReferences: string[];
  complianceChecklist: OverrideComplianceItem[];
  authorizationLevel: 'manager' | 'senior_manager' | 'admin' | 'super_admin';
  notificationRecipients: string[];
  followUpRequired: boolean;
  followUpDate?: string;
  auditNotes: string;
}

interface OverrideComplianceItem {
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'not_applicable';
  notes: string;
}

export const OverrideControls: React.FC<OverrideControlsProps> = ({
  workflow,
  permissions,
  onOverride,
  isLoading = false
}) => {
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideData, setOverrideData] = useState<OverrideData>({
    overrideType: 'system_decision',
    justification: '',
    riskAcknowledgment: '',
    mitigationPlan: '',
    evidenceReferences: [],
    complianceChecklist: [],
    authorizationLevel: 'admin',
    notificationRecipients: [],
    followUpRequired: false,
    auditNotes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [evidenceInput, setEvidenceInput] = useState('');
  const [recipientInput, setRecipientInput] = useState('');

  // Override type configurations
  const overrideTypes = [
    {
      value: 'system_decision',
      label: 'System Decision Override',
      description: 'Override automatic system decision based on risk assessment',
      riskLevel: 'high',
      requiredAuth: 'admin',
      icon: '🤖'
    },
    {
      value: 'risk_assessment',
      label: 'Risk Assessment Override', 
      description: 'Override risk scoring and proceed despite high-risk indicators',
      riskLevel: 'critical',
      requiredAuth: 'super_admin',
      icon: '⚠️'
    },
    {
      value: 'policy_exception',
      label: 'Policy Exception',
      description: 'Approve transaction that violates standard policies',
      riskLevel: 'high',
      requiredAuth: 'senior_manager',
      icon: '📋'
    },
    {
      value: 'emergency_approval',
      label: 'Emergency Approval',
      description: 'Emergency approval for time-sensitive situations',
      riskLevel: 'critical',
      requiredAuth: 'admin',
      icon: '🚨'
    }
  ];

  // Compliance checklist items
  const complianceRequirements = [
    {
      requirement: 'Customer identity verified through multiple sources',
      category: 'verification'
    },
    {
      requirement: 'Transaction amount within daily limits for customer tier',
      category: 'limits'
    },
    {
      requirement: 'No active fraud flags on customer account',
      category: 'fraud'
    },
    {
      requirement: 'Supervisor approval obtained for high-risk override',
      category: 'authorization'
    },
    {
      requirement: 'Risk mitigation plan documented and approved',
      category: 'risk'
    },
    {
      requirement: 'Customer notification sent regarding special conditions',
      category: 'communication'
    },
    {
      requirement: 'Audit trail documentation complete and accurate',
      category: 'audit'
    },
    {
      requirement: 'Compliance team notified of policy exception',
      category: 'compliance'
    }
  ];

  const canInitiateOverride = () => {
    if (!permissions?.canOverride) return false;
    
    const selectedType = overrideTypes.find(t => t.value === overrideData.overrideType);
    if (!selectedType) return false;

    // For now, if user has override permission, they can initiate any override type
    // In a real implementation, this would check against user roles from context/props
    return true;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!overrideData.justification.trim() || overrideData.justification.length < 100) {
          newErrors.justification = 'Justification must be at least 100 characters';
        }
        if (!overrideData.riskAcknowledgment.trim() || overrideData.riskAcknowledgment.length < 50) {
          newErrors.riskAcknowledgment = 'Risk acknowledgment must be at least 50 characters';
        }
        break;
      case 2:
        if (!overrideData.mitigationPlan.trim() || overrideData.mitigationPlan.length < 75) {
          newErrors.mitigationPlan = 'Mitigation plan must be at least 75 characters';
        }
        if (overrideData.evidenceReferences.length === 0) {
          newErrors.evidenceReferences = 'At least one evidence reference is required';
        }
        break;
      case 3:
        const nonCompliantItems = overrideData.complianceChecklist.filter(item => item.status === 'non_compliant');
        if (nonCompliantItems.length > 0 && !overrideData.supervisorApproval?.trim()) {
          newErrors.supervisorApproval = 'Supervisor approval required for non-compliant items';
        }
        break;
      case 4:
        if (!overrideData.auditNotes.trim() || overrideData.auditNotes.length < 50) {
          newErrors.auditNotes = 'Audit notes must be at least 50 characters';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof OverrideData, value: any) => {
    setOverrideData(prev => ({
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

  const addEvidence = () => {
    if (evidenceInput.trim() && !overrideData.evidenceReferences.includes(evidenceInput.trim())) {
      handleInputChange('evidenceReferences', [...overrideData.evidenceReferences, evidenceInput.trim()]);
      setEvidenceInput('');
    }
  };

  const removeEvidence = (index: number) => {
    const newReferences = overrideData.evidenceReferences.filter((_, i) => i !== index);
    handleInputChange('evidenceReferences', newReferences);
  };

  const addRecipient = () => {
    if (recipientInput.trim() && !overrideData.notificationRecipients.includes(recipientInput.trim())) {
      handleInputChange('notificationRecipients', [...overrideData.notificationRecipients, recipientInput.trim()]);
      setRecipientInput('');
    }
  };

  const removeRecipient = (index: number) => {
    const newRecipients = overrideData.notificationRecipients.filter((_, i) => i !== index);
    handleInputChange('notificationRecipients', newRecipients);
  };

  const updateComplianceItem = (index: number, field: keyof OverrideComplianceItem, value: any) => {
    const newChecklist = [...overrideData.complianceChecklist];
    newChecklist[index] = { ...newChecklist[index], [field]: value };
    handleInputChange('complianceChecklist', newChecklist);
  };

  const initializeComplianceChecklist = () => {
    const checklist = complianceRequirements.map(req => ({
      requirement: req.requirement,
      status: 'compliant' as const,
      notes: ''
    }));
    handleInputChange('complianceChecklist', checklist);
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2 && overrideData.complianceChecklist.length === 0) {
        initializeComplianceChecklist();
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (validateStep(4)) {
      try {
        await onOverride(overrideData);
        setShowOverrideModal(false);
        // Reset form
        setOverrideData({
          overrideType: 'system_decision',
          justification: '',
          riskAcknowledgment: '',
          mitigationPlan: '',
          evidenceReferences: [],
          complianceChecklist: [],
          authorizationLevel: 'admin',
          notificationRecipients: [],
          followUpRequired: false,
          auditNotes: ''
        });
        setCurrentStep(1);
      } catch (error) {
        console.error('Override failed:', error);
      }
    }
  };

  const selectedOverrideType = overrideTypes.find(t => t.value === overrideData.overrideType);

  if (!canInitiateOverride()) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-sm text-gray-600">
            Override capabilities require administrator privileges
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-md font-medium text-gray-900">Administrative Override</h4>
            <p className="text-sm text-gray-600 mt-1">
              Override system decisions with proper authorization and audit trail
            </p>
          </div>
          <button
            onClick={() => setShowOverrideModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Initiate Override</span>
          </button>
        </div>

        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h5 className="text-sm font-medium text-red-900">Override Warning</h5>
              <p className="text-sm text-red-800 mt-1">
                Administrative overrides bypass standard approval processes and create significant audit obligations. 
                Use only when absolutely necessary and ensure complete documentation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Administrative Override - Step {currentStep} of 4
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

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`w-16 h-1 ${
                        currentStep > step ? 'bg-red-600' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Override Type</span>
                <span>Risk Assessment</span>
                <span>Compliance</span>
                <span>Final Review</span>
              </div>
            </div>

            {/* Step Content */}
            <div className="space-y-6">
              {/* Step 1: Override Type and Justification */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Override Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {overrideTypes.map((type) => (
                        <div
                          key={type.value}
                          onClick={() => handleInputChange('overrideType', type.value)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            overrideData.overrideType === type.value
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">{type.icon}</span>
                            <div>
                              <h4 className="font-medium text-gray-900">{type.label}</h4>
                              <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  type.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                                  type.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {type.riskLevel} risk
                                </span>
                                <span className="text-xs text-gray-500">
                                  Requires {type.requiredAuth} authorization
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detailed Justification <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={overrideData.justification}
                      onChange={(e) => handleInputChange('justification', e.target.value)}
                      rows={4}
                      className={`block w-full border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 ${
                        errors.justification ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Provide comprehensive justification for this override (minimum 100 characters)..."
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {overrideData.justification.length} / 100 minimum characters
                      </span>
                      {errors.justification && (
                        <span className="text-xs text-red-500">{errors.justification}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Risk Acknowledgment <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={overrideData.riskAcknowledgment}
                      onChange={(e) => handleInputChange('riskAcknowledgment', e.target.value)}
                      rows={3}
                      className={`block w-full border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 ${
                        errors.riskAcknowledgment ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Acknowledge the risks associated with this override decision..."
                    />
                    {errors.riskAcknowledgment && (
                      <span className="text-xs text-red-500">{errors.riskAcknowledgment}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Risk Mitigation and Evidence */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Risk Mitigation Plan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={overrideData.mitigationPlan}
                      onChange={(e) => handleInputChange('mitigationPlan', e.target.value)}
                      rows={4}
                      className={`block w-full border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 ${
                        errors.mitigationPlan ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Describe specific measures to mitigate risks (minimum 75 characters)..."
                    />
                    {errors.mitigationPlan && (
                      <span className="text-xs text-red-500">{errors.mitigationPlan}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evidence References <span className="text-red-500">*</span>
                    </label>
                    
                    {overrideData.evidenceReferences.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {overrideData.evidenceReferences.map((evidence, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                            <span className="text-sm text-gray-700">{evidence}</span>
                            <button
                              onClick={() => removeEvidence(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={evidenceInput}
                        onChange={(e) => setEvidenceInput(e.target.value)}
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        placeholder="Document reference, policy section, or supporting evidence..."
                        onKeyPress={(e) => e.key === 'Enter' && addEvidence()}
                      />
                      <button
                        onClick={addEvidence}
                        disabled={!evidenceInput.trim()}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                    {errors.evidenceReferences && (
                      <span className="text-xs text-red-500">{errors.evidenceReferences}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Compliance Checklist */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Compliance Checklist</h4>
                    <div className="space-y-4">
                      {overrideData.complianceChecklist.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{item.requirement}</p>
                              <div className="mt-2 flex space-x-4">
                                {['compliant', 'non_compliant', 'not_applicable'].map((status) => (
                                  <label key={status} className="flex items-center">
                                    <input
                                      type="radio"
                                      name={`compliance-${index}`}
                                      value={status}
                                      checked={item.status === status}
                                      onChange={(e) => updateComplianceItem(index, 'status', e.target.value)}
                                      className="mr-2"
                                    />
                                    <span className={`text-sm ${
                                      status === 'compliant' ? 'text-green-700' :
                                      status === 'non_compliant' ? 'text-red-700' :
                                      'text-gray-700'
                                    }`}>
                                      {status.replace('_', ' ')}
                                    </span>
                                  </label>
                                ))}
                              </div>
                              <textarea
                                value={item.notes}
                                onChange={(e) => updateComplianceItem(index, 'notes', e.target.value)}
                                className="mt-2 block w-full text-sm border-gray-300 rounded-md"
                                placeholder="Notes or explanation..."
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {overrideData.complianceChecklist.some(item => item.status === 'non_compliant') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supervisor Approval Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={overrideData.supervisorApproval || ''}
                        onChange={(e) => handleInputChange('supervisorApproval', e.target.value)}
                        className={`block w-full border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 ${
                          errors.supervisorApproval ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter supervisor approval code for non-compliant items..."
                      />
                      {errors.supervisorApproval && (
                        <span className="text-xs text-red-500">{errors.supervisorApproval}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Final Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Final Audit Notes <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={overrideData.auditNotes}
                      onChange={(e) => handleInputChange('auditNotes', e.target.value)}
                      rows={4}
                      className={`block w-full border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 ${
                        errors.auditNotes ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Final audit notes and summary for compliance records..."
                    />
                    {errors.auditNotes && (
                      <span className="text-xs text-red-500">{errors.auditNotes}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                        <input
                          type="checkbox"
                          checked={overrideData.followUpRequired}
                          onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span>Follow-up Required</span>
                      </label>
                      {overrideData.followUpRequired && (
                        <input
                          type="date"
                          value={overrideData.followUpDate || ''}
                          onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Authorization Level
                      </label>
                      <select
                        value={overrideData.authorizationLevel}
                        onChange={(e) => handleInputChange('authorizationLevel', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="manager">Manager</option>
                        <option value="senior_manager">Senior Manager</option>
                        <option value="admin">Administrator</option>
                        <option value="super_admin">Super Administrator</option>
                      </select>
                    </div>
                  </div>

                  {/* Override Summary */}
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h5 className="text-sm font-medium text-red-900 mb-2">Override Summary</h5>
                    <div className="text-sm text-red-800 space-y-1">
                      <p><strong>Type:</strong> {selectedOverrideType?.label}</p>
                      <p><strong>Risk Level:</strong> {selectedOverrideType?.riskLevel}</p>
                      <p><strong>Evidence Items:</strong> {overrideData.evidenceReferences.length}</p>
                      <p><strong>Compliance Status:</strong> {
                        overrideData.complianceChecklist.filter(item => item.status === 'compliant').length
                      } / {overrideData.complianceChecklist.length} compliant</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                
                {currentStep < 4 ? (
                  <button
                    onClick={nextStep}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Execute Override'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};