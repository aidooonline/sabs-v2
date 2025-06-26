'use client';

import { ApprovalWorkflow } from '../../../../types/approval';

interface AgentInformationPanelProps {
  agent: any;
  workflow: ApprovalWorkflow;
  isLoading: boolean;
}

export const AgentInformationPanel = ({ agent, workflow, isLoading }: AgentInformationPanelProps) => {
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

  const agentInfo = workflow.withdrawalRequest?.agent;

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Information</h3>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-gray-500">Agent Name</dt>
          <dd className="mt-1 text-sm text-gray-900">{agentInfo?.fullName || agent?.name || 'N/A'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Employee ID</dt>
          <dd className="mt-1 text-sm text-gray-900">{agentInfo?.employeeId || 'N/A'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
          <dd className="mt-1 text-sm text-gray-900">{agentInfo?.phoneNumber || agent?.phone || 'N/A'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Location</dt>
          <dd className="mt-1 text-sm text-gray-900">{agent?.location || 'N/A'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Status</dt>
          <dd className="mt-1">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              agentInfo?.status === 'active' ? 'bg-green-100 text-green-800' :
              agentInfo?.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
            }`}>
              {agentInfo?.status || 'Active'}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Performance Rating</dt>
          <dd className="mt-1 text-sm text-gray-900">{agent?.rating || 'N/A'}</dd>
        </div>
      </div>
    </div>
  );
};