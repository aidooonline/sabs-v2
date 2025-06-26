'use client';

import { useState } from 'react';
import { ApprovalWorkflow } from '../../../../types/approval';
import { 
  useApproveWorkflowMutation,
  useRejectWorkflowMutation,
  useEscalateWorkflowMutation,
  useRequestAdditionalInfoMutation
} from '../../../../store/api/approvalApi';

interface ReviewActionPanelProps {
  workflow: ApprovalWorkflow;
  customer: any;
  onActionComplete: () => void;
}

export const ReviewActionPanel = ({ workflow, customer, onActionComplete }: ReviewActionPanelProps) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // API mutations
  const [approveWorkflow, { isLoading: isApproving }] = useApproveWorkflowMutation();
  const [rejectWorkflow, { isLoading: isRejecting }] = useRejectWorkflowMutation();
  const [escalateWorkflow, { isLoading: isEscalating }] = useEscalateWorkflowMutation();
  const [requestInfo, { isLoading: isRequestingInfo }] = useRequestAdditionalInfoMutation();

  const isProcessing = isApproving || isRejecting || isEscalating || isRequestingInfo;

  const handleAction = async (action: string) => {
    if (!notes.trim()) {
      alert('Please provide notes for this action');
      return;
    }

    try {
      const payload = {
        workflowId: workflow.id,
        action: action as 'approve' | 'reject' | 'request_info',
        notes: notes.trim(),
        authorizationMethod: 'pin' as const,
        authorizationCode: authCode || '1234' // Demo auth code
      };

      let result;
      switch (action) {
        case 'approve':
          result = await approveWorkflow(payload);
          break;
        case 'reject':
          result = await rejectWorkflow(payload);
          break;
        case 'escalate':
          result = await escalateWorkflow({
            workflowId: workflow.id,
            reason: notes.trim(),
            escalateTo: 'manager' // Demo escalation target
          });
          break;
        case 'request_info':
          result = await requestInfo(payload);
          break;
      }

      if (result && 'data' in result) {
        setSelectedAction(null);
        setNotes('');
        setAuthCode('');
        setShowConfirmation(false);
        onActionComplete();
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed. Please try again.');
    }
  };

  const ActionButton = ({ 
    action, 
    label, 
    color, 
    icon 
  }: { 
    action: string; 
    label: string; 
    color: string; 
    icon: React.ReactNode; 
  }) => (
    <button
      onClick={() => {
        setSelectedAction(action);
        setShowConfirmation(true);
      }}
      disabled={isProcessing}
      className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md text-sm font-medium text-white ${color} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Review Actions</h3>
      
      {/* Workflow Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-500">Amount</span>
          <span className="text-sm font-bold text-gray-900">
            GHS {workflow.withdrawalRequest?.amount?.toLocaleString() || '0.00'}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-500">Customer</span>
          <span className="text-sm text-gray-900">
            {workflow.withdrawalRequest?.customer?.fullName || 'Unknown'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">Risk Level</span>
          <span className={`text-sm font-medium ${
            workflow.riskAssessment?.overallRisk === 'low' ? 'text-green-600' :
            workflow.riskAssessment?.overallRisk === 'medium' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {workflow.riskAssessment?.overallRisk?.toUpperCase() || 'LOW'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <ActionButton
          action="approve"
          label="Approve Request"
          color="bg-green-600"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        
        <ActionButton
          action="reject"
          label="Reject Request"
          color="bg-red-600"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
        />
        
        <ActionButton
          action="escalate"
          label="Escalate to Manager"
          color="bg-yellow-600"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          }
        />
        
        <ActionButton
          action="request_info"
          label="Request More Info"
          color="bg-blue-600"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedAction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirm {selectedAction.replace('_', ' ').toUpperCase()}
              </h3>
              
              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes *
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your notes for this action..."
                />
              </div>

              <div className="mb-6">
                <label htmlFor="authCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Authorization Code
                </label>
                <input
                  type="password"
                  id="authCode"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter authorization code"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleAction(selectedAction)}
                  disabled={isProcessing || !notes.trim()}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setSelectedAction(null);
                    setNotes('');
                    setAuthCode('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};