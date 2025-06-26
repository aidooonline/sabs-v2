'use client';

import React from 'react';
import type { ApprovalWorkflow } from '../../../../../types/approval';
import { formatCurrency, formatRelativeTime } from '../../../../../utils/approvalHelpers';

interface CustomerVerificationProps {
  workflow: ApprovalWorkflow;
  refreshKey: number;
}

export const CustomerVerification: React.FC<CustomerVerificationProps> = ({
  workflow
}) => {
  const customer = workflow.withdrawalRequest.customer;

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Customer Verification</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customer Information */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Personal Information</h4>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Full Name:</span>
              <span className="text-sm font-medium text-gray-900">{customer.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Account Number:</span>
              <span className="text-sm font-medium font-mono text-gray-900">{customer.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Phone Number:</span>
              <span className="text-sm font-medium text-gray-900">{customer.phoneNumber}</span>
            </div>
            {customer.email && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm font-medium text-gray-900">{customer.email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">ID Type:</span>
              <span className="text-sm font-medium text-gray-900">{customer.idType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">ID Number:</span>
              <span className="text-sm font-medium font-mono text-gray-900">{customer.idNumber}</span>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Account Status</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                customer.accountStatus === 'active' ? 'bg-green-100 text-green-800' :
                customer.accountStatus === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {customer.accountStatus.charAt(0).toUpperCase() + customer.accountStatus.slice(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current Balance:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(customer.accountBalance, workflow.withdrawalRequest.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8">
        <h4 className="text-md font-medium text-gray-900 mb-4">Recent Transactions</h4>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customer.recentTransactions.slice(0, 5).map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatRelativeTime(transaction.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.type === 'deposit' ? 'bg-green-100 text-green-800' :
                      transaction.type === 'withdrawal' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {transaction.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Profile */}
      <div className="mt-8">
        <h4 className="text-md font-medium text-gray-900 mb-4">Risk Profile</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-600">Risk Level:</span>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  customer.riskProfile.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                  customer.riskProfile.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {customer.riskProfile.riskLevel.charAt(0).toUpperCase() + customer.riskProfile.riskLevel.slice(1)}
                </span>
              </div>
            </div>
            
            {customer.riskProfile.creditScore && (
              <div>
                <span className="text-sm text-gray-600">Credit Score:</span>
                <div className="mt-1 text-sm font-medium text-gray-900">
                  {customer.riskProfile.creditScore}
                </div>
              </div>
            )}
            
            <div>
              <span className="text-sm text-gray-600">Last Assessment:</span>
              <div className="mt-1 text-sm text-gray-900">
                {formatRelativeTime(customer.riskProfile.lastAssessment)}
              </div>
            </div>
          </div>
          
          {customer.riskProfile.riskFactors.length > 0 && (
            <div className="mt-4">
              <span className="text-sm text-gray-600">Risk Factors:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {customer.riskProfile.riskFactors.map((factor, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};