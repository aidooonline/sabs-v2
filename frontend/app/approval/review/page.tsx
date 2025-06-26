'use client';

import { Metadata } from 'next';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ApprovalErrorBoundary } from '../../../components/approval/shared/ErrorBoundary';
import { 
  useGetWorkflowQuery,
  useGetDashboardStatsQuery
} from '../../../store/api/approvalApi';
import { WorkflowDetailsSkeleton } from '../../../components/approval/shared/LoadingStates';
import type { ApprovalWorkflow } from '../../../types/approval';

// Import components we'll create for the review interface
import { RequestDetailsPanel } from './components/RequestDetailsPanel';
import { CustomerVerificationPanel } from './components/CustomerVerificationPanel';
import { AgentInformationPanel } from './components/AgentInformationPanel';
import { RiskAssessmentPanel } from './components/RiskAssessmentPanel';
import { TransactionContextPanel } from './components/TransactionContextPanel';
import { SupportingDocumentsViewer } from './components/SupportingDocumentsViewer';
import { ReviewActionPanel } from './components/ReviewActionPanel';
import { ReviewBreadcrumb } from './components/ReviewBreadcrumb';

interface ReviewRequestPageProps {
  searchParams: { workflowId?: string };
}

export const metadata: Metadata = {
  title: 'Review Requests - Sabs v2',
  description: 'Review withdrawal requests and customer verification',
};

export default function ReviewRequestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workflowId = searchParams.get('workflowId');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'history'>('overview');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  // Redirect if no workflow ID provided
  useEffect(() => {
    if (!workflowId) {
      router.push('/approval/dashboard');
    }
  }, [workflowId, router]);

  // API queries for review data
  const { 
    data: workflowResponse, 
    isLoading: isLoadingWorkflow,
    error: workflowError 
  } = useGetWorkflowQuery(workflowId!, { skip: !workflowId });

  const workflow = workflowResponse?.workflow;

  // TODO: These will be implemented with proper API endpoints
  // For now, using placeholder data based on workflow information
  const customerDetails = workflow ? {
    id: workflow.withdrawalRequest?.customer?.id || 'unknown',
    name: workflow.withdrawalRequest?.customer?.fullName || 'John Doe',
    phone: workflow.withdrawalRequest?.customer?.phoneNumber || '+233 24 123 4567',
    email: workflow.withdrawalRequest?.customer?.email || 'john.doe@example.com',
    idNumber: workflow.withdrawalRequest?.customer?.idNumber || 'GHA-123456789-0',
    verificationStatus: 'verified',
    photoUrl: '/api/customers/photos/placeholder.jpg'
  } : null;

  const agentInfo = workflow ? {
    id: workflow.withdrawalRequest?.agent?.id || 'unknown',
    name: workflow.withdrawalRequest?.agent?.fullName || 'Agent Smith',
    location: 'Accra Central',
    phone: workflow.withdrawalRequest?.agent?.phoneNumber || '+233 20 987 6543',
    rating: 4.8,
    totalTransactions: 156
  } : null;

  const transactionHistory = workflow ? [
    {
      id: '1',
      type: 'deposit',
      amount: 500,
      date: '2024-12-18',
      status: 'completed'
    },
    {
      id: '2', 
      type: 'withdrawal',
      amount: 200,
      date: '2024-12-17',
      status: 'completed'
    }
  ] : [];

  const supportingDocuments = workflow ? [
    {
      id: '1',
      name: 'Customer ID Copy',
      type: 'image/jpeg',
      url: '/api/documents/placeholder1.jpg',
      uploadedAt: '2024-12-19'
    },
    {
      id: '2',
      name: 'Transaction Receipt',
      type: 'application/pdf', 
      url: '/api/documents/placeholder2.pdf',
      uploadedAt: '2024-12-19'
    }
  ] : [];

  // Handle back navigation
  const handleBack = () => {
    router.push('/approval/dashboard');
  };

  // Loading state
  if (isLoadingWorkflow || !workflow) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WorkflowDetailsSkeleton />
      </div>
    );
  }

  // Error state
  if (workflowError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.174 0 2.078-1.038 1.859-2.168l-6.938-12.83c-.382-.768-1.479-.768-1.862 0L4.069 20.832C3.85 21.962 4.755 23 5.929 23z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Request
          </h3>
          <p className="text-gray-600 mb-4">
            Unable to load withdrawal request details. Please try again.
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ApprovalErrorBoundary context="review">
      <div className="min-h-screen bg-gray-50">
        {/* Header with breadcrumb and actions */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ReviewBreadcrumb 
              workflow={workflow}
              onBack={handleBack}
            />
            
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Review Withdrawal Request
                </h1>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  workflow.priority === 'high' ? 'bg-red-100 text-red-800' :
                  workflow.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {workflow.priority?.toUpperCase()} PRIORITY
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">
                  Request ID: {workflow.withdrawalRequest?.id || workflow.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Main content - Left column */}
            <div className="lg:col-span-8">
              {/* Request Details Panel */}
              <div className="bg-white rounded-lg shadow mb-6">
                <RequestDetailsPanel 
                  workflow={workflow}
                  isLoading={isLoadingWorkflow}
                />
              </div>

              {/* Customer Verification Panel */}
              <div className="bg-white rounded-lg shadow mb-6">
                <CustomerVerificationPanel 
                  customer={customerDetails}
                  workflow={workflow}
                  isLoading={false}
                />
              </div>

              {/* Agent Information Panel */}
              <div className="bg-white rounded-lg shadow mb-6">
                <AgentInformationPanel 
                  agent={agentInfo}
                  workflow={workflow}
                  isLoading={false}
                />
              </div>

              {/* Risk Assessment Panel */}
              <div className="bg-white rounded-lg shadow mb-6">
                <RiskAssessmentPanel 
                  workflow={workflow}
                  customer={customerDetails}
                  transactionHistory={transactionHistory}
                />
              </div>

              {/* Tab Navigation for Additional Information */}
              <div className="bg-white rounded-lg shadow">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'overview'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Transaction Context
                    </button>
                    <button
                      onClick={() => setActiveTab('documents')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'documents'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Supporting Documents
                      {supportingDocuments?.length && (
                        <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                          {supportingDocuments.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'history'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Recent Activity
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {activeTab === 'overview' && (
                    <TransactionContextPanel 
                      workflow={workflow}
                      customer={customerDetails}
                      transactionHistory={transactionHistory}
                      isLoading={false}
                    />
                  )}
                  
                  {activeTab === 'documents' && (
                    <SupportingDocumentsViewer 
                      documents={supportingDocuments}
                      workflow={workflow}
                      selectedDocument={selectedDocument}
                      onDocumentSelect={setSelectedDocument}
                      isLoading={false}
                    />
                  )}
                  
                  {activeTab === 'history' && (
                    <TransactionContextPanel 
                      workflow={workflow}
                      customer={customerDetails}
                      transactionHistory={transactionHistory}
                      isLoading={false}
                      showFullHistory={true}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Action Panel - Right column */}
            <div className="lg:col-span-4 mt-6 lg:mt-0">
              <div className="sticky top-6">
                <ReviewActionPanel 
                  workflow={workflow}
                  customer={customerDetails}
                  onActionComplete={() => {
                    router.push('/approval/dashboard');
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ApprovalErrorBoundary>
  );
}