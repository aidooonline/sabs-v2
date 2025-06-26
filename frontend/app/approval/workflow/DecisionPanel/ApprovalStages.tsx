'use client';

import React from 'react';
import type { ApprovalWorkflow, ApprovalStage } from '../../../../types/approval';
import { getStageLabel } from '../../../../utils/approvalHelpers';

interface ApprovalStagesProps {
  workflow: ApprovalWorkflow;
  className?: string;
}

export const ApprovalStages: React.FC<ApprovalStagesProps> = ({ 
  workflow, 
  className = '' 
}) => {
  // Define the workflow stages in order
  const workflowStages: ApprovalStage[] = [
    'clerk_review',
    'manager_review', 
    'admin_review',
    'final_authorization',
    'completed'
  ];

  const getCurrentStageIndex = () => {
    return workflowStages.indexOf(workflow.currentStage);
  };

  const getStageStatus = (stage: ApprovalStage, index: number) => {
    const currentIndex = getCurrentStageIndex();
    
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'upcoming';
  };

  const getStageIcon = (stage: ApprovalStage, status: 'completed' | 'current' | 'upcoming') => {
    if (status === 'completed') {
      return (
        <div className="w-8 h-8 bg-success-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    
    if (status === 'current') {
      return (
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
        </div>
      );
    }
    
    // Upcoming stage icons based on stage type
    const stageIcons = {
      clerk_review: (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      manager_review: (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0h3m2 0h5M9 7h6m-6 4h6m-2 8l2-2m0 0l2 2m-2-2v6" />
        </svg>
      ),
      admin_review: (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      final_authorization: (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      completed: (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
    
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
        {stageIcons[stage as keyof typeof stageIcons]}
      </div>
    );
  };

  const getCompletionTime = (stage: ApprovalStage) => {
    const decision = workflow.approvalHistory.find((d: any) => d.stage === stage);
    if (decision) {
      return new Date(decision.timestamp).toLocaleString('en-GH', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return null;
  };

  const getSLAStatus = () => {
    const now = new Date();
    const dueDate = new Date(workflow.dueDate);
    const escalationDate = workflow.escalationDate ? new Date(workflow.escalationDate) : null;
    
    if (now > dueDate) return 'overdue';
    if (escalationDate && now > escalationDate) return 'at_risk';
    return 'on_track';
  };

  const slaStatus = getSLAStatus();
  const slaColors = {
    on_track: 'text-success-600 bg-success-50',
    at_risk: 'text-warning-600 bg-warning-50', 
    overdue: 'text-danger-600 bg-danger-50'
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Approval Workflow Progress</h3>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${slaColors[slaStatus]}`}>
            {slaStatus === 'on_track' && '✓ On Track'}
            {slaStatus === 'at_risk' && '⚠ At Risk'}
            {slaStatus === 'overdue' && '🚨 Overdue'}
          </div>
        </div>

        {/* Workflow Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {workflowStages.map((stage, index) => {
              const status = getStageStatus(stage, index);
              const completionTime = getCompletionTime(stage);
              const isLast = index === workflowStages.length - 1;
              
              return (
                <div key={stage} className="flex items-center">
                  {/* Stage Circle */}
                  <div className="flex flex-col items-center">
                    {getStageIcon(stage, status)}
                    <div className="mt-2 text-center">
                      <p className={`text-xs font-medium ${
                        status === 'current' ? 'text-primary-600' :
                        status === 'completed' ? 'text-success-600' :
                        'text-gray-400'
                      }`}>
                        {getStageLabel(stage)}
                      </p>
                      {completionTime && (
                        <p className="text-xs text-gray-500 mt-1">
                          {completionTime}
                        </p>
                      )}
                      {status === 'current' && (
                        <p className="text-xs text-primary-600 mt-1 font-medium">
                          In Progress
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Line */}
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      status === 'completed' ? 'bg-success-400' :
                      status === 'current' ? 'bg-gradient-to-r from-success-400 to-gray-200' :
                      'bg-gray-200'
                    }`}>
                      {status === 'current' && (
                        <div className="h-full bg-gradient-to-r from-success-400 to-primary-400 animate-pulse"></div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Current Stage</h4>
            <p className="text-lg font-semibold text-primary-600">
              {getStageLabel(workflow.currentStage)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {workflow.currentApprover ? `Assigned to: ${workflow.currentApprover}` : 'Awaiting assignment'}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">SLA Status</h4>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(workflow.dueDate).toLocaleDateString('en-GH', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Due date
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Progress</h4>
            <p className="text-lg font-semibold text-gray-900">
              {workflow.approvalHistory.length} / {workflowStages.length - 1}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Stages completed
            </p>
          </div>
        </div>

        {/* Next Steps */}
        {workflow.status === 'pending' && (
          <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <h4 className="text-sm font-medium text-primary-900 mb-2">Next Steps</h4>
            <p className="text-sm text-primary-800">
              This workflow is currently at the <strong>{getStageLabel(workflow.currentStage)}</strong> stage.
              {workflow.currentApprover && ` Assigned to ${workflow.currentApprover}.`}
              {!workflow.currentApprover && ' Awaiting assignment to an available approver.'}
            </p>
          </div>
        )}

        {/* Escalation Warning */}
        {workflow.escalationDate && new Date() > new Date(workflow.escalationDate) && (
          <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-warning-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-warning-900">Escalation Required</h4>
                <p className="text-sm text-warning-800 mt-1">
                  This workflow has exceeded its escalation threshold and should be escalated to the next level.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};