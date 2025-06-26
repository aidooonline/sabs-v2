'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, DollarSign, CreditCard, ArrowUpRight, ArrowDownLeft, Receipt, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';
import { formatCurrency, formatPhoneNumber } from '../../../utils/customerHelpers';
import type { Customer, Account, CustomerTransaction } from '../../../types/customer';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  transactionType: 'deposit' | 'withdrawal' | 'transfer';
  selectedAccount?: Account;
  onTransactionComplete: (transaction: CustomerTransaction) => void;
}

interface TransactionFormData {
  amount: string;
  accountId: string;
  description: string;
  reference: string;
  recipientPhone?: string;
  recipientName?: string;
  pin: string;
}

interface ValidationErrors {
  amount?: string;
  accountId?: string;
  pin?: string;
  recipientPhone?: string;
  recipientName?: string;
  description?: string;
  reference?: string;
  general?: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  customer,
  transactionType,
  selectedAccount,
  onTransactionComplete,
}) => {
  const [step, setStep] = useState<'form' | 'confirm' | 'processing' | 'success' | 'error'>('form');
  const [formData, setFormData] = useState<TransactionFormData>({
    amount: '',
    accountId: selectedAccount?.id || '',
    description: '',
    reference: '',
    recipientPhone: '',
    recipientName: '',
    pin: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionResult, setTransactionResult] = useState<CustomerTransaction | null>(null);
  const [processingTimeout, setProcessingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Reset form when modal opens/closes or transaction type changes
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setFormData({
        amount: '',
        accountId: selectedAccount?.id || '',
        description: '',
        reference: generateReference(),
        recipientPhone: '',
        recipientName: '',
        pin: '',
      });
      setErrors({});
      setTransactionResult(null);
    }
  }, [isOpen, transactionType, selectedAccount]);

  // Generate unique transaction reference
  const generateReference = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${transactionType.toUpperCase()}-${timestamp}-${random}`;
  };

  // Get available accounts for the transaction type
  const getAvailableAccounts = () => {
    if (!customer.accounts) return [];
    
    switch (transactionType) {
      case 'deposit':
        return customer.accounts.filter(acc => acc.status === 'active');
      case 'withdrawal':
        return customer.accounts.filter(acc => 
          acc.status === 'active' && 
          acc.balance > 0 && 
          acc.accountType !== 'loan'
        );
      case 'transfer':
        return customer.accounts.filter(acc => 
          acc.status === 'active' && 
          acc.balance > 0
        );
      default:
        return customer.accounts;
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Amount validation
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (amount < 1) {
      newErrors.amount = 'Minimum amount is GHS 1.00';
    } else if (amount > 50000) {
      newErrors.amount = 'Maximum amount is GHS 50,000.00';
    }

    // Account validation
    if (!formData.accountId) {
      newErrors.accountId = 'Please select an account';
    }

    // Balance validation for withdrawals and transfers
    if ((transactionType === 'withdrawal' || transactionType === 'transfer') && formData.accountId) {
      const account = customer.accounts?.find(acc => acc.id === formData.accountId);
      if (account && amount > account.balance) {
        newErrors.amount = `Insufficient balance. Available: ${formatCurrency(account.balance)}`;
      }
    }

    // Transfer-specific validation
    if (transactionType === 'transfer') {
      if (!formData.recipientPhone) {
        newErrors.recipientPhone = 'Please enter recipient phone number';
      } else if (!/^\+233\d{9}$/.test(formData.recipientPhone)) {
        newErrors.recipientPhone = 'Invalid phone number format (+233XXXXXXXXX)';
      } else if (formData.recipientPhone === customer.phone) {
        newErrors.recipientPhone = 'Cannot transfer to your own number';
      }
    }

    // PIN validation
    if (!formData.pin) {
      newErrors.pin = 'Please enter your transaction PIN';
    } else if (formData.pin.length !== 4) {
      newErrors.pin = 'PIN must be 4 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form field changes
  const handleInputChange = (field: keyof TransactionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Auto-format phone number
    if (field === 'recipientPhone' && value.length > 0 && !value.startsWith('+233')) {
      if (value.startsWith('0')) {
        setFormData(prev => ({ ...prev, [field]: '+233' + value.slice(1) }));
      } else if (value.startsWith('233')) {
        setFormData(prev => ({ ...prev, [field]: '+' + value }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      setStep('confirm');
    }
  };

  // Process transaction
  const processTransaction = async () => {
    setStep('processing');
    setIsProcessing(true);

    try {
      // Simulate processing delay
      const timeout = setTimeout(async () => {
        try {
          const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerId: customer.id,
              accountId: formData.accountId,
              type: transactionType,
              amount: parseFloat(formData.amount),
              description: formData.description || `${transactionType} transaction`,
              reference: formData.reference,
              recipientPhone: formData.recipientPhone,
              recipientName: formData.recipientName,
              pin: formData.pin,
            }),
          });

          if (!response.ok) {
            throw new Error('Transaction failed');
          }

          const transaction = await response.json();
          setTransactionResult(transaction);
          setStep('success');
          
          // Notify parent component
          onTransactionComplete(transaction);
        } catch (error) {
          console.error('Transaction error:', error);
          setStep('error');
          setErrors({ general: 'Transaction failed. Please try again.' });
        } finally {
          setIsProcessing(false);
        }
      }, 2000); // Simulate 2-second processing

      setProcessingTimeout(timeout);
    } catch (error) {
      setStep('error');
      setIsProcessing(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (processingTimeout) {
      clearTimeout(processingTimeout);
    }
    setStep('form');
    onClose();
  };

  // Get transaction icon and color
  const getTransactionIcon = () => {
    switch (transactionType) {
      case 'deposit':
        return { icon: ArrowDownLeft, color: 'text-green-600', bg: 'bg-green-100' };
      case 'withdrawal':
        return { icon: ArrowUpRight, color: 'text-red-600', bg: 'bg-red-100' };
      case 'transfer':
        return { icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100' };
      default:
        return { icon: DollarSign, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const { icon: TransactionIcon, color, bg } = getTransactionIcon();
  const selectedAccountData = customer.accounts?.find(acc => acc.id === formData.accountId);
  const availableAccounts = getAvailableAccounts();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="transaction-modal max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="transaction-modal-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                <TransactionIcon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 capitalize">
                  {transactionType} Transaction
                </h2>
                <p className="text-sm text-gray-600">
                  {customer.firstName} {customer.lastName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              disabled={isProcessing}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="transaction-modal-content">
          {step === 'form' && (
            <div className="space-y-6">
              {/* Account Selection */}
              <div className="form-field">
                <label htmlFor="accountId" className="form-label required">
                  Select Account
                </label>
                <select
                  id="accountId"
                  value={formData.accountId}
                  onChange={(e) => handleInputChange('accountId', e.target.value)}
                  className={`form-input ${errors.accountId ? 'form-input-error' : ''}`}
                >
                  <option value="">Select an account</option>
                  {availableAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.accountNumber} - {formatCurrency(account.balance)} ({account.accountType.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                {errors.accountId && <div className="form-error">{errors.accountId}</div>}
              </div>

              {/* Amount */}
              <div className="form-field">
                <label htmlFor="amount" className="form-label required">
                  Amount (GHS)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="amount"
                    type="number"
                    min="1"
                    max="50000"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className={`form-input pl-10 ${errors.amount ? 'form-input-error' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.amount && <div className="form-error">{errors.amount}</div>}
                
                {selectedAccountData && transactionType !== 'deposit' && (
                  <div className="text-sm text-gray-500 mt-1">
                    Available balance: {formatCurrency(selectedAccountData.balance)}
                  </div>
                )}
              </div>

              {/* Transfer Recipient */}
              {transactionType === 'transfer' && (
                <>
                  <div className="form-field">
                    <label htmlFor="recipientPhone" className="form-label required">
                      Recipient Phone Number
                    </label>
                    <input
                      id="recipientPhone"
                      type="tel"
                      value={formData.recipientPhone}
                      onChange={(e) => handleInputChange('recipientPhone', e.target.value)}
                      className={`form-input ${errors.recipientPhone ? 'form-input-error' : ''}`}
                      placeholder="+233XXXXXXXXX"
                    />
                    {errors.recipientPhone && <div className="form-error">{errors.recipientPhone}</div>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="recipientName" className="form-label">
                      Recipient Name (Optional)
                    </label>
                    <input
                      id="recipientName"
                      type="text"
                      value={formData.recipientName}
                      onChange={(e) => handleInputChange('recipientName', e.target.value)}
                      className="form-input"
                      placeholder="Enter recipient name"
                    />
                  </div>
                </>
              )}

              {/* Description */}
              <div className="form-field">
                <label htmlFor="description" className="form-label">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="form-input"
                  rows={2}
                  placeholder="Enter transaction description"
                />
              </div>

              {/* Reference */}
              <div className="form-field">
                <label htmlFor="reference" className="form-label">
                  Reference Number
                </label>
                <input
                  id="reference"
                  type="text"
                  value={formData.reference}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                  className="form-input font-mono text-sm"
                  placeholder="Auto-generated"
                />
              </div>

              {/* Transaction PIN */}
              <div className="form-field">
                <label htmlFor="pin" className="form-label required">
                  Transaction PIN
                </label>
                <input
                  id="pin"
                  type="password"
                  maxLength={4}
                  value={formData.pin}
                  onChange={(e) => handleInputChange('pin', e.target.value.replace(/\D/g, ''))}
                  className={`form-input ${errors.pin ? 'form-input-error' : ''}`}
                  placeholder="Enter 4-digit PIN"
                />
                {errors.pin && <div className="form-error">{errors.pin}</div>}
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 btn-primary"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full ${bg} flex items-center justify-center mx-auto mb-4`}>
                  <TransactionIcon className={`w-8 h-8 ${color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirm Transaction
                </h3>
                <p className="text-gray-600">
                  Please review the transaction details before proceeding
                </p>
              </div>

              {/* Transaction Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Type:</span>
                  <span className="font-medium capitalize">{transactionType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-lg">{formatCurrency(parseFloat(formData.amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account:</span>
                  <span className="font-medium">{selectedAccountData?.accountNumber}</span>
                </div>
                {transactionType === 'transfer' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recipient:</span>
                    <span className="font-medium">{formatPhoneNumber(formData.recipientPhone!)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-mono text-sm">{formData.reference}</span>
                </div>
              </div>

              {/* Confirm Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('form')}
                  className="flex-1 btn-secondary"
                >
                  Back
                </button>
                <button
                  onClick={processTransaction}
                  className="flex-1 btn-primary"
                >
                  Process Transaction
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Processing Transaction
              </h3>
              <p className="text-gray-600">
                Please wait while we process your transaction...
              </p>
            </div>
          )}

          {step === 'success' && transactionResult && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Transaction Successful
                </h3>
                <p className="text-gray-600">
                  Your {transactionType} has been processed successfully
                </p>
              </div>

              {/* Transaction Receipt */}
              <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">{formatCurrency(transactionResult.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-mono text-sm">{transactionResult.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-medium">{transactionResult.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span>{new Date(transactionResult.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 btn-secondary"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Print Receipt
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 btn-primary"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Transaction Failed
                </h3>
                <p className="text-gray-600">
                  {errors.general || 'An error occurred while processing your transaction'}
                </p>
              </div>

              {/* Retry Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('form')}
                  className="flex-1 btn-secondary"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};