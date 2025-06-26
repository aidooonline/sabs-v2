'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  isActive: boolean;
  permissions: string[];
}

interface Delegation {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  permissions: string[];
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'active' | 'expired' | 'revoked' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  metadata: {
    requiresApproval: boolean;
    maxDuration: number; // in days
    canSubdelegate: boolean;
    restrictions: {
      maxAmount?: number;
      ipWhitelist?: string[];
      timeSlots?: { start: string; end: string }[];
    };
  };
  usageStats?: {
    timesUsed: number;
    lastUsed?: string;
  };
}

interface DelegationRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  requestedPermissions: string[];
  duration: number;
  justification: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComments?: string;
}

interface DelegationManagerProps {
  currentUser: User;
  users: User[];
  delegations: Delegation[];
  delegationRequests: DelegationRequest[];
  permissions: { id: string; name: string; description: string }[];
  onCreateDelegation?: (delegation: Omit<Delegation, 'id' | 'createdAt' | 'status'>) => void;
  onRevokeDelegation?: (delegationId: string) => void;
  onApproveDelegationRequest?: (requestId: string, approved: boolean, comments?: string) => void;
  onCreateDelegationRequest?: (request: Omit<DelegationRequest, 'id' | 'requestedAt' | 'status'>) => void;
  canManageDelegations?: boolean;
}

