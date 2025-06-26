'use client';

import React from 'react';
import type { CustomerCardProps } from '../../../types/customer';
import { formatCustomerName, formatPhoneNumber, formatCurrency, formatRelativeTime, getVerificationStatusInfo, getCustomerActivityStatus, calculateCustomerRiskLevel, getRiskLevelInfo } from '../../../utils/customerHelpers';
import { CheckSquare, Square, Phone, Mail, User, MoreVertical } from 'lucide-react';

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onSelect,
  onAction,
  isSelected = false,
  showActions = true,
}) => {
  const verificationInfo = getVerificationStatusInfo(customer.verificationStatus);
  const activityStatus = getCustomerActivityStatus(customer);
  const riskLevel = calculateCustomerRiskLevel(customer);
  const riskInfo = getRiskLevelInfo(riskLevel);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when clicking on action buttons
    if ((e.target as HTMLElement).closest('.card-action')) {
      return;
    }
    onSelect?.(customer.id);
  };

  const handleActionClick = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onAction?.(action, customer.id);
  };

  return (
    <div
      className={`customer-card cursor-pointer transition-all duration-200 ${
        isSelected ? 'selected ring-2 ring-primary-500' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Card header with selection and customer info */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1">
          {/* Selection checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(customer.id);
            }}
            className="card-action flex-shrink-0"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-primary-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>

          {/* Customer avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
            {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
          </div>

          {/* Customer basic info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {formatCustomerName(customer)}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {formatPhoneNumber(customer.phone)}
            </p>
            {customer.email && (
              <p className="text-sm text-gray-500 truncate">
                {customer.email}
              </p>
            )}
          </div>
        </div>

        {/* More actions menu */}
        {showActions && (
          <button
            onClick={(e) => handleActionClick('menu', e)}
            className="card-action p-1 text-gray-400 hover:text-gray-600"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Customer details */}
      <div className="space-y-3">
        {/* Account balance */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Balance</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(customer.accountBalance)}
          </span>
        </div>

        {/* Account count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Accounts</span>
          <span className="text-sm text-gray-900">
            {customer.accounts?.length || 0}
          </span>
        </div>

        {/* Status indicators */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${verificationInfo.bgColor} ${verificationInfo.color}`}>
              {verificationInfo.text}
            </span>
            <span className={`w-2 h-2 rounded-full ${riskInfo.indicator}`} title={riskInfo.text}></span>
          </div>
        </div>

        {/* Activity status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Activity</span>
          <span className={`text-sm ${activityStatus.color}`}>
            {activityStatus.text}
          </span>
        </div>

        {/* Last transaction */}
        {customer.lastTransactionAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last Activity</span>
            <span className="text-sm text-gray-900">
              {formatRelativeTime(customer.lastTransactionAt)}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="customer-action-panel">
          <button
            onClick={(e) => handleActionClick('deposit', e)}
            className="customer-action-button text-xs"
          >
            Deposit
          </button>
          <button
            onClick={(e) => handleActionClick('withdraw', e)}
            className="customer-action-button text-xs"
          >
            Withdraw
          </button>
          <button
            onClick={(e) => handleActionClick('info', e)}
            className="customer-action-button text-xs"
          >
            Info
          </button>
          <button
            onClick={(e) => handleActionClick('edit', e)}
            className="customer-action-button text-xs"
          >
            Edit
          </button>
          <button
            onClick={(e) => handleActionClick('accounts', e)}
            className="customer-action-button text-xs"
          >
            Accounts
          </button>
          <button
            onClick={(e) => handleActionClick('history', e)}
            className="customer-action-button text-xs"
          >
            History
          </button>
        </div>
      )}
    </div>
  );
};