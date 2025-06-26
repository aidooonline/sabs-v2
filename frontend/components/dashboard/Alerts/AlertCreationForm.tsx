'use client';

import React, { useState, useEffect } from 'react';

// Types for alerts and form data
interface AlertType {
  type: string;
  title: string;
  description: string;
  category: string;
  fields: string[];
  defaultThreshold: number;
}

interface AlertFormData {
  type: string;
  title: string;
  threshold: number;
  accountId?: string;
  category?: string;
  period?: string;
  amount?: number;
  daysAhead?: number;
  payee?: string;
  milestone?: number;
  frequency: 'immediate' | 'daily' | 'weekly';
  enabled: boolean;
  description?: string;
}

interface AlertFormErrors {
  type?: string;
  title?: string;
  threshold?: string;
  accountId?: string;
  category?: string;
  period?: string;
  amount?: string;
  daysAhead?: string;
  payee?: string;
  milestone?: string;
  frequency?: string;
  enabled?: string;
  description?: string;
}

interface AlertCreationFormProps {
  alertTypes: AlertType[];
  isLoading: boolean;
  onCreate: (alertData: AlertFormData) => void;
}

// Mock data for form options
const mockAccounts = [
  { id: '1', name: 'Savings Account', balance: 15420.50 },
  { id: '2', name: 'Current Account', balance: 2650.75 },
  { id: '3', name: 'Mobile Wallet', balance: 850.00 },
  { id: '4', name: 'Investment Account', balance: 25000.00 },
];

const mockCategories = [
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Business',
  'Others',
];

const mockPayees = [
  'ECG (Electricity)',
  'Ghana Water Company',
  'MTN Mobile',
  'Vodafone',
  'AirtelTigo',
  'DSTV',
  'Netflix',
  'Spotify',
];

