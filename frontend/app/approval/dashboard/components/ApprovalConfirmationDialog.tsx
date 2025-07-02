'use client';

import React from 'react';

interface ApprovalConfirmationDialogProps {
  isOpen: boolean;
  workflowNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ApprovalConfirmationDialog: React.FC<ApprovalConfirmationDialogProps> = ({
  isOpen,
  workflowNumber,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div 
        className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
        data-testid="approval-confirmation-dialog"
      >
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Confirm Approval
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to approve workflow {workflowNumber}? This action cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-success-600 hover:bg-success-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success-500"
              data-testid="confirm-approve-button"
            >
              Confirm Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};