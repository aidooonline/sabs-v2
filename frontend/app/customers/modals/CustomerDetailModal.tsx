'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, Cancel, User, CreditCard, FileText, AlertTriangle, Phone, Mail, MapPin, Calendar, Shield, Activity } from 'lucide-react';
import { CustomerPersonalInfo } from '../forms/CustomerPersonalInfo';
import { CustomerAccountsPanel } from '../components/CustomerAccountsPanel';
import { CustomerTransactionHistory } from '../components/CustomerTransactionHistory';
import { CustomerDocumentsPanel } from '../components/CustomerDocumentsPanel';
import { CustomerRiskAssessment } from '../components/CustomerRiskAssessment';
import { useCustomerRealTime } from '../hooks/useCustomerRealTime';
import { formatCustomerName, formatPhoneNumber, formatCurrency, getVerificationStatusInfo, calculateCustomerRiskLevel, getRiskLevelInfo, formatRelativeTime } from '../../../utils/customerHelpers';
import type { Customer } from '../../../types/customer';

interface CustomerDetailModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onCustomerUpdate: (updatedCustomer: Customer) => void;
  mode?: 'view' | 'edit';
}

type TabType = 'overview' | 'accounts' | 'transactions' | 'documents' | 'risk';

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer: initialCustomer,
  isOpen,
  onClose,
  onCustomerUpdate,
  mode: initialMode = 'view',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editMode, setEditMode] = useState(initialMode === 'edit');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Real-time customer data
  const { 
    customer: liveCustomer, 
    isConnected, 
    lastUpdate,
    updateCustomer 
  } = useCustomerRealTime(initialCustomer.id);

  const customer = liveCustomer || initialCustomer;

  // Handle modal close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setHasUnsavedChanges(false);
        setEditMode(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (editMode && hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Discard them?')) {
        setEditMode(false);
        setHasUnsavedChanges(false);
      }
    } else {
      setEditMode(!editMode);
    }
  };

  // Handle customer save
  const handleSave = async (updatedData: Partial<Customer>) => {
    setIsLoading(true);
    try {
      const updatedCustomer = { ...customer, ...updatedData };
      await updateCustomer(updatedCustomer);
      onCustomerUpdate(updatedCustomer);
      setEditMode(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to update customer:', error);
      // Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, hasUnsavedChanges]);

  if (!isOpen) return null;

  const verificationInfo = getVerificationStatusInfo(customer.verificationStatus);
  const riskLevel = calculateCustomerRiskLevel(customer);
  const riskInfo = getRiskLevelInfo(riskLevel);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: User },
    { id: 'accounts' as TabType, label: 'Accounts', icon: CreditCard },
    { id: 'transactions' as TabType, label: 'Transactions', icon: FileText },
    { id: 'documents' as TabType, label: 'Documents', icon: Shield },
    { id: 'risk' as TabType, label: 'Risk Assessment', icon: AlertTriangle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="customer-detail-modal max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="customer-detail-header">
          <div className="flex items-center justify-between">
            {/* Customer info */}
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                  {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                </div>
                {/* Status indicators */}
                <div className="absolute -bottom-1 -right-1 flex space-x-1">
                  <div className={`w-4 h-4 rounded-full border-2 border-white ${riskInfo.indicator}`} title={riskInfo.text}></div>
                  {isConnected && (
                    <div className="w-3 h-3 bg-green-500 rounded-full border border-white" title="Real-time connected"></div>
                  )}
                </div>
              </div>

              {/* Basic info */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {formatCustomerName(customer)}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Phone className="w-4 h-4" />
                    <span>{formatPhoneNumber(customer.phone)}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`verification-badge-${customer.verificationStatus}`}>
                    {verificationInfo.text}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700`}>
                    ID: {customer.id.slice(-8).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* Real-time status */}
              {lastUpdate && (
                <div className="text-xs text-gray-500 mr-4">
                  <div className="flex items-center space-x-1">
                    <Activity className="w-3 h-3" />
                    <span>Updated {formatRelativeTime(lastUpdate)}</span>
                  </div>
                </div>
              )}

              {/* Edit/Save buttons */}
              {editMode ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSave({})}
                    disabled={isLoading || !hasUnsavedChanges}
                    className="btn-primary text-sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleEditToggle}
                    className="btn-secondary text-sm"
                  >
                    <Cancel className="w-4 h-4 mr-1" />
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="btn-secondary text-sm"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </button>
              )}

              {/* Close button */}
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="customer-quick-stat">
              <div className="customer-quick-stat-icon bg-green-100 text-green-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="customer-quick-stat-label">Total Balance</div>
                <div className="customer-quick-stat-value">
                  {formatCurrency(customer.accountBalance)}
                </div>
              </div>
            </div>

            <div className="customer-quick-stat">
              <div className="customer-quick-stat-icon bg-blue-100 text-blue-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="customer-quick-stat-label">Accounts</div>
                <div className="customer-quick-stat-value">
                  {customer.accounts?.length || 0}
                </div>
              </div>
            </div>

            <div className="customer-quick-stat">
              <div className="customer-quick-stat-icon bg-purple-100 text-purple-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="customer-quick-stat-label">Customer Since</div>
                <div className="customer-quick-stat-value">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="customer-quick-stat">
              <div className={`customer-quick-stat-icon ${riskInfo.bgColor} ${riskInfo.color}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="customer-quick-stat-label">Risk Level</div>
                <div className={`customer-quick-stat-value ${riskInfo.color}`}>
                  {riskInfo.text}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="customer-detail-tabs">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`customer-detail-tab ${
                      activeTab === tab.id ? 'active' : ''
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Modal Content */}
        <div className="customer-detail-content">
          {activeTab === 'overview' && (
            <CustomerPersonalInfo
              customer={customer}
              editMode={editMode}
              onUpdate={(data) => {
                setHasUnsavedChanges(true);
                // Handle form changes
              }}
            />
          )}

          {activeTab === 'accounts' && (
            <CustomerAccountsPanel
              customerId={customer.id}
              accounts={customer.accounts || []}
              editMode={editMode}
            />
          )}

          {activeTab === 'transactions' && (
            <CustomerTransactionHistory
              customerId={customer.id}
              accounts={customer.accounts || []}
            />
          )}

          {activeTab === 'documents' && (
            <CustomerDocumentsPanel
              customerId={customer.id}
              documents={customer.documents || []}
              editMode={editMode}
            />
          )}

          {activeTab === 'risk' && (
            <CustomerRiskAssessment
              customer={customer}
              riskLevel={riskLevel}
              editMode={editMode}
            />
          )}
        </div>
      </div>
    </div>
  );
};