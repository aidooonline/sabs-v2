'use client';

import React from 'react';
import type { ApprovalWorkflow } from '../../../../../types/approval';

interface TransactionAnalysisProps {
  workflow: ApprovalWorkflow;
  refreshKey: number;
}

export const TransactionAnalysis: React.FC<TransactionAnalysisProps> = ({
  workflow
}) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Transaction Analysis</h3>
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Transaction Analysis</h3>
        <p className="text-gray-600">
          Detailed transaction analysis will be implemented here
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <p>Amount: {workflow.withdrawalRequest.amount} {workflow.withdrawalRequest.currency}</p>
          <p>Requested: {new Date(workflow.withdrawalRequest.requestedAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};