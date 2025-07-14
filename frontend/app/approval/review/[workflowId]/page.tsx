'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ApprovalErrorBoundary } from '../../../../components/approval/shared/ErrorBoundary';
import { 
  useGetWorkflowQuery,
  useGetWorkflowPermissionsQuery,
  useGetWorkflowCommentsQuery 
} from '../../../../store/api/approvalApi';
import { useApprovalWebSocket } from '../../../../hooks/useApprovalWebSocket';
import { WorkflowDetailsSkeleton } from '../../../../components/approval/shared/LoadingStates';
import type { ApprovalWorkflow } from '../../../../types/approval';
import { 
  getStatusLabel, 
  getStatusColor,
  formatCurrency,
  formatRelativeTime,
  calculateWorkflowUrgency,
  calculateSLAStatus
} from '../../../../utils/approvalHelpers';

// Components we'll create
import { WorkflowHeader } from './components/WorkflowHeader';
import { CustomerVerification } from './components/CustomerVerification';
import { TransactionAnalysis } from './components/TransactionAnalysis';
import { RiskAssessment } from './components/RiskAssessment';
import { ComplianceFlags } from './components/ComplianceFlags';
import { ApprovalHistory } from './components/ApprovalHistory';
import { WorkflowComments } from './components/WorkflowComments';
import { DecisionPanel } from './components/DecisionPanel';
import { SupportingDocuments } from './components/SupportingDocuments';

