'use client';

import React from 'react';
import type { ApprovalWorkflow } from '../../../../../types/approval';

interface RiskAssessmentProps {
  workflow: ApprovalWorkflow;
  refreshKey: number;
}

export const RiskAssessment: React.FC<RiskAssessmentProps> = ({
  workflow
}) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Risk Assessment</h3>
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.174 0 2.078-1.038 1.859-2.168l-6.938-12.83c-.382-.768-1.479-.768-1.862 0L4.069 20.832C3.85 21.962 4.755 23 5.929 23z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Risk Assessment</h3>
        <p className="text-gray-600">
          Risk analysis and assessment details will be displayed here
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <p>Overall Risk: {workflow.riskAssessment.overallRisk}</p>
          <p>Risk Score: {workflow.riskAssessment.riskScore}</p>
        </div>
      </div>
    </div>
  );
};