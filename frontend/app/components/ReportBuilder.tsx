'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings,
  FileText,
  Calendar,
  Filter,
  Download,
  Eye,
  Play,
  Save,
  X,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  BarChart3,
  PieChart,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import type { ReportBuilderState, ReportField, ReportConfig } from '../../types/reports';

interface ReportBuilderProps {
  onGenerate: (type: string, config: any) => void;
  isGenerating: boolean;
  onClose?: () => void;
}

export function ReportBuilder({ onGenerate, isGenerating, onClose }: ReportBuilderProps) {
  const [state, setState] = useState<ReportBuilderState>({
    selectedType: '',
    config: {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      filters: {},
      format: 'pdf',
      includeCharts: true,
      includeSummary: true,
      sections: []
    },
    fields: {},
    isValid: false,
    errors: {}
  });

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    filters: false,
    formatting: false,
    advanced: false
  });

  const reportTypes = [
    {
      id: 'customer_analytics',
      name: 'Customer Analytics Report',
      description: 'Comprehensive customer behavior and lifecycle analysis',
      icon: Users,
      color: 'blue',
      fields: [
        { name: 'includeSegmentation', label: 'Include Customer Segmentation', type: 'boolean' },
        { name: 'includeLifecycleStages', label: 'Include Lifecycle Stages', type: 'boolean' },
        { name: 'customerGroups', label: 'Customer Groups', type: 'select', options: ['All', 'Active', 'Inactive', 'VIP'] }
      ]
    },
    {
      id: 'transaction_summary',
      name: 'Transaction Summary Report',
      description: 'Daily, weekly, and monthly transaction summaries',
      icon: BarChart3,
      color: 'green',
      fields: [
        { name: 'aggregationLevel', label: 'Aggregation Level', type: 'select', options: ['Daily', 'Weekly', 'Monthly'] },
        { name: 'includeVolume', label: 'Include Volume Analysis', type: 'boolean' },
        { name: 'includePerformance', label: 'Include Performance Metrics', type: 'boolean' }
      ]
    },
    {
      id: 'financial_performance',
      name: 'Financial Performance Report',
      description: 'Revenue, profit, and financial KPI analysis',
      icon: TrendingUp,
      color: 'purple',
      fields: [
        { name: 'includeRevenue', label: 'Include Revenue Analysis', type: 'boolean' },
        { name: 'includeProfit', label: 'Include Profit Analysis', type: 'boolean' },
        { name: 'includeForecasting', label: 'Include Forecasting', type: 'boolean' }
      ]
    },
    {
      id: 'compliance_report',
      name: 'Compliance Report',
      description: 'Regulatory compliance and audit trail report',
      icon: FileText,
      color: 'orange',
      fields: [
        { name: 'complianceType', label: 'Compliance Type', type: 'select', options: ['AML', 'KYC', 'PCI DSS', 'GDPR'] },
        { name: 'includeAuditTrail', label: 'Include Audit Trail', type: 'boolean' },
        { name: 'includeViolations', label: 'Include Violations', type: 'boolean' }
      ]
    },
    {
      id: 'risk_assessment',
      name: 'Risk Assessment Report',
      description: 'Customer risk scoring and fraud detection analysis',
      icon: AlertTriangle,
      color: 'red',
      fields: [
        { name: 'riskLevel', label: 'Risk Level', type: 'select', options: ['All', 'Low', 'Medium', 'High', 'Critical'] },
        { name: 'includeFraudMetrics', label: 'Include Fraud Metrics', type: 'boolean' },
        { name: 'includeScoring', label: 'Include Risk Scoring', type: 'boolean' }
      ]
    }
  ];

  const selectedReportType = reportTypes.find(type => type.id === state.selectedType);

  const handleTypeSelect = (typeId: string) => {
    setState(prev => ({
      ...prev,
      selectedType: typeId,
      fields: {},
      errors: {}
    }));
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: value
      }
    }));
  };

  const handleConfigChange = (key: string, value: any) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!state.selectedType) {
      errors.type = 'Please select a report type';
    }

    if (!state.config.dateRange?.start || !state.config.dateRange?.end) {
      errors.dateRange = 'Please specify date range';
    }

    if (state.config.dateRange?.start && state.config.dateRange?.end) {
      if (new Date(state.config.dateRange.start) > new Date(state.config.dateRange.end)) {
        errors.dateRange = 'Start date must be before end date';
      }
    }

    setState(prev => ({
      ...prev,
      errors,
      isValid: Object.keys(errors).length === 0
    }));

    return Object.keys(errors).length === 0;
  };

  const handleGenerate = () => {
    if (!validateForm()) return;

    const config = {
      ...state.config,
      fields: state.fields,
      type: state.selectedType
    };

    onGenerate(state.selectedType, config);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    validateForm();
  }, [state.selectedType, state.config, state.fields]);

  return (
    <div className="report-builder bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Report Builder</h3>
          <p className="text-sm text-gray-600">Create custom reports with advanced configuration</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Report Type Selection */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">1. Select Report Type</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    state.selectedType === type.id
                      ? `border-${type.color}-500 bg-${type.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${type.color}-100`}>
                      <Icon className={`w-5 h-5 text-${type.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-gray-900">{type.name}</h5>
                      <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {state.errors.type && (
            <p className="text-sm text-red-600">{state.errors.type}</p>
          )}
        </div>

        {/* Basic Configuration */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('basic')}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <h4 className="text-sm font-medium text-gray-900">2. Basic Configuration</h4>
            {expandedSections.basic ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.basic && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={state.config.dateRange?.start || ''}
                    onChange={(e) => handleConfigChange('dateRange', {
                      ...state.config.dateRange,
                      start: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={state.config.dateRange?.end || ''}
                    onChange={(e) => handleConfigChange('dateRange', {
                      ...state.config.dateRange,
                      end: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              {state.errors.dateRange && (
                <p className="text-sm text-red-600">{state.errors.dateRange}</p>
              )}

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Output Format
                </label>
                <select
                  value={state.config.format || 'pdf'}
                  onChange={(e) => handleConfigChange('format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="excel">Excel Spreadsheet</option>
                  <option value="csv">CSV File</option>
                  <option value="json">JSON Data</option>
                </select>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={state.config.includeCharts || false}
                    onChange={(e) => handleConfigChange('includeCharts', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Charts and Visualizations</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={state.config.includeSummary || false}
                    onChange={(e) => handleConfigChange('includeSummary', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Executive Summary</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Type-Specific Fields */}
        {selectedReportType && selectedReportType.fields.length > 0 && (
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('filters')}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <h4 className="text-sm font-medium text-gray-900">3. Report Options</h4>
              {expandedSections.filters ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedSections.filters && (
              <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                {selectedReportType.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    
                    {field.type === 'boolean' ? (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={state.fields[field.name] || false}
                          onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Enable {field.label}</span>
                      </label>
                    ) : field.type === 'select' && field.options ? (
                      <select
                        value={state.fields[field.name] || field.options[0]}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {field.options.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={state.fields[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="btn-secondary"
              disabled={!state.isValid}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={!state.isValid}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </button>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!state.isValid || isGenerating}
            className="btn-primary"
          >
            {isGenerating ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}