export default function WorkflowReviewPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.workflowId as string;
  
  const [activeTab, setActiveTab] = useState<'overview' | 'customer' | 'transaction' | 'risk' | 'compliance' | 'history' | 'documents'>('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  // API queries
  const { 
    data: workflowData, 
    isLoading: isLoadingWorkflow,
    error: workflowError,
    refetch: refetchWorkflow
  } = useGetWorkflowQuery(workflowId);

  const { 
    data: permissions,
    isLoading: isLoadingPermissions 
  } = useGetWorkflowPermissionsQuery(workflowId);

  const { 
    data: comments,
    refetch: refetchComments 
  } = useGetWorkflowCommentsQuery(workflowId);

  // WebSocket for real-time updates
  const { isConnected } = useApprovalWebSocket({
    onWorkflowUpdate: (updatedWorkflow) => {
      if (updatedWorkflow.id === workflowId) {
        // Workflow updated via WebSocket
        refetchWorkflow();
        refetchComments();
        setRefreshKey(prev => prev + 1);
      }
    },
    onNewWorkflow: () => {
      // Not relevant for individual workflow view
    }
  });

  // Handle workflow not found
  useEffect(() => {
    if (workflowError && 'status' in workflowError && workflowError.status === 404) {
      router.push('/approval/dashboard');
    }
  }, [workflowError, router]);

  const workflow = workflowData?.workflow;
  const availableActions = workflowData?.availableActions || [];

  if (isLoadingWorkflow || isLoadingPermissions) {
    return (
      <ApprovalErrorBoundary context="review">
        <div className="min-h-screen bg-gray-50">
          <WorkflowDetailsSkeleton />
        </div>
      </ApprovalErrorBoundary>
    );
  }

  if (workflowError || !workflow) {
    return (
      <ApprovalErrorBoundary context="review">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.174 0 2.078-1.038 1.859-2.168l-6.938-12.83c-.382-.768-1.479-.768-1.862 0L4.069 20.832C3.85 21.962 4.755 23 5.929 23z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Workflow Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              The requested workflow could not be found or you don&apos;t have permission to view it.
            </p>
            <Link
              href="/approval/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </ApprovalErrorBoundary>
    );
  }

  const urgencyScore = calculateWorkflowUrgency(workflow);
  const slaStatus = calculateSLAStatus(workflow);

  const tabs = [
    { id: 'overview' as const, name: 'Overview', icon: '📋' },
    { id: 'customer' as const, name: 'Customer', icon: '👤' },
    { id: 'transaction' as const, name: 'Transaction', icon: '💰' },
    { id: 'risk' as const, name: 'Risk', icon: '⚠️', badge: workflow.riskAssessment.overallRisk === 'high' || workflow.riskAssessment.overallRisk === 'critical' ? 'High' : undefined },
    { id: 'compliance' as const, name: 'Compliance', icon: '✅', badge: workflow.complianceFlags.filter(f => !f.resolvedAt).length > 0 ? `${workflow.complianceFlags.filter(f => !f.resolvedAt).length}` : undefined },
    { id: 'history' as const, name: 'History', icon: '📜' },
    { id: 'documents' as const, name: 'Documents', icon: '📎' }
  ];

  return (
    <ApprovalErrorBoundary context="review">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <WorkflowHeader 
          workflow={workflow}
          permissions={permissions}
          urgencyScore={urgencyScore}
          slaStatus={slaStatus}
          isConnected={isConnected}
          onRefresh={() => {
            refetchWorkflow();
            refetchComments();
            setRefreshKey(prev => prev + 1);
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1">
              {/* Navigation Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span>{tab.icon}</span>
                        <span>{tab.name}</span>
                        {tab.badge && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {tab.badge}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-lg shadow">
                {activeTab === 'overview' && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-6">Workflow Overview</h3>
                    
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Amount</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(workflow.withdrawalRequest.amount, workflow.withdrawalRequest.currency)}
                            </p>
                          </div>
                          <div className="p-3 bg-primary-100 rounded-lg">
                            <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Priority</p>
                            <p className="text-lg font-bold text-gray-900 capitalize">
                              {workflow.priority.replace('_', ' ')}
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${
                            workflow.priority === 'urgent' || workflow.priority === 'critical' ? 'bg-red-100' :
                            workflow.priority === 'high' ? 'bg-yellow-100' : 'bg-green-100'
                          }`}>
                            <svg className={`w-6 h-6 ${
                              workflow.priority === 'urgent' || workflow.priority === 'critical' ? 'text-red-600' :
                              workflow.priority === 'high' ? 'text-yellow-600' : 'text-green-600'
                            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">SLA Status</p>
                            <p className={`text-lg font-bold ${
                              slaStatus.status === 'breached' ? 'text-red-600' :
                              slaStatus.status === 'at_risk' ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {Math.round(slaStatus.percentageUsed)}% Used
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${
                            slaStatus.status === 'breached' ? 'bg-red-100' :
                            slaStatus.status === 'at_risk' ? 'bg-yellow-100' : 'bg-green-100'
                          }`}>
                            <svg className={`w-6 h-6 ${
                              slaStatus.status === 'breached' ? 'text-red-600' :
                              slaStatus.status === 'at_risk' ? 'text-yellow-600' : 'text-green-600'
                            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">Timeline</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">Workflow created</p>
                            <p className="text-xs text-gray-500">{formatRelativeTime(workflow.createdAt)}</p>
                          </div>
                        </div>
                        
                        {workflow.approvalHistory.map((decision, index) => (
                          <div key={decision.id} className="flex items-center space-x-3">
                            <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                              decision.action === 'approve' ? 'bg-green-600' :
                              decision.action === 'reject' ? 'bg-red-600' :
                              'bg-yellow-600'
                            }`}></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                {decision.action.charAt(0).toUpperCase() + decision.action.slice(1)} by {decision.approverName}
                              </p>
                              <p className="text-xs text-gray-500">{formatRelativeTime(decision.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                        
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">Current stage: {workflow.currentStage.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-500">Awaiting decision</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'customer' && (
                  <CustomerVerification 
                    workflow={workflow}
                    refreshKey={refreshKey}
                  />
                )}

                {activeTab === 'transaction' && (
                  <TransactionAnalysis 
                    workflow={workflow}
                    refreshKey={refreshKey}
                  />
                )}

                {activeTab === 'risk' && (
                  <RiskAssessment 
                    workflow={workflow}
                    refreshKey={refreshKey}
                  />
                )}

                {activeTab === 'compliance' && (
                  <ComplianceFlags 
                    workflow={workflow}
                    refreshKey={refreshKey}
                  />
                )}

                {activeTab === 'history' && (
                  <ApprovalHistory 
                    workflow={workflow}
                    refreshKey={refreshKey}
                  />
                )}

                {activeTab === 'documents' && (
                  <SupportingDocuments 
                    workflow={workflow}
                    permissions={permissions}
                    refreshKey={refreshKey}
                  />
                )}
              </div>
            </div>

            {/* Decision Panel Sidebar */}
            <div className="lg:w-80 xl:w-96">
              <div className="sticky top-6 space-y-6">
                {/* Decision Panel */}
                <DecisionPanel
                  workflow={workflow}
                  availableActions={availableActions}
                  permissions={permissions}
                  onDecisionMade={() => {
                    refetchWorkflow();
                    refetchComments();
                    setRefreshKey(prev => prev + 1);
                  }}
                />

                {/* Comments Panel */}
                <WorkflowComments
                  workflowId={workflowId}
                  comments={comments || []}
                  permissions={permissions}
                  onCommentAdded={() => {
                    refetchComments();
                    setRefreshKey(prev => prev + 1);
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