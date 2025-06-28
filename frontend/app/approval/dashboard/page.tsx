'use client';

import { Metadata } from 'next';
import { useState, useMemo } from 'react';
import { ApprovalErrorBoundary } from '../../../components/approval/shared/ErrorBoundary';
import { useApprovalWebSocket } from '../../../hooks/useApprovalWebSocket';
import { 
  useGetWorkflowsQuery, 
  useGetDashboardStatsQuery,
  useGetQueueMetricsQuery 
} from '../../../store/api/approvalApi';
import { ApprovalQueueSkeleton, DashboardStatsSkeleton } from '../../../components/approval/shared/LoadingStates';
import type { ApprovalWorkflowQuery, ApprovalWorkflow } from '../../../types/approval';
import { calculateWorkflowUrgency } from '../../../utils/approvalHelpers';

// Components we'll create
import { QueueStats } from './components/QueueStats';
import { ApprovalQueue } from './components/ApprovalQueue';
import { QueueFilters } from './components/QueueFilters';
import { BulkActions } from './components/BulkActions';
import { RealTimeUpdates } from './components/RealTimeUpdates';

export default function ApprovalDashboard() {
  // State for filters and selection
  const [filters, setFilters] = useState<ApprovalWorkflowQuery>({
    status: ['pending'],
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    page: 1,
    limit: 20
  });
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // WebSocket for real-time updates
  const { isConnected, error: wsError } = useApprovalWebSocket({
    onWorkflowUpdate: (workflow) => {
      console.log('Workflow updated:', workflow);
    },
    onNewWorkflow: (workflow) => {
      console.log('New workflow:', workflow);
    }
  });

  // API queries
  const { 
    data: workflowsData, 
    isLoading: isLoadingWorkflows,
    error: workflowsError,
    refetch: refetchWorkflows
  } = useGetWorkflowsQuery(filters);

  const { 
    data: dashboardStats, 
    isLoading: isLoadingStats 
  } = useGetDashboardStatsQuery();

  const { 
    data: queueMetrics, 
    isLoading: isLoadingMetrics 
  } = useGetQueueMetricsQuery();

  // Sort workflows by urgency for prioritized display
  const prioritizedWorkflows = useMemo(() => {
    if (!workflowsData?.workflows) return [];
    
    return [...workflowsData.workflows].sort((a, b) => {
      const urgencyA = calculateWorkflowUrgency(a);
      const urgencyB = calculateWorkflowUrgency(b);
      return urgencyB - urgencyA;
    });
  }, [workflowsData?.workflows]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<ApprovalWorkflowQuery>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    setSelectedWorkflows([]); // Clear selection when filters change
  };

  // Handle workflow selection
  const handleWorkflowSelect = (workflowId: string, selected: boolean) => {
    setSelectedWorkflows(prev => 
      selected 
        ? [...prev, workflowId]
        : prev.filter(id => id !== workflowId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedWorkflows(
      selected ? prioritizedWorkflows.map(w => w.id) : []
    );
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <ApprovalErrorBoundary context="dashboard">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Approval Dashboard
                </h1>
                {/* Real-time connection indicator */}
                <div className="ml-4 flex items-center">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="ml-2 text-sm text-gray-600">
                    {isConnected ? 'Live' : 'Disconnected'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                
                <button
                  onClick={() => refetchWorkflows()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="dashboard-content">
          {/* Dashboard Statistics */}
          <div className="mb-8">
            {isLoadingStats || isLoadingMetrics ? (
              <DashboardStatsSkeleton />
            ) : (
              <QueueStats 
                dashboardStats={dashboardStats}
                queueMetrics={queueMetrics}
              />
            )}
          </div>

          {/* Real-time Updates Component */}
          <RealTimeUpdates 
            isConnected={isConnected}
            error={wsError}
            onReconnect={() => window.location.reload()}
          />

          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-6">
              <QueueFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                workflowCount={workflowsData?.pagination?.totalCount || 0}
              />
            </div>
          )}

          {/* Bulk Actions */}
          {selectedWorkflows.length > 0 && (
            <div className="mb-6">
              <BulkActions
                selectedWorkflows={selectedWorkflows}
                onClearSelection={() => setSelectedWorkflows([])}
                onRefresh={() => refetchWorkflows()}
              />
            </div>
          )}

          {/* Main Approval Queue */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Pending Approvals
                  {workflowsData?.pagination && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({workflowsData.pagination.totalCount} total)
                    </span>
                  )}
                </h2>
                
                {prioritizedWorkflows.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedWorkflows.length === prioritizedWorkflows.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-700">
                      Select All
                    </label>
                  </div>
                )}
              </div>

              {isLoadingWorkflows ? (
                <div data-testid="dashboard-loading">
                  <ApprovalQueueSkeleton count={6} />
                </div>
              ) : workflowsError ? (
                <div className="text-center py-12" data-testid="dashboard-error">
                  <div className="text-red-600 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.174 0 2.078-1.038 1.859-2.168l-6.938-12.83c-.382-.768-1.479-.768-1.862 0L4.069 20.832C3.85 21.962 4.755 23 5.929 23z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Error Loading Workflows
                  </h3>
                  <p className="text-gray-600 mb-4" data-testid="network-error-message">
                    Unable to load approval workflows. Please check your connection and try again.
                  </p>
                  <button
                    onClick={() => refetchWorkflows()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    data-testid="retry-button"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <ApprovalQueue
                  workflows={prioritizedWorkflows}
                  selectedWorkflows={selectedWorkflows}
                  onWorkflowSelect={handleWorkflowSelect}
                  pagination={workflowsData?.pagination}
                  onPageChange={handlePageChange}
                  isLoading={isLoadingWorkflows}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </ApprovalErrorBoundary>
  );
}