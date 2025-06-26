'use client';

import { ApprovalWorkflow } from '../../../../types/approval';

interface RequestDetailsPanelProps {
  workflow: ApprovalWorkflow;
  isLoading: boolean;
}

export const RequestDetailsPanel = ({ workflow, isLoading }: RequestDetailsPanelProps) => {
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Request Details</h3>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-gray-500">Request ID</dt>
          <dd className="mt-1 text-sm text-gray-900">{workflow.id}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Type</dt>
          <dd className="mt-1 text-sm text-gray-900">Withdrawal Request</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Amount</dt>
          <dd className="mt-1 text-sm text-gray-900">
            GHS {workflow.withdrawalRequest?.amount?.toLocaleString() || '0.00'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Status</dt>
          <dd className="mt-1">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              workflow.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              workflow.status === 'approved' ? 'bg-green-100 text-green-800' :
              workflow.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {workflow.status}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Created At</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {new Date(workflow.createdAt).toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Priority</dt>
          <dd className="mt-1">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              workflow.priority === 'high' ? 'bg-red-100 text-red-800' :
              workflow.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {workflow.priority || 'Normal'}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Current Stage</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {workflow.currentStage.replace('_', ' ').toUpperCase()}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Due Date</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {new Date(workflow.dueDate).toLocaleString()}
          </dd>
        </div>
      </div>
      
      {workflow.description && (
        <div className="mt-6">
          <dt className="text-sm font-medium text-gray-500">Description</dt>
          <dd className="mt-1 text-sm text-gray-900">{workflow.description}</dd>
        </div>
      )}
    </div>
  );
};