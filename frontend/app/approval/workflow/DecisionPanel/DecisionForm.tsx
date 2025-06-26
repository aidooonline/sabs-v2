'use client';

import React, { useState, useEffect } from 'react';
import type { ApprovalWorkflow, ApprovalAction } from '../../../../types/approval';

interface DecisionFormProps {
  workflow: ApprovalWorkflow;
  selectedAction: ApprovalAction;
  onSubmit: (decisionData: DecisionFormData) => void;
  isLoading?: boolean;
}

export interface DecisionFormData {
  action: ApprovalAction;
  notes: string;
  conditions?: string[];
  escalationReason?: string;
  escalateTo?: string;
  riskMitigation?: string;
  complianceChecks?: string[];
  businessJustification?: string;
  customerNotification?: boolean;
  agentInstructions?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  evidenceReferences?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
}

export const DecisionForm: React.FC<DecisionFormProps> = ({
  workflow,
  selectedAction,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<DecisionFormData>({
    action: selectedAction,
    notes: '',
    conditions: [],
    customerNotification: true,
    followUpRequired: false,
    priority: 'medium',
    tags: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [noteCharCount, setNoteCharCount] = useState(0);
  const [conditionInput, setConditionInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Action-specific configuration
  const actionConfig = {
    approve: {
      minNoteLength: 20,
      requiredFields: ['notes', 'businessJustification'],
      showCustomerNotification: true,
      showAgentInstructions: true,
      showFollowUp: false
    },
    reject: {
      minNoteLength: 50,
      requiredFields: ['notes', 'businessJustification', 'riskMitigation'],
      showCustomerNotification: true,
      showAgentInstructions: true,
      showFollowUp: true
    },
    escalate: {
      minNoteLength: 30,
      requiredFields: ['notes', 'escalationReason', 'escalateTo'],
      showCustomerNotification: false,
      showAgentInstructions: false,
      showFollowUp: true
    },
    request_info: {
      minNoteLength: 25,
      requiredFields: ['notes', 'agentInstructions'],
      showCustomerNotification: true,
      showAgentInstructions: true,
      showFollowUp: true
    },
    conditional_approve: {
      minNoteLength: 40,
      requiredFields: ['notes', 'conditions', 'businessJustification'],
      showCustomerNotification: true,
      showAgentInstructions: true,
      showFollowUp: true
    },
    override: {
      minNoteLength: 100,
      requiredFields: ['notes', 'businessJustification', 'riskMitigation', 'complianceChecks'],
      showCustomerNotification: true,
      showAgentInstructions: true,
      showFollowUp: true
    }
  };

  const config = actionConfig[selectedAction] || actionConfig.approve;

  useEffect(() => {
    setFormData(prev => ({ ...prev, action: selectedAction }));
    setErrors({});
  }, [selectedAction]);

  useEffect(() => {
    setNoteCharCount(formData.notes.length);
  }, [formData.notes]);

  const handleInputChange = (field: keyof DecisionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addCondition = () => {
    if (conditionInput.trim() && !formData.conditions?.includes(conditionInput.trim())) {
      const newConditions = [...(formData.conditions || []), conditionInput.trim()];
      handleInputChange('conditions', newConditions);
      setConditionInput('');
    }
  };

  const removeCondition = (index: number) => {
    const newConditions = formData.conditions?.filter((_, i) => i !== index) || [];
    handleInputChange('conditions', newConditions);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      const newTags = [...(formData.tags || []), tagInput.trim()];
      handleInputChange('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    const newTags = formData.tags?.filter((_, i) => i !== index) || [];
    handleInputChange('tags', newTags);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Notes validation
    if (!formData.notes.trim()) {
      newErrors.notes = 'Decision notes are required';
    } else if (formData.notes.length < config.minNoteLength) {
      newErrors.notes = `Notes must be at least ${config.minNoteLength} characters`;
    }

    // Action-specific validations
    if (config.requiredFields.includes('businessJustification') && !formData.businessJustification?.trim()) {
      newErrors.businessJustification = 'Business justification is required';
    }

    if (config.requiredFields.includes('riskMitigation') && !formData.riskMitigation?.trim()) {
      newErrors.riskMitigation = 'Risk mitigation explanation is required';
    }

    if (config.requiredFields.includes('escalationReason') && !formData.escalationReason?.trim()) {
      newErrors.escalationReason = 'Escalation reason is required';
    }

    if (config.requiredFields.includes('escalateTo') && !formData.escalateTo?.trim()) {
      newErrors.escalateTo = 'Escalation recipient is required';
    }

    if (config.requiredFields.includes('agentInstructions') && !formData.agentInstructions?.trim()) {
      newErrors.agentInstructions = 'Agent instructions are required';
    }

    if (config.requiredFields.includes('conditions') && (!formData.conditions || formData.conditions.length === 0)) {
      newErrors.conditions = 'At least one condition is required for conditional approval';
    }

    if (config.requiredFields.includes('complianceChecks') && (!formData.complianceChecks || formData.complianceChecks.length === 0)) {
      newErrors.complianceChecks = 'Compliance verification is required for override actions';
    }

    if (formData.followUpRequired && !formData.followUpDate) {
      newErrors.followUpDate = 'Follow-up date is required when follow-up is enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white p-6 border border-gray-200 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Header */}
        <div className="pb-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">
            Decision Recording: {selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1).replace('_', ' ')}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            Provide comprehensive details for this approval decision
          </p>
        </div>

        {/* Primary Decision Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Decision Notes <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            className={`block w-full border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
              errors.notes ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={`Provide detailed reasoning for ${selectedAction} decision...`}
          />
          <div className="flex justify-between items-center mt-1">
            <span className={`text-xs ${noteCharCount < config.minNoteLength ? 'text-red-500' : 'text-gray-500'}`}>
              {noteCharCount} / {config.minNoteLength} minimum characters
            </span>
            {errors.notes && <span className="text-xs text-red-500">{errors.notes}</span>}
          </div>
        </div>

        {/* Business Justification */}
        {config.requiredFields.includes('businessJustification') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.businessJustification || ''}
              onChange={(e) => handleInputChange('businessJustification', e.target.value)}
              rows={3}
              className={`block w-full border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                errors.businessJustification ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Explain the business reasoning for this decision..."
            />
            {errors.businessJustification && (
              <span className="text-xs text-red-500">{errors.businessJustification}</span>
            )}
          </div>
        )}

        {/* Risk Mitigation */}
        {config.requiredFields.includes('riskMitigation') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Mitigation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.riskMitigation || ''}
              onChange={(e) => handleInputChange('riskMitigation', e.target.value)}
              rows={3}
              className={`block w-full border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                errors.riskMitigation ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe how identified risks will be mitigated..."
            />
            {errors.riskMitigation && (
              <span className="text-xs text-red-500">{errors.riskMitigation}</span>
            )}
          </div>
        )}

        {/* Escalation Fields */}
        {config.requiredFields.includes('escalationReason') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escalation Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.escalationReason || ''}
                onChange={(e) => handleInputChange('escalationReason', e.target.value)}
                className={`block w-full border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                  errors.escalationReason ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select reason...</option>
                <option value="exceeds_authority">Exceeds Authority Level</option>
                <option value="high_risk">High Risk Transaction</option>
                <option value="compliance_concern">Compliance Concern</option>
                <option value="insufficient_information">Insufficient Information</option>
                <option value="policy_exception">Policy Exception Required</option>
                <option value="unusual_activity">Unusual Activity Pattern</option>
              </select>
              {errors.escalationReason && (
                <span className="text-xs text-red-500">{errors.escalationReason}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escalate To <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.escalateTo || ''}
                onChange={(e) => handleInputChange('escalateTo', e.target.value)}
                className={`block w-full border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                  errors.escalateTo ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select recipient...</option>
                <option value="manager">Manager</option>
                <option value="senior_manager">Senior Manager</option>
                <option value="admin">Administrator</option>
                <option value="compliance_team">Compliance Team</option>
                <option value="risk_team">Risk Management Team</option>
              </select>
              {errors.escalateTo && (
                <span className="text-xs text-red-500">{errors.escalateTo}</span>
              )}
            </div>
          </div>
        )}

        {/* Conditions (for conditional approval) */}
        {selectedAction === 'conditional_approve' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval Conditions <span className="text-red-500">*</span>
            </label>
            
            {/* Existing Conditions */}
            {formData.conditions && formData.conditions.length > 0 && (
              <div className="space-y-2 mb-3">
                {formData.conditions.map((condition, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                    <span className="text-sm text-gray-700">{condition}</span>
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
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
            
            {/* Add Condition */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Add approval condition..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
              />
              <button
                type="button"
                onClick={addCondition}
                disabled={!conditionInput.trim()}
                className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            {errors.conditions && (
              <span className="text-xs text-red-500">{errors.conditions}</span>
            )}
          </div>
        )}

        {/* Agent Instructions */}
        {config.showAgentInstructions && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Instructions {config.requiredFields.includes('agentInstructions') && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={formData.agentInstructions || ''}
              onChange={(e) => handleInputChange('agentInstructions', e.target.value)}
              rows={3}
              className={`block w-full border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                errors.agentInstructions ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Specific instructions for the field agent..."
            />
            {errors.agentInstructions && (
              <span className="text-xs text-red-500">{errors.agentInstructions}</span>
            )}
          </div>
        )}

        {/* Priority and Follow-up */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <select
              value={formData.priority || 'medium'}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {config.showFollowUp && (
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <input
                  type="checkbox"
                  checked={formData.followUpRequired || false}
                  onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Follow-up Required</span>
              </label>
              {formData.followUpRequired && (
                <input
                  type="date"
                  value={formData.followUpDate || ''}
                  onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                  min={getTomorrowDate()}
                  className={`block w-full border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                    errors.followUpDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              )}
              {errors.followUpDate && (
                <span className="text-xs text-red-500">{errors.followUpDate}</span>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        {config.showCustomerNotification && (
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={formData.customerNotification || false}
                onChange={(e) => handleInputChange('customerNotification', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Send notification to customer</span>
            </label>
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (Optional)
          </label>
          
          {/* Existing Tags */}
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* Add Tag */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Add tag..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button
              type="button"
              onClick={addTag}
              disabled={!tagInput.trim()}
              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Tag
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              `Submit ${selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1).replace('_', ' ')} Decision`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};