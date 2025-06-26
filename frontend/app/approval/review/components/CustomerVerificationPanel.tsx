'use client';

import { ApprovalWorkflow } from '../../../../types/approval';

interface CustomerVerificationPanelProps {
  customer: any;
  workflow: ApprovalWorkflow;
  isLoading: boolean;
}

export const CustomerVerificationPanel = ({ customer, workflow, isLoading }: CustomerVerificationPanelProps) => {
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

  const customerInfo = workflow.withdrawalRequest?.customer;

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Verification</h3>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-gray-500">Full Name</dt>
          <dd className="mt-1 text-sm text-gray-900">{customerInfo?.fullName || customer?.name || 'N/A'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Account Number</dt>
          <dd className="mt-1 text-sm text-gray-900">{customerInfo?.accountNumber || 'N/A'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
          <dd className="mt-1 text-sm text-gray-900">{customerInfo?.phoneNumber || customer?.phone || 'N/A'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Email</dt>
          <dd className="mt-1 text-sm text-gray-900">{customerInfo?.email || customer?.email || 'N/A'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">ID Number</dt>
          <dd className="mt-1 text-sm text-gray-900">{customerInfo?.idNumber || customer?.idNumber || 'N/A'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Account Status</dt>
          <dd className="mt-1">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              customerInfo?.accountStatus === 'active' ? 'bg-green-100 text-green-800' :
              customerInfo?.accountStatus === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {customerInfo?.accountStatus || 'Unknown'}
            </span>
          </dd>
        </div>
      </div>
    </div>
  );
};