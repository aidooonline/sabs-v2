'use client';

import React, { useState, useCallback, useMemo } from 'react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
}

interface UserPermission {
  userId: string;
  userName: string;
  permissionId: string;
  permissionName: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  isActive: boolean;
  source: 'role' | 'direct' | 'delegation';
  conditions?: {
    maxAmount?: number;
    timeRestrictions?: boolean;
    ipRestrictions?: boolean;
  };
}

interface PermissionRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  permissionId: string;
  permissionName: string;
  justification: string;
  requestedDuration: number; // in days
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComments?: string;
}

interface PermissionManagementProps {
  permissions: Permission[];
  userPermissions: UserPermission[];
  permissionRequests: PermissionRequest[];
  currentUser: { id: string; name: string; roles: string[] };
  onGrantPermission?: (userId: string, permissionId: string, duration?: number) => void;
  onRevokePermission?: (userId: string, permissionId: string) => void;
  onApproveRequest?: (requestId: string, approved: boolean, comments?: string) => void;
  canManagePermissions?: boolean;
}

export const PermissionManagement: React.FC<PermissionManagementProps> = ({
  permissions,
  userPermissions,
  permissionRequests,
  currentUser,
  onGrantPermission,
  onRevokePermission,
  onApproveRequest,
  canManagePermissions = false
}) => {
  const [activeTab, setActiveTab] = useState<'grants' | 'requests' | 'audit'>('grants');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedPermission, setSelectedPermission] = useState<string>('');
  const [grantDuration, setGrantDuration] = useState<number>(30);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(permissions.map(p => p.category)));
    return ['all', ...cats];
  }, [permissions]);

  // Get risk level color
  const getRiskColor = useCallback((risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Get status color
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => {
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (filterRisk !== 'all' && p.riskLevel !== filterRisk) return false;
      return p.isActive;
    });
  }, [permissions, filterCategory, filterRisk]);

  // Filter user permissions
  const filteredUserPermissions = useMemo(() => {
    return userPermissions.filter(up => {
      if (filterCategory !== 'all') {
        const permission = permissions.find(p => p.id === up.permissionId);
        if (!permission || permission.category !== filterCategory) return false;
      }
      return up.isActive;
    });
  }, [userPermissions, permissions, filterCategory]);

  // Filter permission requests
  const filteredRequests = useMemo(() => {
    return permissionRequests.filter(req => {
      if (filterCategory !== 'all') {
        const permission = permissions.find(p => p.id === req.permissionId);
        if (!permission || permission.category !== filterCategory) return false;
      }
      return true;
    });
  }, [permissionRequests, permissions, filterCategory]);

  // Handle grant permission
  const handleGrantPermission = useCallback(() => {
    if (!selectedUser || !selectedPermission || !onGrantPermission) return;
    
    onGrantPermission(selectedUser, selectedPermission, grantDuration);
    setShowGrantModal(false);
    setSelectedUser('');
    setSelectedPermission('');
    setGrantDuration(30);
  }, [selectedUser, selectedPermission, grantDuration, onGrantPermission]);

  // Handle revoke permission
  const handleRevokePermission = useCallback((userId: string, permissionId: string) => {
    if (onRevokePermission) {
      onRevokePermission(userId, permissionId);
    }
  }, [onRevokePermission]);

  // Handle approve/reject request
  const handleRequestAction = useCallback((requestId: string, approved: boolean, comments?: string) => {
    if (onApproveRequest) {
      onApproveRequest(requestId, approved, comments);
    }
  }, [onApproveRequest]);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Permission Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage user permissions, access grants, and approval requests
            </p>
          </div>
          
          {canManagePermissions && (
            <button
              onClick={() => setShowGrantModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Grant Permission
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('grants')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'grants'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Permissions ({filteredUserPermissions.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Permission Requests ({filteredRequests.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Audit Trail
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Active Permissions Tab */}
        {activeTab === 'grants' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Active User Permissions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Granted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUserPermissions.map((userPerm) => {
                    const permission = permissions.find(p => p.id === userPerm.permissionId);
                    const isExpired = userPerm.expiresAt && new Date(userPerm.expiresAt) < new Date();
                    
                    return (
                      <tr key={`${userPerm.userId}_${userPerm.permissionId}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{userPerm.userName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">{userPerm.permissionName}</div>
                            {permission && (
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(permission.riskLevel)}`}>
                                  {permission.riskLevel}
                                </span>
                                <span className="text-xs text-gray-500">{permission.category}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            userPerm.source === 'role' ? 'bg-blue-100 text-blue-800' :
                            userPerm.source === 'direct' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {userPerm.source}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(userPerm.grantedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {userPerm.expiresAt ? (
                            <span className={isExpired ? 'text-red-600' : ''}>
                              {new Date(userPerm.expiresAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">Never</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {canManagePermissions && userPerm.source === 'direct' && (
                            <button
                              onClick={() => handleRevokePermission(userPerm.userId, userPerm.permissionId)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Permission Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Permission Requests</h3>
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const permission = permissions.find(p => p.id === request.permissionId);
                
                return (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{request.requesterName}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            request.urgency === 'high' ? 'bg-red-100 text-red-800' :
                            request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {request.urgency} priority
                          </span>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-sm text-gray-900">
                            Requesting: <span className="font-medium">{request.permissionName}</span>
                          </p>
                          {permission && (
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(permission.riskLevel)}`}>
                                {permission.riskLevel}
                              </span>
                              <span className="text-xs text-gray-500">{permission.category}</span>
                            </div>
                          )}
                          <p className="text-sm text-gray-600 mt-2">{request.justification}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Duration: {request.requestedDuration} days
                          </p>
                        </div>
                      </div>
                      
                      {canManagePermissions && request.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleRequestAction(request.id, true)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRequestAction(request.id, false)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {request.reviewComments && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Review Comments:</span> {request.reviewComments}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Audit Trail Tab */}
        {activeTab === 'audit' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Permission Audit Trail</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                Audit trail functionality would show detailed logs of all permission changes,
                including grants, revocations, modifications, and access usage.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grant Permission Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Grant Permission</h3>
              <button
                onClick={() => setShowGrantModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="text"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter user ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permission</label>
                <select
                  value={selectedPermission}
                  onChange={(e) => setSelectedPermission(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select permission</option>
                  {filteredPermissions.map(permission => (
                    <option key={permission.id} value={permission.id}>
                      {permission.name} ({permission.riskLevel})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                <input
                  type="number"
                  value={grantDuration}
                  onChange={(e) => setGrantDuration(parseInt(e.target.value) || 30)}
                  min="1"
                  max="365"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowGrantModal(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantPermission}
                disabled={!selectedUser || !selectedPermission}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
              >
                Grant Permission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};