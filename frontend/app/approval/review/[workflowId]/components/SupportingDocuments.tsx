'use client';

import React from 'react';
import type { ApprovalWorkflow, WorkflowPermissions } from '../../../../../types/approval';

interface SupportingDocumentsProps {
  workflow: ApprovalWorkflow;
  permissions?: WorkflowPermissions;
  refreshKey: number;
}

export const SupportingDocuments: React.FC<SupportingDocumentsProps> = ({
  workflow,
  permissions,
  refreshKey
}) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Supporting Documents</h3>
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Supporting Documents</h3>
        <p className="text-gray-600">
          Document verification and management features will be implemented here
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <p>Documents: {workflow.withdrawalRequest.documents.length}</p>
        </div>
      </div>
    </div>
  );
};