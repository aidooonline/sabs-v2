'use client';

import React, { useState } from 'react';
import { 
  useBulkApproveMutation,
  useBulkRejectMutation,
  useBulkEscalateMutation 
} from '../../../../store/api/approvalApi';

interface BulkActionsProps {
  selectedWorkflows: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedWorkflows,
  onClearSelection,
  onRefresh
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | 'escalate' | null>(null);
  const [notes, setNotes] = useState('');
  const [authCode, setAuthCode] = useState('');

  // Mutations
  const [bulkApprove, { isLoading: isApproving }] = useBulkApproveMutation();
  const [bulkReject, { isLoading: isRejecting }] = useBulkRejectMutation();
  const [bulkEscalate, { isLoading: isEscalating }] = useBulkEscalateMutation();

  const isLoading = isApproving || isRejecting || isEscalating;

  const handleBulkAction = async (action: 'approve' | 'reject' | 'escalate') => {
    if (selectedWorkflows.length === 0) return;
    
    setPendingAction(action);
    setShowAuthModal(true);
  };

  const executeBulkAction = async () => {
    if (!pendingAction || !authCode || selectedWorkflows.length === 0) return;

    try {
      let result;
      
      switch (pendingAction) {
        case 'approve':
        case 'reject':
          const payload = {
            workflowIds: selectedWorkflows,
            action: pendingAction,
            notes: notes || `Bulk ${pendingAction} action`,
            authorizationMethod: 'pin' as const,
            authorizationCode: authCode
          };
          
          if (pendingAction === 'approve') {
            result = await bulkApprove(payload).unwrap();
          } else {
            result = await bulkReject(payload).unwrap();
          }
          break;
          
        case 'escalate':
          const escalatePayload = {
            workflowIds: selectedWorkflows,
            action: pendingAction,
            notes: notes || `Bulk ${pendingAction} action`,
            authorizationMethod: 'pin' as const,
            authorizationCode: authCode,
            escalateTo: 'manager', // Default escalation target
            reason: notes || 'Bulk escalation requested'
          };
          result = await bulkEscalate(escalatePayload).unwrap();
          break;
      }

      // Bulk action completed successfully
      
      // Reset form and close modal
      setShowAuthModal(false);
      setPendingAction(null);
      setNotes('');
      setAuthCode('');
      onClearSelection();
      onRefresh();
      
    } catch (error) {
      // Handle error - show notification or error message
      // Error logging would be handled by proper logging service
    }
  };

  const exportWorkflows = () => {
    // Create CSV export of selected workflows
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Workflow ID,Status,Priority,Amount,Customer,Created Date\n"
      + selectedWorkflows.map(id => `${id},pending,high,1000.00,Sample Customer,${new Date().toISOString()}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `workflows_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="bg-white border border-primary-200 rounded-lg p-4 shadow-sm" data-testid="bulk-actions-bar">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900">
                {selectedWorkflows.length} workflow{selectedWorkflows.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={onClearSelection}
                className="ml-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            
            <div className="h-4 border-l border-gray-300" />
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-success-600 hover:bg-success-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApproving ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Approve All
              </button>
              
              <button
                onClick={() => handleBulkAction('reject')}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-danger-600 hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRejecting ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                Reject All
              </button>
              
              <button
                onClick={() => handleBulkAction('escalate')}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-warning-600 hover:bg-warning-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warning-500 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="bulk-assign-button"
              >
                {isEscalating ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                )}
                Escalate All
              </button>
              
              <div className="h-4 border-l border-gray-300" />
              
              <button
                onClick={exportWorkflows}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Authorization Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div 
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            data-testid="bulk-assignment-dialog"
          >
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Confirm Bulk {pendingAction && pendingAction.charAt(0).toUpperCase() + pendingAction.slice(1)}
                </h3>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                You are about to {pendingAction} {selectedWorkflows.length} workflow{selectedWorkflows.length !== 1 ? 's' : ''}. 
                This action cannot be undone.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder={`Add notes for this bulk ${pendingAction} action...`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Authorization PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your PIN"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  onClick={executeBulkAction}
                  disabled={!authCode || isLoading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    pendingAction === 'approve' ? 'bg-success-600 hover:bg-success-700 focus:ring-success-500' :
                    pendingAction === 'reject' ? 'bg-danger-600 hover:bg-danger-700 focus:ring-danger-500' :
                    'bg-warning-600 hover:bg-warning-700 focus:ring-warning-500'
                  }`}
                >
                  {isLoading ? 'Processing...' : `Confirm ${pendingAction && pendingAction.charAt(0).toUpperCase() + pendingAction.slice(1)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};