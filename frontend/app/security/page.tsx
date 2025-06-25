'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { DashboardSummaryCard } from '@/components/molecules/DashboardSummaryCard';
import { 
  UserSession,
  SessionsResponse,
  SessionAnalytics,
  MfaStatus,
  SecurityAnalytics,
  AuditLog,
  UserDevice,
  enhancedAuthService 
} from '@/services/api/enhancedAuthService';

// Icons
const SecurityIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const SessionIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const DeviceIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const MfaIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const AuditIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const WarningIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L5.098 18.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

export default function SecurityDashboard() {
  const { user } = useAuth();
  
  // State
  const [sessions, setSessions] = useState<SessionsResponse | null>(null);
  const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalytics | null>(null);
  const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null);
  const [securityAnalytics, setSecurityAnalytics] = useState<SecurityAnalytics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'mfa' | 'devices' | 'audit'>('overview');

  // Load security data
  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [
        sessionsData,
        analyticsData,
        mfaData,
        securityData,
        auditData,
        devicesData
      ] = await Promise.all([
        enhancedAuthService.getSessions({ activeOnly: false }),
        enhancedAuthService.getSessionAnalytics(),
        enhancedAuthService.getMfaStatus(),
        enhancedAuthService.getSecurityAnalytics(30),
        enhancedAuthService.getAuditLogs(20, 0),
        enhancedAuthService.getDevices(),
      ]);
      
      setSessions(sessionsData);
      setSessionAnalytics(analyticsData);
      setMfaStatus(mfaData);
      setSecurityAnalytics(securityData);
      setAuditLogs(auditData);
      setDevices(devicesData.devices);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  // Handle session termination
  const handleTerminateSessions = async () => {
    if (selectedSessions.size === 0) return;
    
    try {
      await enhancedAuthService.invalidateSessions(Array.from(selectedSessions));
      setSelectedSessions(new Set());
      await loadSecurityData(); // Reload data
    } catch (error) {
      console.error('Error terminating sessions:', error);
    }
  };

  // Handle MFA setup
  const handleSetupMfa = async () => {
    // This would open a MFA setup modal (future implementation)
    console.log('Setup MFA');
  };

  // Get risk level for analytics
  const getRiskLevel = (score: number): { level: string; color: string } => {
    if (score >= 80) return { level: 'High Risk', color: 'red' };
    if (score >= 60) return { level: 'Medium Risk', color: 'yellow' };
    if (score >= 40) return { level: 'Low Risk', color: 'blue' };
    return { level: 'Secure', color: 'green' };
  };

  const riskLevel = getRiskLevel(sessionAnalytics?.riskScore || 0);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
          <p className="ml-4 text-gray-600">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor your account security and manage access controls
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button variant="outline" onClick={loadSecurityData}>
            Refresh
          </Button>
          {!mfaStatus?.enabled && (
            <Button variant="primary" onClick={handleSetupMfa}>
              Setup MFA
            </Button>
          )}
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardSummaryCard
          title="Active Sessions"
          value={sessionAnalytics?.activeSessions || 0}
          subtitle={`${sessionAnalytics?.totalSessions || 0} total`}
          icon={<SessionIcon />}
          variant="info"
          loading={loading}
        />
        
        <DashboardSummaryCard
          title="Security Score"
          value={`${100 - (sessionAnalytics?.riskScore || 0)}%`}
          subtitle={riskLevel.level}
          icon={<SecurityIcon />}
          variant={riskLevel.color === 'green' ? 'success' : riskLevel.color === 'red' ? 'danger' : 'warning'}
          loading={loading}
        />
        
        <DashboardSummaryCard
          title="MFA Status"
          value={mfaStatus?.enabled ? 'Enabled' : 'Disabled'}
          subtitle={mfaStatus?.enabled ? `${mfaStatus.backupCodesRemaining} backup codes` : 'Setup recommended'}
          icon={<MfaIcon />}
          variant={mfaStatus?.enabled ? 'success' : 'warning'}
          loading={loading}
        />
        
        <DashboardSummaryCard
          title="Trusted Devices"
          value={devices.filter(d => d.trusted).length}
          subtitle={`${devices.length} total devices`}
          icon={<DeviceIcon />}
          variant="primary"
          loading={loading}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: <AnalyticsIcon /> },
            { id: 'sessions', label: 'Sessions', icon: <SessionIcon /> },
            { id: 'mfa', label: 'MFA', icon: <MfaIcon /> },
            { id: 'devices', label: 'Devices', icon: <DeviceIcon /> },
            { id: 'audit', label: 'Audit Logs', icon: <AuditIcon /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="w-5 h-5 mr-2">
                {tab.icon}
              </div>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security Analytics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Analytics (30 days)</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Events</span>
                <span className="text-sm font-medium text-gray-900">
                  {securityAnalytics?.totalEvents || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Successful Logins</span>
                <span className="text-sm font-medium text-green-600">
                  {securityAnalytics?.successfulLogins || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Failed Logins</span>
                <span className="text-sm font-medium text-red-600">
                  {securityAnalytics?.failedLogins || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Suspicious Activities</span>
                <span className="text-sm font-medium text-yellow-600">
                  {securityAnalytics?.suspiciousActivities || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Unique IPs</span>
                <span className="text-sm font-medium text-gray-900">
                  {securityAnalytics?.uniqueIPs || 0}
                </span>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Events</h3>
            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => {
                const severity = enhancedAuthService.formatAuditLogSeverity(log.severity);
                return (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{log.action}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString()} • {log.ipAddress}
                      </p>
                    </div>
                    <Badge variant={severity.color === 'red' ? 'danger' : severity.color === 'yellow' ? 'warning' : 'success'}>
                      {severity.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'sessions' && sessions && (
        <div className="space-y-6">
          {/* Session Management Actions */}
          {selectedSessions.size > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedSessions.size} sessions selected
                </span>
                <Button variant="danger" size="sm" onClick={handleTerminateSessions}>
                  Terminate Selected
                </Button>
              </div>
            </Card>
          )}

          {/* Sessions Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedSessions.size === sessions.sessions.filter(s => !s.isCurrent).length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSessions(new Set(sessions.sessions.filter(s => !s.isCurrent).map(s => s.id)));
                          } else {
                            setSelectedSessions(new Set());
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.sessions.map((session) => {
                    const riskLevel = enhancedAuthService.getSessionRiskLevel(session);
                    return (
                      <tr key={session.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {!session.isCurrent && (
                            <input
                              type="checkbox"
                              checked={selectedSessions.has(session.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedSessions);
                                if (e.target.checked) {
                                  newSelected.add(session.id);
                                } else {
                                  newSelected.delete(session.id);
                                }
                                setSelectedSessions(newSelected);
                              }}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {session.deviceName}
                              {session.isCurrent && (
                                <Badge variant="info" className="ml-2">Current</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 capitalize">
                              {session.deviceType}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {enhancedAuthService.getLocationString(session)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={session.isActive ? 'success' : 'danger'}
                            className="mr-2"
                          >
                            {session.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {session.isSuspicious && (
                            <Badge variant="warning">
                              <WarningIcon className="w-3 h-3 mr-1" />
                              Suspicious
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {enhancedAuthService.formatLastActivity(session.lastActivity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {enhancedAuthService.formatSessionDuration(session)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'mfa' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Multi-Factor Authentication</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  <p className="text-sm text-gray-500">
                    {mfaStatus?.enabled ? 'MFA is enabled for your account' : 'MFA is not enabled'}
                  </p>
                </div>
                <Badge variant={mfaStatus?.enabled ? 'success' : 'warning'}>
                  {mfaStatus?.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              
              {mfaStatus?.enabled && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Method</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {mfaStatus.type || 'TOTP'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Backup Codes</p>
                      <p className="text-sm text-gray-500">
                        {mfaStatus.backupCodesRemaining} codes remaining
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Generate New
                    </Button>
                  </div>
                </>
              )}
              
              <div className="pt-4 border-t">
                {mfaStatus?.enabled ? (
                  <Button variant="danger" fullWidth>
                    Disable MFA
                  </Button>
                ) : (
                  <Button variant="primary" fullWidth onClick={handleSetupMfa}>
                    Enable MFA
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Recommendations</h3>
            <div className="space-y-3">
              {!mfaStatus?.enabled && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex">
                    <WarningIcon className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-800">
                        Enable Multi-Factor Authentication
                      </p>
                      <p className="text-sm text-yellow-700">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex">
                  <SecurityIcon className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800">
                      Regular Security Reviews
                    </p>
                    <p className="text-sm text-blue-700">
                      Review your sessions and devices monthly
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex">
                  <DeviceIcon className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Trust Known Devices
                    </p>
                    <p className="text-sm text-green-700">
                      Mark your personal devices as trusted
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'devices' && (
        <Card className="overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trusted Devices</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devices.map((device, index) => (
                  <tr key={device.fingerprint}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DeviceIcon className="h-8 w-8 text-gray-400" />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {device.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {device.fingerprint.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {device.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {device.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(device.lastSeen).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={device.trusted ? 'success' : 'warning'}>
                        {device.trusted ? 'Trusted' : 'Untrusted'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'audit' && (
        <Card className="overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Audit Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.map((log) => {
                  const severity = enhancedAuthService.formatAuditLogSeverity(log.severity);
                  return (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.action}</div>
                        {log.details && (
                          <div className="text-sm text-gray-500">{log.details}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={log.success ? 'success' : 'danger'}>
                          {log.success ? 'Success' : 'Failed'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={
                            severity.color === 'red' ? 'danger' : 
                            severity.color === 'orange' ? 'warning' : 
                            severity.color === 'yellow' ? 'warning' : 'info'
                          }
                        >
                          {severity.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}