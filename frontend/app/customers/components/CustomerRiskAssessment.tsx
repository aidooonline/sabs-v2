'use client';

import React from 'react';
import type { Customer, RiskLevel } from '../../../types/customer';

interface CustomerRiskAssessmentProps {
  customer: Customer;
  riskLevel: RiskLevel;
  editMode: boolean;
}

export const CustomerRiskAssessment: React.FC<CustomerRiskAssessmentProps> = ({
  customer,
  riskLevel,
  editMode,
}) => {
  return (
    <div className="customer-risk-assessment p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
      <div className="text-center py-8">
        <div className="text-gray-500">Risk assessment details will be displayed here</div>
        <div className="text-sm text-gray-400 mt-2">
          Customer: {customer.firstName} {customer.lastName}
        </div>
        <div className="text-sm text-gray-400">
          Current Risk Level: {riskLevel} | Edit Mode: {editMode ? 'On' : 'Off'}
        </div>
      </div>
    </div>
  );
};