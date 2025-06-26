'use client';

import React, { useState } from 'react';
import type { ApprovalWorkflow, ApprovalAction, WorkflowPermissions } from '../../../../types/approval';
import { 
  useApproveWorkflowMutation,
  useRejectWorkflowMutation,
  useEscalateWorkflowMutation,
  useRequestAdditionalInfoMutation
} from '../../../../store/api/approvalApi';

interface ActionButtonsProps {
  workflow: ApprovalWorkflow;
  availableActions: ApprovalAction[];
  permissions?: WorkflowPermissions;
  onActionSelect: (action: ApprovalAction) => void;
  selectedAction: ApprovalAction | null;
  disabled?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  workflow,
  availableActions,
  permissions,
  onActionSelect,
  selectedAction,
  disabled = false
}) => {
  const [hoveredAction, setHoveredAction] = useState<ApprovalAction | null>(null);

  // Action configurations with detailed metadata
  const actionConfig = {
    approve: {
      label: 'Approve',
      shortLabel: 'Approve',
      color: 'success',
      bgColor: 'bg-success-600 hover:bg-success-700 focus:ring-success-500',
      textColor: 'text-success-700',
      borderColor: 'border-success-300',
      bgHover: 'bg-success-50',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      description: 'Approve this withdrawal request and advance to next stage',
      riskLevel: 'low',
      requiresJustification: true,
      minNoteLength: 20
    },
    reject: {
      label: 'Reject',
      shortLabel: 'Reject',
      color: 'danger',
      bgColor: 'bg-danger-600 hover:bg-danger-700 focus:ring-danger-500',
      textColor: 'text-danger-700',
      borderColor: 'border-danger-300',
      bgHover: 'bg-danger-50',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      description: 'Reject this withdrawal request with detailed reasoning',
      riskLevel: 'medium',
      requiresJustification: true,
      minNoteLength: 50
    },
    escalate: {
      label: 'Escalate',
      shortLabel: 'Escalate',
      color: 'warning',
      bgColor: 'bg-warning-600 hover:bg-warning-700 focus:ring-warning-500',
      textColor: 'text-warning-700',
      borderColor: 'border-warning-300',
      bgHover: 'bg-warning-50',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      ),
      description: 'Escalate to higher authority level for review',
      riskLevel: 'medium',
      requiresJustification: true,
      minNoteLength: 30
    },
    request_info: {
      label: 'Request Information',
      shortLabel: 'Request Info',
      color: 'info',
      bgColor: 'bg-info-600 hover:bg-info-700 focus:ring-info-500',
      textColor: 'text-info-700',
      borderColor: 'border-info-300',
      bgHover: 'bg-info-50',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'Request additional information from agent or customer',
      riskLevel: 'low',
      requiresJustification: true,
      minNoteLength: 25
    },
    conditional_approve: {
      label: 'Conditional Approval',
      shortLabel: 'Conditional',
      color: 'primary',
      bgColor: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
      textColor: 'text-primary-700',
      borderColor: 'border-primary-300',
      bgHover: 'bg-primary-50',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      description: 'Approve with specific conditions that must be met',
      riskLevel: 'medium',
      requiresJustification: true,
      minNoteLength: 40
    },
    override: {
      label: 'Override',
      shortLabel: 'Override',
      color: 'red',
      bgColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      textColor: 'text-red-700',
      borderColor: 'border-red-300',
      bgHover: 'bg-red-50',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      description: 'Override system decision with admin authorization',
      riskLevel: 'high',
      requiresJustification: true,
      minNoteLength: 100
    }
  };

  const canPerformAction = (action: ApprovalAction): boolean => {
    if (disabled) return false;
    
    switch (action) {
      case 'approve':
        return permissions?.canApprove ?? false;
      case 'reject':
        return permissions?.canReject ?? false;
      case 'escalate':
        return permissions?.canEscalate ?? false;
      case 'request_info':
        return true; // Always available
      case 'conditional_approve':
        return permissions?.canApprove ?? false;
      case 'override':
        return permissions?.canOverride ?? false;
      default:
        return false;
    }
  };

  const getActionUrgency = (action: ApprovalAction): string => {
    const config = actionConfig[action];
    switch (config?.riskLevel) {
      case 'high':
        return 'Requires special authorization';
      case 'medium':
        return 'Requires careful consideration';
      case 'low':
        return 'Standard action';
      default:
        return '';
    }
  };

  const getEstimatedTime = (action: ApprovalAction): string => {
    switch (action) {
      case 'approve':
        return '2-5 minutes';
      case 'reject':
        return '5-10 minutes';
      case 'escalate':
        return '3-7 minutes';
      case 'request_info':
        return '3-5 minutes';
      case 'conditional_approve':
        return '7-15 minutes';
      case 'override':
        return '10-20 minutes';
      default:
        return 'Variable';
    }
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-900">Available Actions</h4>
        <span className="text-xs text-gray-500">
          {availableActions.length} option{availableActions.length !== 1 ? 's' : ''} available
        </span>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 gap-3">
        {availableActions.map((action) => {
          const config = actionConfig[action];
          if (!config) return null;

          const canPerform = canPerformAction(action);
          const isSelected = selectedAction === action;
          const isHovered = hoveredAction === action;

          return (
            <button
              key={action}
              onClick={() => canPerform && onActionSelect(action)}
              onMouseEnter={() => setHoveredAction(action)}
              onMouseLeave={() => setHoveredAction(null)}
              disabled={!canPerform}
              className={`relative w-full p-4 text-left border-2 rounded-lg transition-all duration-200 group ${
                isSelected
                  ? `${config.borderColor} ${config.bgHover} shadow-lg`
                  : canPerform
                  ? 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                {/* Action Content */}
                <div className="flex items-start space-x-3 flex-1">
                  {/* Action Icon */}
                  <div className={`p-2 rounded-lg transition-colors ${
                    isSelected
                      ? `bg-${config.color}-100`
                      : canPerform
                      ? 'bg-gray-100 group-hover:bg-gray-200'
                      : 'bg-gray-100'
                  }`}>
                    <div className={`${
                      isSelected
                        ? config.textColor
                        : canPerform
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>
                      {config.icon}
                    </div>
                  </div>

                  {/* Action Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h5 className={`text-sm font-medium ${
                        isSelected
                          ? config.textColor
                          : canPerform
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }`}>
                        {config.label}
                      </h5>
                      
                      {/* Risk Level Badge */}
                      {config.riskLevel === 'high' && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          High Risk
                        </span>
                      )}
                      {config.riskLevel === 'medium' && (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Medium Risk
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-xs mt-1 ${
                      canPerform ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {config.description}
                    </p>

                    {/* Additional Info on Hover */}
                    {(isHovered || isSelected) && canPerform && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{getActionUrgency(action)}</span>
                          <span>Est. {getEstimatedTime(action)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="flex-shrink-0 ml-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${config.bgColor.split(' ')[0]}`}>
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Disabled Indicator */}
                {!canPerform && (
                  <div className="flex-shrink-0 ml-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Permission Warning */}
              {!canPerform && (
                <div className="mt-2 text-xs text-gray-400">
                  {action === 'override' ? 'Requires admin privileges' :
                   action === 'approve' || action === 'conditional_approve' ? 'Approval permission required' :
                   action === 'reject' ? 'Rejection permission required' :
                   action === 'escalate' ? 'Escalation permission required' :
                   'Insufficient permissions'}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Action Summary */}
      {selectedAction && (
        <div className={`p-3 rounded-lg border ${actionConfig[selectedAction]?.borderColor} ${actionConfig[selectedAction]?.bgHover}`}>
          <div className="flex items-center space-x-2">
            <div className={actionConfig[selectedAction]?.textColor}>
              {actionConfig[selectedAction]?.icon}
            </div>
            <div>
              <h6 className={`text-sm font-medium ${actionConfig[selectedAction]?.textColor}`}>
                {actionConfig[selectedAction]?.label} Selected
              </h6>
              <p className="text-xs text-gray-600 mt-1">
                Minimum note length: {actionConfig[selectedAction]?.minNoteLength} characters
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Workflow State Warning */}
      {workflow.status !== 'pending' && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-gray-600">
              This workflow is {workflow.status}. No actions available.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};