'use client';

import React, { useState, useCallback, useMemo } from 'react';

interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'workflow' | 'system' | 'compliance';
  details: {
    ip: string;
    userAgent: string;
    location?: string;
    beforeState?: any;
    afterState?: any;
    metadata?: Record<string, any>;
  };
  outcome: 'success' | 'failure' | 'warning';
  riskScore: number; // 0-100
  complianceFlags: string[];
  sessionId: string;
}

interface SecurityMetrics {
  totalEvents: number;
  riskEvents: number;
  failedAttempts: number;
  complianceViolations: number;
  timeRange: {
    start: string;
    end: string;
  };
  categories: Record<string, number>;
  severityDistribution: Record<string, number>;
  userActivity: Record<string, number>;
  hourlyActivity: number[];
}

interface AuditLoggerProps {
  auditEvents: AuditEvent[];
  securityMetrics: SecurityMetrics;
  onExportLogs?: (filters: AuditFilters) => void;
  onGenerateReport?: (type: 'security' | 'compliance' | 'risk') => void;
  realTimeEnabled?: boolean;
}

interface AuditFilters {
  dateRange: { start: string; end: string };
  severity: string[];
  category: string[];
  outcome: string[];
  userId?: string;
  riskThreshold: number;
  searchTerm: string;
}

export const AuditLogger: React.FC<AuditLoggerProps> = ({
  auditEvents,
  securityMetrics,
  onExportLogs,
  onGenerateReport,
  realTimeEnabled = true
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'metrics' | 'compliance'>('events');
  const [filters, setFilters] = useState<AuditFilters>({
    dateRange: { 
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    severity: [],
    category: [],
    outcome: [],
    riskThreshold: 50,
    searchTerm: ''
  });
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter events based on criteria
  const filteredEvents = useMemo(() => {
    return auditEvents.filter(event => {
      const eventDate = new Date(event.timestamp).toISOString().split('T')[0];
      
      if (eventDate < filters.dateRange.start || eventDate > filters.dateRange.end) return false;
      if (filters.severity.length && !filters.severity.includes(event.severity)) return false;
      if (filters.category.length && !filters.category.includes(event.category)) return false;
      if (filters.outcome.length && !filters.outcome.includes(event.outcome)) return false;
      if (filters.userId && event.userId !== filters.userId) return false;
      if (event.riskScore < filters.riskThreshold) return false;
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return event.action.toLowerCase().includes(term) ||
               event.resource.toLowerCase().includes(term) ||
               event.userName.toLowerCase().includes(term);
      }
      
      return true;
    });
  }, [auditEvents, filters]);

  // Get severity color
  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Get outcome color
  const getOutcomeColor = useCallback((outcome: string) => {
    switch (outcome) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'failure': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Get risk level badge
  const getRiskBadge = useCallback((riskScore: number) => {
    if (riskScore >= 80) return { label: 'Critical', color: 'text-red-600 bg-red-100' };
    if (riskScore >= 60) return { label: 'High', color: 'text-orange-600 bg-orange-100' };
    if (riskScore >= 40) return { label: 'Medium', color: 'text-yellow-600 bg-yellow-100' };
    return { label: 'Low', color: 'text-green-600 bg-green-100' };
  }, []);

  // Handle export logs
  const handleExportLogs = useCallback(() => {
    if (onExportLogs) {
      onExportLogs(filters);
    }
  }, [onExportLogs, filters]);

  // Handle generate report
  const handleGenerateReport = useCallback((type: 'security' | 'compliance' | 'risk') => {
    if (onGenerateReport) {
      onGenerateReport(type);
    }
  }, [onGenerateReport]);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Security Audit Logger</h2>
            <p className="text-sm text-gray-600 mt-1">
              Monitor security events, track compliance, and analyze risk patterns
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {realTimeEnabled && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live Monitoring</span>
              </div>
            )}
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
            
            <button
              onClick={handleExportLogs}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Threshold</label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.riskThreshold}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  riskThreshold: parseInt(e.target.value)
                }))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">Score: {filters.riskThreshold}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search events..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  searchTerm: e.target.value
                }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('events')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'events'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Audit Events ({filteredEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'metrics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Security Metrics
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'compliance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Compliance Reports
          </button>
        </nav>
      </div>

      <div className="p-6">
        {/* Audit Events Tab */}
        {activeTab === 'events' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Security Events</h3>
              <p className="text-sm text-gray-600">Comprehensive audit trail of all system activities</p>
            </div>
            
            {/* Events Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outcome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvents.map((event) => {
                    const riskBadge = getRiskBadge(event.riskScore);
                    
                    return (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{event.userName}</div>
                          <div className="text-xs text-gray-500">{event.details.ip}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{event.action}</div>
                          <div className="text-xs text-gray-500 capitalize">{event.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.resource}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                            {event.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(event.outcome)}`}>
                            {event.outcome}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${riskBadge.color}`}>
                            {riskBadge.label} ({event.riskScore})
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => setSelectedEvent(event)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Security Metrics Tab */}
        {activeTab === 'metrics' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-2xl font-semibold text-gray-900">{securityMetrics.totalEvents.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-red-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Risk Events</p>
                    <p className="text-2xl font-semibold text-gray-900">{securityMetrics.riskEvents}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Failed Attempts</p>
                    <p className="text-2xl font-semibold text-gray-900">{securityMetrics.failedAttempts}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Compliance Issues</p>
                    <p className="text-2xl font-semibold text-gray-900">{securityMetrics.complianceViolations}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Event Categories</h4>
                <div className="space-y-2">
                  {Object.entries(securityMetrics.categories).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{category.replace('_', ' ')}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Severity Distribution</h4>
                <div className="space-y-2">
                  {Object.entries(securityMetrics.severityDistribution).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{severity}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Reports Tab */}
        {activeTab === 'compliance' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Compliance Reports</h3>
              <p className="text-sm text-gray-600">Generate comprehensive compliance and security reports</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleGenerateReport('security')}
                className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-md">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Security Report</h4>
                    <p className="text-sm text-gray-600">Comprehensive security analysis</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleGenerateReport('compliance')}
                className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-md">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Compliance Report</h4>
                    <p className="text-sm text-gray-600">Regulatory compliance status</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleGenerateReport('risk')}
                className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500 rounded-md">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Risk Assessment</h4>
                    <p className="text-sm text-gray-600">Risk analysis and mitigation</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Event Details</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="text-sm text-gray-900">{selectedEvent.userName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Action</label>
                <p className="text-sm text-gray-900">{selectedEvent.action}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Resource</label>
                <p className="text-sm text-gray-900">{selectedEvent.resource} (ID: {selectedEvent.resourceId})</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">IP Address</label>
                  <p className="text-sm text-gray-900">{selectedEvent.details.ip}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Risk Score</label>
                  <p className="text-sm text-gray-900">{selectedEvent.riskScore}/100</p>
                </div>
              </div>
              
              {selectedEvent.complianceFlags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Flags</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.complianceFlags.map(flag => (
                      <span key={flag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">User Agent</label>
                <p className="text-sm text-gray-900 break-all">{selectedEvent.details.userAgent}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};