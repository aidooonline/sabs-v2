'use client';

import React from 'react';
import Link from 'next/link';
import type { ApprovalWorkflow } from '../../../../types/approval';
import { 
  getStatusLabel, 
  getStatusColor, 
  getPriorityLabel, 
  getPriorityColor,
  getRiskLevelLabel,
  getRiskLevelColor,
  formatCurrency, 
  formatRelativeTime,
  calculateWorkflowUrgency,
  calculateSLAStatus
} from '../../../../utils/approvalHelpers';

interface ApprovalQueueProps {
  workflows: ApprovalWorkflow[];
  selectedWorkflows: string[];
  onWorkflowSelect: (workflowId: string, selected: boolean) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

const WorkflowCard: React.FC<{
  workflow: ApprovalWorkflow;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}> = ({ workflow, isSelected, onSelect }) => {
  const urgencyScore = calculateWorkflowUrgency(workflow);
  const slaStatus = calculateSLAStatus(workflow);

  return (
    <div className={`approval-card ${isSelected ? 'selected' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <div>
            <Link 
              href={`/approval/review/${workflow.id}`}
              className="text-sm font-medium text-primary-600 hover:text-primary-800"
            >
              {workflow.workflowNumber}
            </Link>
            <p className="text-xs text-gray-500">
              {formatRelativeTime(workflow.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
            {getStatusLabel(workflow.status)}
          </span>
          
          {urgencyScore >= 70 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Urgent
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Customer:</span>
          <span className="text-sm font-medium text-gray-900">
            {workflow.withdrawalRequest.customer.fullName}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Amount:</span>
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(workflow.withdrawalRequest.amount, workflow.withdrawalRequest.currency)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Agent:</span>
          <span className="text-sm text-gray-700">
            {workflow.withdrawalRequest.agent.fullName}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Priority:</span>
          <span className={`text-sm font-medium ${getPriorityColor(workflow.priority)}`}>
            {getPriorityLabel(workflow.priority)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Risk Level:</span>
          <div className="flex items-center space-x-2">
            <div className={`risk-indicator-${workflow.riskAssessment.overallRisk}`} />
            <span className={`text-sm font-medium ${getRiskLevelColor(workflow.riskAssessment.overallRisk)}`}>
              {getRiskLevelLabel(workflow.riskAssessment.overallRisk)}
            </span>
          </div>
        </div>
      </div>

      {/* SLA Progress Bar */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-600">SLA Progress</span>
          <span className={`text-xs font-medium ${
            slaStatus.status === 'breached' ? 'text-red-600' :
            slaStatus.status === 'at_risk' ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {Math.round(slaStatus.percentageUsed)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              slaStatus.status === 'breached' ? 'bg-red-500' :
              slaStatus.status === 'at_risk' ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(slaStatus.percentageUsed, 100)}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Stage: {workflow.currentStage.replace('_', ' ')}
          </span>
          <div className="flex space-x-2">
            <Link
              href={`/approval/review/${workflow.id}`}
              className="approval-button approval-button-escalate text-xs px-3 py-1"
            >
              Review
            </Link>
            {workflow.status === 'pending' && (
              <>
                <button className="approval-button approval-button-approve text-xs px-3 py-1">
                  Quick Approve
                </button>
                <button className="approval-button approval-button-reject text-xs px-3 py-1">
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  workflows,
  selectedWorkflows,
  onWorkflowSelect,
  pagination,
  onPageChange,
  isLoading
}) => {
  if (workflows.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
        <p className="mt-1 text-sm text-gray-500">
          All workflows have been processed or there are no active requests.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Workflows Grid */}
      <div className="approval-queue mb-6">
        {workflows.map((workflow) => (
          <WorkflowCard
            key={workflow.id}
            workflow={workflow}
            isSelected={selectedWorkflows.includes(workflow.id)}
            onSelect={(selected) => onWorkflowSelect(workflow.id, selected)}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevious}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.currentPage - 1) * 20 + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * 20, pagination.totalCount)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{pagination.totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevious}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = pagination.currentPage - 2 + i;
                  if (pageNum < 1 || pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === pagination.currentPage
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};