export const DelegationManager: React.FC<DelegationManagerProps> = ({
  currentUser,
  users,
  delegations,
  delegationRequests,
  permissions,
  onCreateDelegation,
  onRevokeDelegation,
  onApproveDelegationRequest,
  onCreateDelegationRequest,
  canManageDelegations = false
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'requests' | 'create'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDelegate, setSelectedDelegate] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [delegationDuration, setDelegationDuration] = useState<number>(7);
  const [delegationReason, setDelegationReason] = useState<string>('');
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [requiresApproval, setRequiresApproval] = useState<boolean>(false);
  const [maxAmount, setMaxAmount] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [timeSlots, setTimeSlots] = useState<{ start: string; end: string }[]>([]);

  // Filter delegations based on current user and status
  const filteredDelegations = useMemo(() => {
    return delegations.filter(delegation => {
      if (filterStatus !== 'all' && delegation.status !== filterStatus) return false;
      // Show delegations where user is delegator or delegate
      return delegation.fromUserId === currentUser.id || delegation.toUserId === currentUser.id;
    });
  }, [delegations, currentUser.id, filterStatus]);

  // Filter delegation requests
  const filteredRequests = useMemo(() => {
    return delegationRequests.filter(request => {
      // Show requests where user is involved or can approve
      return request.fromUserId === currentUser.id || 
             request.toUserId === currentUser.id ||
             canManageDelegations;
    });
  }, [delegationRequests, currentUser.id, canManageDelegations]);

  // Get user's delegatable permissions
  const delegatablePermissions = useMemo(() => {
    return permissions.filter(permission => 
      currentUser.permissions.includes(permission.id)
    );
  }, [permissions, currentUser.permissions]);

  // Get available users for delegation
  const availableUsers = useMemo(() => {
    return users.filter(user => 
      user.id !== currentUser.id && user.isActive
    );
  }, [users, currentUser.id]);

  // Get status color
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      case 'revoked': return 'text-red-600 bg-red-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'approved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Get urgency color
  const getUrgencyColor = useCallback((urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Check if delegation is expiring soon
  const isExpiringSoon = useCallback((endDate: string): boolean => {
    const end = new Date(endDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  }, []);

  // Handle create delegation
  const handleCreateDelegation = useCallback(() => {
    if (!selectedDelegate || selectedPermissions.length === 0 || !delegationReason) return;

    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + delegationDuration * 24 * 60 * 60 * 1000).toISOString();

    const newDelegation: Omit<Delegation, 'id' | 'createdAt' | 'status'> = {
      fromUserId: currentUser.id,
      fromUserName: currentUser.name,
      toUserId: selectedDelegate,
      toUserName: users.find(u => u.id === selectedDelegate)?.name || '',
      permissions: selectedPermissions,
      startDate,
      endDate,
      reason: delegationReason,
      metadata: {
        requiresApproval,
        maxDuration: delegationDuration,
        canSubdelegate: false,
        restrictions: {
          maxAmount: maxAmount > 0 ? maxAmount : undefined,
          timeSlots: timeSlots.length > 0 ? timeSlots : undefined
        }
      }
    };

    if (onCreateDelegation) {
      onCreateDelegation(newDelegation);
    }

    // Reset form
    setSelectedDelegate('');
    setSelectedPermissions([]);
    setDelegationDuration(7);
    setDelegationReason('');
    setRequiresApproval(false);
    setMaxAmount(0);
    setTimeSlots([]);
    setShowCreateModal(false);
  }, [
    selectedDelegate, selectedPermissions, delegationReason, delegationDuration,
    requiresApproval, maxAmount, timeSlots, currentUser, users, onCreateDelegation
  ]);

  // Handle create delegation request
  const handleCreateDelegationRequest = useCallback(() => {
    if (!selectedDelegate || selectedPermissions.length === 0 || !delegationReason) return;

    const newRequest: Omit<DelegationRequest, 'id' | 'requestedAt' | 'status'> = {
      fromUserId: currentUser.id,
      fromUserName: currentUser.name,
      toUserId: selectedDelegate,
      toUserName: users.find(u => u.id === selectedDelegate)?.name || '',
      requestedPermissions: selectedPermissions,
      duration: delegationDuration,
      justification: delegationReason,
      urgency: urgencyLevel
    };

    if (onCreateDelegationRequest) {
      onCreateDelegationRequest(newRequest);
    }

    // Reset form
    setSelectedDelegate('');
    setSelectedPermissions([]);
    setDelegationDuration(7);
    setDelegationReason('');
    setUrgencyLevel('medium');
    setShowCreateModal(false);
  }, [
    selectedDelegate, selectedPermissions, delegationReason, delegationDuration,
    urgencyLevel, currentUser, users, onCreateDelegationRequest
  ]);

  // Handle revoke delegation
  const handleRevokeDelegation = useCallback((delegationId: string) => {
    if (onRevokeDelegation) {
      onRevokeDelegation(delegationId);
    }
  }, [onRevokeDelegation]);

  // Handle approve/reject delegation request
  const handleRequestAction = useCallback((requestId: string, approved: boolean, comments?: string) => {
    if (onApproveDelegationRequest) {
      onApproveDelegationRequest(requestId, approved, comments);
    }
  }, [onApproveDelegationRequest]);

  // Add time slot
  const addTimeSlot = useCallback(() => {
    setTimeSlots([...timeSlots, { start: '09:00', end: '17:00' }]);
  }, [timeSlots]);

  // Remove time slot
  const removeTimeSlot = useCallback((index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  }, [timeSlots]);

  // Update time slot
  const updateTimeSlot = useCallback((index: number, field: 'start' | 'end', value: string) => {
    const newSlots = [...timeSlots];
    newSlots[index][field] = value;
    setTimeSlots(newSlots);
  }, [timeSlots]);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Delegation Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage permission delegations and temporary access grants
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            New Delegation
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Delegations ({filteredDelegations.filter(d => d.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Delegation Requests ({filteredRequests.filter(r => r.status === 'pending').length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Active Delegations Tab */}
        {activeTab === 'active' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Delegations</h3>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Delegations</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {filteredDelegations.filter(d => d.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {filteredDelegations.filter(d => d.status === 'active' && isExpiringSoon(d.endDate)).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-green-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Delegated To You</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {filteredDelegations.filter(d => d.toUserId === currentUser.id && d.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delegations List */}
            <div className="space-y-4">
              {filteredDelegations.map((delegation) => (
                <div key={delegation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{delegation.fromUserName}</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <span className="font-medium text-gray-900">{delegation.toUserName}</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delegation.status)}`}>
                          {delegation.status}
                        </span>
                        {isExpiringSoon(delegation.endDate) && delegation.status === 'active' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Expiring Soon
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">{delegation.reason}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Start: {new Date(delegation.startDate).toLocaleDateString()}</span>
                          <span>End: {new Date(delegation.endDate).toLocaleDateString()}</span>
                          <span>{delegation.permissions.length} permissions</span>
                        </div>
                        
                        {delegation.usageStats && (
                          <div className="mt-2 text-xs text-gray-500">
                            Used {delegation.usageStats.timesUsed} times
                            {delegation.usageStats.lastUsed && (
                              <span>, last used {new Date(delegation.usageStats.lastUsed).toLocaleDateString()}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {delegation.fromUserId === currentUser.id && delegation.status === 'active' && (
                        <button
                          onClick={() => handleRevokeDelegation(delegation.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Revoke
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                  
                  {/* Permissions List */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {delegation.permissions.map(permId => {
                        const permission = permissions.find(p => p.id === permId);
                        return permission ? (
                          <span key={permId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            {permission.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                  
                  {/* Restrictions */}
                  {delegation.metadata.restrictions && (
                    <div className="mt-2 text-xs text-gray-500">
                      {delegation.metadata.restrictions.maxAmount && (
                        <span>Max Amount: ₵{delegation.metadata.restrictions.maxAmount.toLocaleString()}</span>
                      )}
                      {delegation.metadata.restrictions.timeSlots && (
                        <span className="ml-4">Time Restricted</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delegation Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delegation Requests</h3>
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">{request.fromUserName}</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="font-medium text-gray-900">{request.toUserName}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                          {request.urgency}
                        </span>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">{request.justification}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Duration: {request.duration} days</span>
                          <span>{request.requestedPermissions.length} permissions</span>
                          <span>Requested: {new Date(request.requestedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {canManageDelegations && request.status === 'pending' && (
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
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Delegation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Delegation</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delegate To</label>
                  <select
                    value={selectedDelegate}
                    onChange={(e) => setSelectedDelegate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select user</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.department})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                  <input
                    type="number"
                    value={delegationDuration}
                    onChange={(e) => setDelegationDuration(parseInt(e.target.value) || 7)}
                    min="1"
                    max="90"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {delegatablePermissions.map(permission => (
                    <label key={permission.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, permission.id]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{permission.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={delegationReason}
                  onChange={(e) => setDelegationReason(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain why this delegation is needed..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount (₵)</label>
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0 for no limit"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                  <select
                    value={urgencyLevel}
                    onChange={(e) => setUrgencyLevel(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={requiresApproval}
                    onChange={(e) => setRequiresApproval(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">Requires approval</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={requiresApproval ? handleCreateDelegationRequest : handleCreateDelegation}
                disabled={!selectedDelegate || selectedPermissions.length === 0 || !delegationReason}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
              >
                {requiresApproval ? 'Submit Request' : 'Create Delegation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};