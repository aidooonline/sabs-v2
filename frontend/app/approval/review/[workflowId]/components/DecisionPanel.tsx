'use client';

import React, { useState } from 'react';
import type { ApprovalWorkflow, ApprovalAction, WorkflowPermissions } from '../../../../../types/approval';
import { 
  useApproveWorkflowMutation,
  useRejectWorkflowMutation,
  useEscalateWorkflowMutation,
  useRequestAdditionalInfoMutation
} from '../../../../../store/api/approvalApi';

interface DecisionPanelProps {
  workflow: ApprovalWorkflow;
  availableActions: ApprovalAction[];
  permissions?: WorkflowPermissions;
  onDecisionMade: () => void;
}

export const DecisionPanel: React.FC<DecisionPanelProps> = ({
  workflow,
  availableActions,
  permissions,
  onDecisionMade
}) => {
  const [selectedAction, setSelectedAction] = useState<ApprovalAction | null>(null);
  const [notes, setNotes] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Mutations
  const [approveWorkflow, { isLoading: isApproving }] = useApproveWorkflowMutation();
  const [rejectWorkflow, { isLoading: isRejecting }] = useRejectWorkflowMutation();
  const [escalateWorkflow, { isLoading: isEscalating }] = useEscalateWorkflowMutation();
  const [requestInfo, { isLoading: isRequestingInfo }] = useRequestAdditionalInfoMutation();

  const isLoading = isApproving || isRejecting || isEscalating || isRequestingInfo;

  const handleActionSelect = (action: ApprovalAction) => {
    setSelectedAction(action);
    setNotes('');
    setConditions([]);
    setConditionInput('');
    setAuthCode('');
  };

  const addCondition = () => {
    if (conditionInput.trim() && !conditions.includes(conditionInput.trim())) {
      setConditions([...conditions, conditionInput.trim()]);
      setConditionInput('');
    }
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleSubmitDecision = () => {
    if (!selectedAction || !notes.trim()) return;
    setShowAuthModal(true);
  };

  const executeDecision = async () => {
    if (!selectedAction || !authCode || !notes.trim()) return;

    try {
      const payload = {
        workflowId: workflow.id,
        action: selectedAction,
        notes: notes.trim(),
        conditions: conditions.length > 0 ? conditions : undefined,
        authorizationMethod: 'pin' as const,
        authorizationCode: authCode
      };

      let result;
      switch (selectedAction) {
        case 'approve':
          result = await approveWorkflow(payload).unwrap();
          break;
        case 'reject':
          result = await rejectWorkflow(payload).unwrap();
          break;
        case 'escalate':
          result = await escalateWorkflow({
            workflowId: workflow.id,
            reason: notes.trim(),
            escalateTo: 'manager',
            notes: notes.trim()
          }).unwrap();
          break;
        case 'request_info':
          result = await requestInfo(payload).unwrap();
          break;
        default:
          console.error('Unknown action:', selectedAction);
          return;
      }

      console.log(`${selectedAction} completed:`, result);
      
      // Reset form and close modal
      setShowAuthModal(false);
      setSelectedAction(null);
      setNotes('');
      setConditions([]);
      setAuthCode('');
      onDecisionMade();
      
    } catch (error) {
      console.error(`${selectedAction} failed:`, error);
      // Handle error - show notification
    }
  };

  const actionConfig = {
    approve: {
      label: 'Approve',
      color: 'bg-success-600 hover:bg-success-700 focus:ring-success-500',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      description: 'Approve this withdrawal request'
    },
    reject: {
      label: 'Reject',
      color: 'bg-danger-600 hover:bg-danger-700 focus:ring-danger-500',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      description: 'Reject this withdrawal request'
    },
    escalate: {
      label: 'Escalate',
      color: 'bg-warning-600 hover:bg-warning-700 focus:ring-warning-500',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      ),
      description: 'Escalate to higher authority'
    },
    request_info: {
      label: 'Request Info',
      color: 'bg-info-600 hover:bg-info-700 focus:ring-info-500',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'Request additional information'
    },
    conditional_approve: {
      label: 'Conditional Approve',
      color: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      description: 'Approve with conditions'
    },
    override: {
      label: 'Override',
      color: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.174 0 2.078-1.038 1.859-2.168l-6.938-12.83c-.382-.768-1.479-.768-1.862 0L4.069 20.832C3.85 21.962 4.755 23 5.929 23z" />
        </svg>
      ),
      description: 'Override system decision'
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Decision Panel</h3>
          
          {workflow.status !== 'pending' ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Workflow Completed</h3>
              <p className="mt-1 text-sm text-gray-500">
                This workflow has already been processed.
              </p>
            </div>
          ) : (
            <>
              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                {availableActions.map((action) => {
                  const config = actionConfig[action];
                  if (!config) return null;

                  const canPerformAction = 
                    (action === 'approve' && permissions?.canApprove) ||
                    (action === 'reject' && permissions?.canReject) ||
                    (action === 'escalate' && permissions?.canEscalate) ||
                    (action === 'request_info') ||
                    (action === 'conditional_approve' && permissions?.canApprove) ||
                    (action === 'override' && permissions?.canOverride);

                  return (
                    <button
                      key={action}
                      onClick={() => handleActionSelect(action)}
                      disabled={!canPerformAction || isLoading}
                      className={`w-full flex items-center justify-between p-3 text-left border-2 rounded-lg transition-all ${
                        selectedAction === action
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${
                        !canPerformAction ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${
                          selectedAction === action ? 'bg-primary-100' : 'bg-gray-100'
                        }`}>
                          {config.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {config.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {config.description}
                          </p>
                        </div>
                      </div>
                      
                      {selectedAction === action && (
                        <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Decision Form */}
              {selectedAction && (
                <div className="space-y-4">
                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Decision Notes <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder={`Provide detailed notes for this ${selectedAction} decision...`}
                      required
                    />
                  </div>

                  {/* Conditions (for conditional approval) */}
                  {selectedAction === 'conditional_approve' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approval Conditions
                      </label>
                      
                      {/* Existing Conditions */}
                      {conditions.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {conditions.map((condition, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm text-gray-700">{condition}</span>
                              <button
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
                          onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                        />
                        <button
                          onClick={addCondition}
                          disabled={!conditionInput.trim()}
                          className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitDecision}
                    disabled={!notes.trim() || isLoading}
                    className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      actionConfig[selectedAction]?.color || 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
                    }`}
                  >
                    {isLoading ? (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      actionConfig[selectedAction]?.icon
                    )}
                    <span className="ml-2">
                      {isLoading ? 'Processing...' : `Submit ${actionConfig[selectedAction]?.label}`}
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Authorization Modal */}
      {showAuthModal && selectedAction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Confirm {actionConfig[selectedAction]?.label}
                </h3>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                You are about to {selectedAction} workflow {workflow.workflowNumber}. 
                This action cannot be undone.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Authorization PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your PIN"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDecision}
                  disabled={!authCode || isLoading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    actionConfig[selectedAction]?.color || 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
                  }`}
                >
                  {isLoading ? 'Processing...' : `Confirm ${actionConfig[selectedAction]?.label}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};