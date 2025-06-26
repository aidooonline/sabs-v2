'use client';

import React, { useState, useEffect } from 'react';
import type { ApprovalWorkflow } from '../../../../types/approval';

interface ConditionalApprovalProps {
  workflow: ApprovalWorkflow;
  conditions: string[];
  onConditionsChange: (conditions: string[]) => void;
  className?: string;
}

interface ConditionTemplate {
  id: string;
  title: string;
  description: string;
  template: string;
  category: 'verification' | 'documentation' | 'compliance' | 'timeline' | 'financial';
  riskLevel: 'low' | 'medium' | 'high';
  estimatedTime: string;
}

export const ConditionalApproval: React.FC<ConditionalApprovalProps> = ({
  workflow,
  conditions,
  onConditionsChange,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customCondition, setCustomCondition] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);

  // Predefined condition templates
  const conditionTemplates: ConditionTemplate[] = [
    {
      id: 'verify_id',
      title: 'Identity Verification',
      description: 'Additional identity verification required',
      template: 'Customer must provide additional identity verification (original ID + utility bill)',
      category: 'verification',
      riskLevel: 'medium',
      estimatedTime: '15-30 minutes'
    },
    {
      id: 'photo_verification',
      title: 'Photo Verification',
      description: 'Live photo verification with ID',
      template: 'Agent must capture live photo of customer holding ID document',
      category: 'verification',
      riskLevel: 'low',
      estimatedTime: '5-10 minutes'
    },
    {
      id: 'supervisor_presence',
      title: 'Supervisor Presence',
      description: 'Supervisor must be present during transaction',
      template: 'Transaction must be completed in presence of supervisor or senior agent',
      category: 'compliance',
      riskLevel: 'high',
      estimatedTime: '10-20 minutes'
    },
    {
      id: 'receipt_required',
      title: 'Original Receipt',
      description: 'Original deposit receipt must be provided',
      template: 'Customer must provide original deposit receipt for verification',
      category: 'documentation',
      riskLevel: 'medium',
      estimatedTime: '5-15 minutes'
    },
    {
      id: 'amount_limit',
      title: 'Amount Limitation',
      description: 'Limit withdrawal amount',
      template: 'Maximum withdrawal amount limited to GHS {amount}',
      category: 'financial',
      riskLevel: 'low',
      estimatedTime: 'Immediate'
    },
    {
      id: 'waiting_period',
      title: 'Waiting Period',
      description: 'Mandatory waiting period before payout',
      template: 'Minimum 24-hour waiting period before funds can be disbursed',
      category: 'timeline',
      riskLevel: 'medium',
      estimatedTime: '24 hours'
    },
    {
      id: 'multiple_verification',
      title: 'Multiple Verification Points',
      description: 'Verification at multiple touchpoints',
      template: 'Verification required at both agent location and customer bank branch',
      category: 'verification',
      riskLevel: 'high',
      estimatedTime: '30-60 minutes'
    },
    {
      id: 'transaction_history',
      title: 'Transaction History Review',
      description: 'Review customer transaction history',
      template: 'Agent must review and document last 30 days transaction history',
      category: 'compliance',
      riskLevel: 'medium',
      estimatedTime: '10-15 minutes'
    },
    {
      id: 'split_disbursement',
      title: 'Split Disbursement',
      description: 'Split withdrawal across multiple sessions',
      template: 'Withdrawal must be split into maximum GHS 2,000 per session over 3 days',
      category: 'financial',
      riskLevel: 'medium',
      estimatedTime: '3 days'
    },
    {
      id: 'witness_required',
      title: 'Witness Requirement',
      description: 'Independent witness must be present',
      template: 'Transaction requires presence of independent witness (not family member)',
      category: 'compliance',
      riskLevel: 'high',
      estimatedTime: '15-30 minutes'
    }
  ];

  const categories = [
    { value: 'all', label: 'All Categories', icon: '📋' },
    { value: 'verification', label: 'Verification', icon: '🔍' },
    { value: 'documentation', label: 'Documentation', icon: '📄' },
    { value: 'compliance', label: 'Compliance', icon: '⚖️' },
    { value: 'timeline', label: 'Timeline', icon: '⏰' },
    { value: 'financial', label: 'Financial', icon: '💰' }
  ];

  const filteredTemplates = conditionTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addConditionFromTemplate = (template: ConditionTemplate) => {
    let conditionText = template.template;
    
    // Handle template variables
    if (conditionText.includes('{amount}')) {
      const maxAmount = Math.floor(workflow.withdrawalRequest.amount * 0.5);
      conditionText = conditionText.replace('{amount}', maxAmount.toString());
    }
    
    if (!conditions.includes(conditionText)) {
      onConditionsChange([...conditions, conditionText]);
    }
  };

  const addCustomCondition = () => {
    if (customCondition.trim() && !conditions.includes(customCondition.trim())) {
      onConditionsChange([...conditions, customCondition.trim()]);
      setCustomCondition('');
    }
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    onConditionsChange(newConditions);
  };

  const editCondition = (index: number, newText: string) => {
    const newConditions = [...conditions];
    newConditions[index] = newText;
    onConditionsChange(newConditions);
  };

  const getRiskLevelColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstimatedTotalTime = () => {
    // This is a simplified calculation - in reality, you'd have more sophisticated logic
    return conditions.length > 0 ? `${conditions.length * 10}-${conditions.length * 20} minutes` : 'No additional time';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Conditional Approval Requirements</h3>
            <p className="text-sm text-gray-600 mt-1">
              Set specific conditions that must be met before final approval
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {conditions.length} condition{conditions.length !== 1 ? 's' : ''} set
            </span>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              {showTemplates ? 'Hide Templates' : 'Show Templates'}
            </button>
          </div>
        </div>

        {/* Current Conditions */}
        {conditions.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Current Conditions</h4>
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-start justify-between bg-primary-50 border border-primary-200 p-4 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-primary-900">
                        Condition {index + 1}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                        Required
                      </span>
                    </div>
                    <p className="text-sm text-primary-800">{condition}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        const newText = prompt('Edit condition:', condition);
                        if (newText && newText.trim()) {
                          editCondition(index, newText.trim());
                        }
                      }}
                      className="text-primary-600 hover:text-primary-800"
                      title="Edit condition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeCondition(index)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove condition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Conditions Summary */}
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  <strong>Estimated additional time:</strong> {getEstimatedTotalTime()}
                </span>
                <span className="text-gray-700">
                  <strong>Total conditions:</strong> {conditions.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Template Library */}
        {showTemplates && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Condition Templates</h4>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-3 py-2 text-xs font-medium rounded-full border transition-colors ${
                    selectedCategory === category.value
                      ? 'bg-primary-100 text-primary-800 border-primary-300'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category.icon} {category.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search condition templates..."
              />
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => addConditionFromTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-900">{template.title}</h5>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(template.riskLevel)}`}>
                      {template.riskLevel} risk
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                  <p className="text-sm text-gray-800 italic mb-3">&ldquo;{template.template}&rdquo;</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="capitalize">{template.category}</span>
                    <span>Est. {template.estimatedTime}</span>
                  </div>
                </div>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or category filter.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Custom Condition Input */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Add Custom Condition</h4>
          <div className="flex space-x-3">
            <input
              type="text"
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter custom approval condition..."
              onKeyPress={(e) => e.key === 'Enter' && addCustomCondition()}
            />
            <button
              onClick={addCustomCondition}
              disabled={!customCondition.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="text-sm font-medium text-blue-900 mb-2">💡 Conditional Approval Guidelines</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Conditions should be specific, measurable, and achievable</li>
            <li>• Consider the customer's ability to fulfill requirements</li>
            <li>• Balance security needs with customer convenience</li>
            <li>• Estimated times help set proper expectations</li>
            <li>• Each condition must be verified before final disbursement</li>
          </ul>
        </div>

        {/* Warning for High-Risk Conditions */}
        {conditions.length > 3 && (
          <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-warning-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h5 className="text-sm font-medium text-warning-900">Multiple Conditions Notice</h5>
                <p className="text-sm text-warning-800 mt-1">
                  This approval has {conditions.length} conditions. Consider if all are necessary to avoid customer burden.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};