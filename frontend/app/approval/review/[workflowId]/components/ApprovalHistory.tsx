'use client';

import React, { useState } from 'react';
import type { ApprovalWorkflow, WorkflowPermissions, ApprovalDecision } from '../../../../../types/approval';
import { formatRelativeTime, getStageLabel, formatCurrency } from '../../../../../utils/approvalHelpers';

interface ApprovalHistoryProps {
  workflow: ApprovalWorkflow;
  permissions?: WorkflowPermissions;
  refreshKey: number;
}

export const ApprovalHistory: React.FC<ApprovalHistoryProps> = ({
  workflow,
  permissions,
  refreshKey
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null);

  const approvalHistory = workflow.approvalHistory;
  const auditLog = workflow.auditLog;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'reject':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'escalate':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
        );
      case 'request_info':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'conditional_approve':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case 'override':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'approve':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'reject':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'escalate':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'request_info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'conditional_approve':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'override':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAuthMethodIcon = (method: string) => {
    switch (method) {
      case 'pin':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        );
      case 'otp':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'biometric':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
        );
      case 'digital_signature':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
    }
  };

  const formatActionTitle = (action: string): string => {
    switch (action) {
      case 'request_info':
        return 'Requested Additional Information';
      case 'conditional_approve':
        return 'Conditionally Approved';
      default:
        return action.charAt(0).toUpperCase() + action.slice(1) + 'd';
    }
  };

  const workflowStats = {
    totalDecisions: approvalHistory.length,
    totalTime: workflow.completedAt ? 
      new Date(workflow.completedAt).getTime() - new Date(workflow.createdAt).getTime() : 
      Date.now() - new Date(workflow.createdAt).getTime(),
    currentStage: workflow.currentStage,
    approvals: approvalHistory.filter(d => d.action === 'approve').length,
    rejections: approvalHistory.filter(d => d.action === 'reject').length,
    escalations: approvalHistory.filter(d => d.action === 'escalate').length
  };

  // Create timeline with workflow creation as first entry
  const timelineEntries = [
    {
      id: 'created',
      type: 'workflow_created',
      timestamp: workflow.createdAt,
      actor: workflow.withdrawalRequest.agent.fullName,
      action: 'created',
      stage: 'initiated',
      title: 'Withdrawal Request Created',
      description: `${formatCurrency(workflow.withdrawalRequest.amount)} withdrawal request submitted`
    },
    ...approvalHistory.map(decision => ({
      id: decision.id,
      type: 'approval_decision',
      timestamp: decision.timestamp,
      actor: decision.approverName,
      action: decision.action,
      stage: decision.stage,
      title: formatActionTitle(decision.action),
      description: decision.notes,
      decision
    }))
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Approval History</h3>
          <p className="text-sm text-gray-500 mt-1">
            Complete workflow timeline and decision audit trail
          </p>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {showDetails ? 'Hide Audit Details' : 'Show Audit Details'}
        </button>
      </div>

      {/* Workflow Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 border border-gray-200 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-900">{workflowStats.totalDecisions}</p>
          <p className="text-sm text-gray-600">Total Decisions</p>
        </div>
        <div className="bg-white p-4 border border-green-200 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">{workflowStats.approvals}</p>
          <p className="text-sm text-green-700">Approvals</p>
        </div>
        <div className="bg-white p-4 border border-red-200 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">{workflowStats.rejections}</p>
          <p className="text-sm text-red-700">Rejections</p>
        </div>
        <div className="bg-white p-4 border border-orange-200 rounded-lg text-center">
          <p className="text-2xl font-bold text-orange-600">{workflowStats.escalations}</p>
          <p className="text-sm text-orange-700">Escalations</p>
        </div>
        <div className="bg-white p-4 border border-blue-200 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-600">{getStageLabel(workflowStats.currentStage)}</p>
          <p className="text-sm text-blue-700">Current Stage</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Workflow Timeline</h4>
        
        <div className="space-y-6">
          {timelineEntries.map((entry, index) => (
            <div key={entry.id} className="relative">
              {/* Timeline connector */}
              {index < timelineEntries.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-6 bg-gray-200"></div>
              )}
              
              <div className="flex items-start space-x-4">
                {/* Timeline icon */}
                {entry.type === 'workflow_created' ? (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                ) : (
                  getActionIcon(entry.action)
                )}

                {/* Timeline content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                                         <div className="flex items-center space-x-3">
                       <h5 className="text-sm font-medium text-gray-900">{entry.title}</h5>
                       {'decision' in entry && entry.decision && (
                         <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getActionColor(entry.decision.action)}`}>
                           {getStageLabel(entry.decision.stage)}
                         </span>
                       )}
                     </div>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(entry.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                  
                                     <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                     <span>{entry.actor}</span>
                     {'decision' in entry && entry.decision && (
                       <>
                         <span>•</span>
                         <div className="flex items-center space-x-1">
                           {getAuthMethodIcon(entry.decision.authorizationMethod)}
                           <span className="capitalize">{entry.decision.authorizationMethod}</span>
                         </div>
                         {entry.decision.conditions && entry.decision.conditions.length > 0 && (
                           <>
                             <span>•</span>
                             <span>{entry.decision.conditions.length} conditions</span>
                           </>
                         )}
                       </>
                     )}
                   </div>

                   {/* Expandable decision details */}
                   {'decision' in entry && entry.decision && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedDecision(
                          expandedDecision === entry.decision.id ? null : entry.decision.id
                        )}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        {expandedDecision === entry.decision.id ? 'Hide Details' : 'View Details'}
                      </button>
                      
                      {expandedDecision === entry.decision.id && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="font-medium text-gray-700">IP Address:</span>
                              <span className="ml-2 text-gray-600">{entry.decision.ipAddress}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Device:</span>
                              <span className="ml-2 text-gray-600">{entry.decision.deviceInfo.deviceType}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Session:</span>
                              <span className="ml-2 text-gray-600">{entry.decision.sessionInfo.sessionId.slice(0, 8)}...</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Auth Code:</span>
                              <span className="ml-2 text-gray-600">
                                {entry.decision.authorizationCode ? 
                                  `***${entry.decision.authorizationCode.slice(-4)}` : 
                                  'N/A'
                                }
                              </span>
                            </div>
                          </div>
                          
                          {entry.decision.conditions && entry.decision.conditions.length > 0 && (
                            <div className="mt-3">
                              <p className="font-medium text-gray-700 text-xs mb-1">Conditions:</p>
                              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                {entry.decision.conditions.map((condition, idx) => (
                                  <li key={idx}>{condition}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log */}
      {showDetails && auditLog.length > 0 && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-4">Detailed Audit Log</h4>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLog.slice(0, 10).map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-600">
                      {formatRelativeTime(entry.timestamp)}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <div>
                        <p className="font-medium text-gray-900">{entry.userName}</p>
                        <p className="text-gray-500">{entry.userRole}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs font-medium text-gray-900">
                      {entry.action}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600">
                      <div className="max-w-xs">
                        {Object.entries(entry.details).map(([key, value]) => (
                          <div key={key} className="truncate">
                            <span className="font-medium">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600">
                      {entry.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {auditLog.length > 10 && (
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  Showing 10 of {auditLog.length} audit entries
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};