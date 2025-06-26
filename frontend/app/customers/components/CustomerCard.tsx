'use client';

import React, { useState } from 'react';
import type { CustomerCardProps } from '../../../types/customer';
import { formatCustomerName, formatPhoneNumber, formatCurrency, formatRelativeTime, getVerificationStatusInfo, getCustomerActivityStatus, calculateCustomerRiskLevel, getRiskLevelInfo, generateCustomerDisplayId } from '../../../utils/customerHelpers';
import { CheckSquare, Square, Phone, Mail, User, MoreVertical, ChevronDown, ChevronUp, CreditCard, TrendingUp, Shield, Clock, MapPin, Calendar } from 'lucide-react';

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onSelect,
  onAction,
  isSelected = false,
  showActions = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);

  const verificationInfo = getVerificationStatusInfo(customer.verificationStatus);
  const activityStatus = getCustomerActivityStatus(customer);
  const riskLevel = calculateCustomerRiskLevel(customer);
  const riskInfo = getRiskLevelInfo(riskLevel);
  const displayId = generateCustomerDisplayId(customer);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when clicking on action buttons
    if ((e.target as HTMLElement).closest('.card-action')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const handleActionClick = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onAction?.(action, customer.id);
    setShowActionPanel(false);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(customer.id);
  };

  return (
    <div
      className={`customer-card cursor-pointer transition-all duration-200 ${
        isSelected ? 'selected ring-2 ring-primary-500 shadow-lg' : ''
      } ${isExpanded ? 'shadow-lg scale-[1.02]' : ''}`}
      onClick={handleCardClick}
    >
      {/* Card header with selection and customer info */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1">
          {/* Selection checkbox */}
          <button
            onClick={handleSelectClick}
            className="card-action flex-shrink-0 touch-target"
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-primary-600" />
            ) : (
              <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>

          {/* Customer avatar with status indicator */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
            </div>
            {/* Risk level indicator */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${riskInfo.indicator}`} title={riskInfo.text}></div>
          </div>

          {/* Customer basic info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate text-lg">
                {formatCustomerName(customer)}
              </h3>
              <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                {displayId}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
              <Phone className="w-3 h-3" />
              <span>{formatPhoneNumber(customer.phone)}</span>
            </div>
            
            {customer.email && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Mail className="w-3 h-3" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}

            {/* Status badges */}
            <div className="flex items-center space-x-2 mt-2">
              <span className={`verification-badge-${customer.verificationStatus}`}>
                {verificationInfo.text}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${activityStatus.color.replace('text-', 'bg-').replace('-600', '-100')} ${activityStatus.color}`}>
                {activityStatus.text}
              </span>
            </div>
          </div>
        </div>

        {/* Action menu toggle */}
        <div className="flex items-center space-x-1">
          {showActions && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActionPanel(!showActionPanel);
              }}
              className="card-action p-2 text-gray-400 hover:text-gray-600 touch-target"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
          
          {/* Expand/collapse indicator */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="card-action p-1 text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Quick info section (always visible) */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Account balance */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Balance</div>
            <div className="font-semibold text-gray-900">
              {formatCurrency(customer.accountBalance)}
            </div>
          </div>
        </div>

        {/* Account count */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Accounts</div>
            <div className="font-semibold text-gray-900">
              {customer.accounts?.length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded details section */}
      {isExpanded && (
        <div className="space-y-4 pb-4 border-t border-gray-100 pt-4">
          {/* Detailed information */}
          <div className="grid grid-cols-1 gap-3">
            {/* Registration date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Registered</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {new Date(customer.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Last activity */}
            {customer.lastTransactionAt && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Last Activity</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatRelativeTime(customer.lastTransactionAt)}
                </span>
              </div>
            )}

            {/* ID Information */}
            {customer.idNumber && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span>ID Number</span>
                </div>
                <span className="text-sm font-medium text-gray-900 font-mono">
                  {customer.idNumber}
                </span>
              </div>
            )}

            {/* Address */}
            {customer.address && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Location</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {customer.address.city || customer.address.region || customer.address.country}
                </span>
              </div>
            )}

            {/* Risk assessment */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>Risk Level</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${riskInfo.indicator}`}></span>
                <span className={`text-sm font-medium ${riskInfo.color}`}>
                  {riskInfo.text}
                </span>
              </div>
            </div>

            {/* Account types summary */}
            {customer.accounts && customer.accounts.length > 0 && (
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CreditCard className="w-4 h-4" />
                  <span>Account Types</span>
                </div>
                <div className="flex flex-wrap gap-1 max-w-32">
                  {Array.from(new Set(customer.accounts.map(acc => acc.accountType))).map(type => (
                    <span key={type} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                      {type.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expandable Action Panel */}
      {showActions && showActionPanel && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={(e) => handleActionClick('deposit', e)}
              className="customer-action-button text-sm touch-target bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Deposit
            </button>
            <button
              onClick={(e) => handleActionClick('withdraw', e)}
              className="customer-action-button text-sm touch-target bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Withdraw
            </button>
            <button
              onClick={(e) => handleActionClick('info', e)}
              className="customer-action-button text-sm touch-target"
            >
              <User className="w-4 h-4 mr-2" />
              Details
            </button>
            <button
              onClick={(e) => handleActionClick('edit', e)}
              className="customer-action-button text-sm touch-target"
            >
              <Shield className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              onClick={(e) => handleActionClick('accounts', e)}
              className="customer-action-button text-sm touch-target"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Accounts
            </button>
            <button
              onClick={(e) => handleActionClick('history', e)}
              className="customer-action-button text-sm touch-target"
            >
              <Clock className="w-4 h-4 mr-2" />
              History
            </button>
          </div>
        </div>
      )}

      {/* Quick action bar (always visible on mobile) */}
      {showActions && !showActionPanel && (
        <div className="block sm:hidden border-t border-gray-100 pt-3 mt-3">
          <div className="flex justify-between">
            <button
              onClick={(e) => handleActionClick('deposit', e)}
              className="flex-1 customer-action-button text-xs mr-1 bg-green-50 text-green-700 border-green-200"
            >
              Deposit
            </button>
            <button
              onClick={(e) => handleActionClick('info', e)}
              className="flex-1 customer-action-button text-xs mx-1"
            >
              Info
            </button>
            <button
              onClick={(e) => handleActionClick('history', e)}
              className="flex-1 customer-action-button text-xs ml-1"
            >
              History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};