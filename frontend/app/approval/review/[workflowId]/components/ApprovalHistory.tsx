'use client';

import React from 'react';
import type { ApprovalWorkflow } from '../../../../../types/approval';

interface ApprovalHistoryProps {
  workflow: ApprovalWorkflow;
  refreshKey: number;
}

export const ApprovalHistory: React.FC<ApprovalHistoryProps> = ({
  workflow
}) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Approval History</h3>
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Approval History</h3>
        <p className="text-gray-600">
          Complete approval history and audit trail will be displayed here
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <p>History entries: {workflow.approvalHistory.length}</p>
        </div>
      </div>
    </div>
  );
};