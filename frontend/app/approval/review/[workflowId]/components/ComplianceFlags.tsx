'use client';

import React, { useState } from 'react';
import type { ApprovalWorkflow, WorkflowPermissions, ComplianceFlag } from '../../../../../types/approval';
import { formatRelativeTime } from '../../../../../utils/approvalHelpers';

interface ComplianceFlagsProps {
  workflow: ApprovalWorkflow;
  permissions?: WorkflowPermissions;
  refreshKey: number;
}

export const ComplianceFlags: React.FC<ComplianceFlagsProps> = ({
  workflow,
  permissions,
  refreshKey
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'regulatory' | 'internal' | 'risk' | 'fraud'>('all');
  const [showResolved, setShowResolved] = useState(false);

  const complianceFlags = workflow.complianceFlags;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'regulatory':
        return (
          <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'internal':
        return (
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'risk':
        return (
          <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'fraud':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-2 5v10a1 1 0 01-1 1H9a1 1 0 01-1-1V9m5 0H8" />
          </svg>
        );
    }
  };

  const filteredFlags = complianceFlags.filter(flag => {
    // Category filter
    if (selectedCategory !== 'all' && flag.type !== selectedCategory) {
      return false;
    }
    
    // Resolution filter
    if (!showResolved && flag.resolvedAt) {
      return false;
    }
    
    return true;
  });

  const flagsByCategory = filteredFlags.reduce((acc, flag) => {
    if (!acc[flag.type]) acc[flag.type] = [];
    acc[flag.type].push(flag);
    return acc;
  }, {} as Record<string, ComplianceFlag[]>);

  const flagStats = {
    total: complianceFlags.length,
    critical: complianceFlags.filter(f => f.severity === 'critical').length,
    unresolved: complianceFlags.filter(f => !f.resolvedAt).length,
    regulatory: complianceFlags.filter(f => f.type === 'regulatory').length,
    requireAction: complianceFlags.filter(f => f.resolutionRequired && !f.resolvedAt).length
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Compliance Flags</h3>
          <p className="text-sm text-gray-500 mt-1">
            Monitor regulatory and internal compliance requirements
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Show Resolved</span>
          </label>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as typeof selectedCategory)}
            className="rounded-md border-gray-300 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="regulatory">Regulatory</option>
            <option value="internal">Internal</option>
            <option value="risk">Risk</option>
            <option value="fraud">Fraud</option>
          </select>
        </div>
      </div>

      {/* Compliance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 border border-gray-200 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-900">{flagStats.total}</p>
          <p className="text-sm text-gray-600">Total Flags</p>
        </div>
        <div className="bg-white p-4 border border-red-200 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">{flagStats.critical}</p>
          <p className="text-sm text-red-700">Critical</p>
        </div>
        <div className="bg-white p-4 border border-yellow-200 rounded-lg text-center">
          <p className="text-2xl font-bold text-yellow-600">{flagStats.unresolved}</p>
          <p className="text-sm text-yellow-700">Unresolved</p>
        </div>
        <div className="bg-white p-4 border border-purple-200 rounded-lg text-center">
          <p className="text-2xl font-bold text-purple-600">{flagStats.regulatory}</p>
          <p className="text-sm text-purple-700">Regulatory</p>
        </div>
        <div className="bg-white p-4 border border-orange-200 rounded-lg text-center">
          <p className="text-2xl font-bold text-orange-600">{flagStats.requireAction}</p>
          <p className="text-sm text-orange-700">Require Action</p>
        </div>
      </div>

      {/* Compliance Flags List */}
      <div className="space-y-6">
        {filteredFlags.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Compliance Flags</h3>
            <p className="text-gray-600">
              {selectedCategory === 'all' ? 
                'No compliance flags found for this workflow.' :
                `No ${selectedCategory} compliance flags found.`
              }
            </p>
          </div>
        ) : (
          Object.entries(flagsByCategory).map(([category, flags]) => (
            <div key={category} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                {getTypeIcon(category)}
                <h4 className="text-md font-medium text-gray-900 capitalize">
                  {category} Flags ({flags.length})
                </h4>
              </div>
              
              <div className="space-y-3">
                {flags.map((flag) => (
                  <div 
                    key={flag.id} 
                    className={`border rounded-lg p-4 ${getSeverityColor(flag.severity)} ${
                      flag.resolvedAt ? 'opacity-75' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getSeverityIcon(flag.severity)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h5 className="text-sm font-medium">{flag.title}</h5>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              flag.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              flag.severity === 'error' ? 'bg-red-100 text-red-700' :
                              flag.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {flag.severity}
                            </span>
                            {flag.resolutionRequired && !flag.resolvedAt && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                Action Required
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm mb-3">{flag.description}</p>
                          
                          {flag.requirement && (
                            <div className="mb-3 p-2 bg-gray-100 rounded border-l-4 border-gray-400">
                              <p className="text-xs font-medium text-gray-700">Regulatory Requirement:</p>
                              <p className="text-xs text-gray-600">{flag.requirement}</p>
                            </div>
                          )}
                          
                          {flag.resolvedAt && (
                            <div className="flex items-center space-x-2 text-xs text-green-600">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>
                                Resolved {formatRelativeTime(flag.resolvedAt)}
                                {flag.resolvedBy && ` by ${flag.resolvedBy}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {!flag.resolvedAt && flag.resolutionRequired && permissions?.canComment && (
                        <div className="flex-shrink-0 ml-4">
                          <button className="inline-flex items-center px-3 py-1 border border-primary-300 text-xs font-medium rounded text-primary-700 bg-primary-50 hover:bg-primary-100">
                            <svg className="-ml-1 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Compliance Summary Footer */}
      {flagStats.unresolved > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h4 className="text-sm font-medium text-yellow-800">Compliance Action Required</h4>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            {flagStats.unresolved} unresolved compliance {flagStats.unresolved === 1 ? 'flag' : 'flags'} 
            {flagStats.requireAction > 0 && (
              <>, {flagStats.requireAction} requiring immediate action</>
            )}. 
            Please review and address these issues before proceeding with approval.
          </p>
        </div>
      )}
    </div>
  );
};