export function AlertCreationForm({ alertTypes, isLoading, onCreate }: AlertCreationFormProps) {
  const [selectedType, setSelectedType] = useState<AlertType | null>(null);
  const [formData, setFormData] = useState<AlertFormData>({
    type: '',
    title: '',
    threshold: 0,
    frequency: 'immediate',
    enabled: true,
  });
  const [errors, setErrors] = useState<AlertFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when alert type changes
  useEffect(() => {
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        type: selectedType.type,
        title: selectedType.title,
        threshold: selectedType.defaultThreshold,
      }));
      setErrors({});
    }
  }, [selectedType]);

  // Format currency for Ghana
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Validation logic
  const validateForm = (): boolean => {
    const newErrors: AlertFormErrors = {};

    if (!formData.type) {
      newErrors.type = 'Please select an alert type';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Alert title is required';
    }

    if (formData.threshold <= 0) {
      newErrors.threshold = 'Threshold must be greater than 0';
    }

    // Type-specific validations
    if (selectedType) {
      if (selectedType.fields.includes('account') && !formData.accountId) {
        newErrors.accountId = 'Please select an account';
      }

      if (selectedType.fields.includes('category') && !formData.category) {
        newErrors.category = 'Please select a category';
      }

      if (selectedType.fields.includes('payee') && !formData.payee) {
        newErrors.payee = 'Please select a payee';
      }

      if (selectedType.fields.includes('daysAhead') && (!formData.daysAhead || formData.daysAhead < 1)) {
        newErrors.daysAhead = 'Days ahead must be at least 1';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onCreate(formData);
      
      // Reset form
      setFormData({
        type: '',
        title: '',
        threshold: 0,
        frequency: 'immediate',
        enabled: true,
      });
      setSelectedType(null);
      setErrors({});
      
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof AlertFormData, value: any) => {
    // Convert string values to appropriate types
    let convertedValue = value;
    if (field === 'threshold' || field === 'amount' || field === 'milestone') {
      convertedValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    } else if (field === 'daysAhead') {
      convertedValue = typeof value === 'string' ? parseInt(value) || 0 : value;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: convertedValue,
    }));
    
    // Clear error for this field
    if (errors[field as keyof AlertFormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof AlertFormErrors];
        return newErrors;
      });
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="dashboard-card">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Create New Alert
          </h2>
          <p className="text-gray-600">
            Set up automated alerts to stay informed about your financial activity
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alert Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Alert Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {alertTypes.map((alertType) => (
                <div
                  key={alertType.type}
                  onClick={() => setSelectedType(alertType)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedType?.type === alertType.type
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${
                      alertType.category === 'balance' ? 'bg-blue-500' :
                      alertType.category === 'budget' ? 'bg-orange-500' :
                      alertType.category === 'security' ? 'bg-red-500' :
                      alertType.category === 'payments' ? 'bg-green-500' :
                      'bg-purple-500'
                    }`}></div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {alertType.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {alertType.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.type && (
              <p className="mt-1 text-sm text-danger-600">{errors.type}</p>
            )}
          </div>

          {/* Alert Configuration */}
          {selectedType && (
            <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">
                Configure {selectedType.title}
              </h3>

              {/* Alert Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.title ? 'border-danger-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter a descriptive title for this alert"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-danger-600">{errors.title}</p>
                )}
              </div>

              {/* Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedType.type === 'budget_exceeded' ? 'Percentage Threshold *' : 'Amount Threshold *'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.threshold}
                    onChange={(e) => handleInputChange('threshold', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.threshold ? 'border-danger-300' : 'border-gray-300'
                    }`}
                    min="0"
                    step={selectedType.type === 'budget_exceeded' ? '1' : '0.01'}
                    placeholder={selectedType.type === 'budget_exceeded' ? '80' : '1000'}
                  />
                  <span className="absolute right-3 top-2 text-gray-500">
                    {selectedType.type === 'budget_exceeded' ? '%' : 'GHS'}
                  </span>
                </div>
                {selectedType.type !== 'budget_exceeded' && formData.threshold > 0 && (
                  <p className="mt-1 text-sm text-gray-600">
                    {formatCurrency(formData.threshold)}
                  </p>
                )}
                {errors.threshold && (
                  <p className="mt-1 text-sm text-danger-600">{errors.threshold}</p>
                )}
              </div>

              {/* Account Selection */}
              {selectedType.fields.includes('account') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account *
                  </label>
                  <select
                    value={formData.accountId || ''}
                    onChange={(e) => handleInputChange('accountId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.accountId ? 'border-danger-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select an account</option>
                    {mockAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({formatCurrency(account.balance)})
                      </option>
                    ))}
                  </select>
                  {errors.accountId && (
                    <p className="mt-1 text-sm text-danger-600">{errors.accountId}</p>
                  )}
                </div>
              )}

              {/* Category Selection */}
              {selectedType.fields.includes('category') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.category ? 'border-danger-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a category</option>
                    {mockCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-danger-600">{errors.category}</p>
                  )}
                </div>
              )}

              {/* Payee Selection */}
              {selectedType.fields.includes('payee') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payee *
                  </label>
                  <select
                    value={formData.payee || ''}
                    onChange={(e) => handleInputChange('payee', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.payee ? 'border-danger-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a payee</option>
                    {mockPayees.map((payee) => (
                      <option key={payee} value={payee}>
                        {payee}
                      </option>
                    ))}
                  </select>
                  {errors.payee && (
                    <p className="mt-1 text-sm text-danger-600">{errors.payee}</p>
                  )}
                </div>
              )}

              {/* Days Ahead */}
              {selectedType.fields.includes('daysAhead') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days Ahead *
                  </label>
                  <input
                    type="number"
                    value={formData.daysAhead || ''}
                    onChange={(e) => handleInputChange('daysAhead', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.daysAhead ? 'border-danger-300' : 'border-gray-300'
                    }`}
                    min="1"
                    max="30"
                    placeholder="3"
                  />
                  {errors.daysAhead && (
                    <p className="mt-1 text-sm text-danger-600">{errors.daysAhead}</p>
                  )}
                </div>
              )}

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Frequency
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: 'immediate', label: 'Immediate', description: 'Notify instantly when triggered' },
                    { value: 'daily', label: 'Daily', description: 'Send once per day digest' },
                    { value: 'weekly', label: 'Weekly', description: 'Send weekly summary' },
                  ].map((freq) => (
                    <label key={freq.value} className="flex-1">
                      <input
                        type="radio"
                        name="frequency"
                        value={freq.value}
                        checked={formData.frequency === freq.value}
                        onChange={(e) => handleInputChange('frequency', e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.frequency === freq.value
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="text-sm font-medium text-gray-900">{freq.label}</div>
                        <div className="text-xs text-gray-600">{freq.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Add any additional notes about this alert..."
                />
              </div>

              {/* Enable/Disable Toggle */}
              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => handleInputChange('enabled', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer ${
                    formData.enabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}>
                    <div className={`h-5 w-5 bg-white rounded-full shadow transform transition-transform ${
                      formData.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}></div>
                  </div>
                </label>
                <span className="text-sm text-gray-700">
                  {formData.enabled ? 'Alert enabled' : 'Alert disabled'}
                </span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setSelectedType(null);
                setFormData({
                  type: '',
                  title: '',
                  threshold: 0,
                  frequency: 'immediate',
                  enabled: true,
                });
                setErrors({});
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Reset Form
            </button>
            
            <button
              type="submit"
              disabled={!selectedType || isSubmitting}
              className={`px-6 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                selectedType && !isSubmitting
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Alert...</span>
                </div>
              ) : (
                'Create Alert'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Quick Tips */}
      <div className="mt-6 bg-info-50 border border-info-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-info-900 mb-2">💡 Quick Tips</h4>
        <ul className="text-sm text-info-800 space-y-1">
          <li>• Set realistic thresholds to avoid alert fatigue</li>
          <li>• Use different frequencies for different alert types</li>
          <li>• You can modify or disable alerts anytime in Settings</li>
          <li>• Enable push notifications for immediate alerts</li>
        </ul>
      </div>
    </div>
  );
}