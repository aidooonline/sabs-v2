'use client';

import React, { useState } from 'react';
import { 
  Download,
  FileText,
  Sheet,
  Database,
  Settings,
  Eye,
  Mail,
  Share2,
  Loader,
  CheckCircle,
  X
} from 'lucide-react';
import type { ReportExport } from '../../types/reports';

interface ReportExportEngineProps {
  reportId: string;
  reportName: string;
  onExport: (config: ReportExport) => Promise<void>;
  isExporting?: boolean;
  onClose?: () => void;
}

export function ReportExportEngine({ 
  reportId, 
  reportName, 
  onExport, 
  isExporting = false,
  onClose 
}: ReportExportEngineProps) {
  const [exportConfig, setExportConfig] = useState<ReportExport>({
    reportId,
    format: 'pdf',
    options: {
      includeCharts: true,
      includeSummary: true,
      pageSize: 'A4',
      orientation: 'portrait'
    }
  });

  const [exportStep, setExportStep] = useState<'config' | 'exporting' | 'success' | 'error'>('config');
  const [exportError, setExportError] = useState<string>('');

  const formatOptions = [
    {
      value: 'pdf',
      label: 'PDF Document',
      description: 'Professional formatted document with charts and formatting',
      icon: FileText,
      color: 'red',
      features: ['Charts', 'Formatting', 'Professional Layout']
    },
    {
      value: 'excel',
      label: 'Excel Spreadsheet',
      description: 'Data in spreadsheet format for analysis and manipulation',
      icon: Sheet,
      color: 'green',
      features: ['Raw Data', 'Calculations', 'Charts']
    },
    {
      value: 'csv',
      label: 'CSV File',
      description: 'Simple comma-separated values for data processing',
      icon: Database,
      color: 'blue',
      features: ['Raw Data', 'Lightweight', 'Universal']
    },
    {
      value: 'json',
      label: 'JSON Data',
      description: 'Structured data format for API integration',
      icon: Database,
      color: 'purple',
      features: ['Structured', 'API Ready', 'Programmatic']
    }
  ];

  const handleExport = async () => {
    setExportStep('exporting');
    setExportError('');

    try {
      await onExport(exportConfig);
      setExportStep('success');
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
      setExportStep('error');
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    setExportConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleOptionsChange = (key: string, value: any) => {
    setExportConfig(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [key]: value
      }
    }));
  };

  const resetExport = () => {
    setExportStep('config');
    setExportError('');
  };

  if (exportStep === 'exporting') {
    return (
      <div className="report-export-engine bg-white p-8 text-center">
        <div className="mb-6">
          <Loader className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Exporting Report</h3>
          <p className="text-gray-600">
            Generating {exportConfig.format.toUpperCase()} export for "{reportName}"...
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    );
  }

  if (exportStep === 'success') {
    return (
      <div className="report-export-engine bg-white p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Complete</h3>
        <p className="text-gray-600 mb-6">
          Your {exportConfig.format.toUpperCase()} export has been generated successfully.
        </p>
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={resetExport}
            className="btn-secondary"
          >
            Export Another
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (exportStep === 'error') {
    return (
      <div className="report-export-engine bg-white p-8 text-center">
        <X className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Failed</h3>
        <p className="text-gray-600 mb-6">{exportError}</p>
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={resetExport}
            className="btn-secondary"
          >
            Try Again
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="report-export-engine bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Export Report</h3>
          <p className="text-sm text-gray-600">"{reportName}"</p>
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
        {/* Format Selection */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">1. Choose Export Format</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formatOptions.map((format) => {
              const Icon = format.icon;
              return (
                <div
                  key={format.value}
                  onClick={() => handleConfigChange('format', format.value)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    exportConfig.format === format.value
                      ? `border-${format.color}-500 bg-${format.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${format.color}-100`}>
                      <Icon className={`w-5 h-5 text-${format.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-gray-900">{format.label}</h5>
                      <p className="text-xs text-gray-500 mt-1 mb-2">{format.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {format.features.map((feature) => (
                          <span
                            key={feature}
                            className={`px-2 py-1 text-xs rounded-full bg-${format.color}-100 text-${format.color}-700`}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">2. Configure Options</h4>
          <div className="space-y-4">
            {/* Content Options */}
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-3">Content Options</h5>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportConfig.options.includeCharts}
                    onChange={(e) => handleOptionsChange('includeCharts', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    disabled={exportConfig.format === 'csv' || exportConfig.format === 'json'}
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Charts and Visualizations</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportConfig.options.includeSummary}
                    onChange={(e) => handleOptionsChange('includeSummary', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    disabled={exportConfig.format === 'csv' || exportConfig.format === 'json'}
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Executive Summary</span>
                </label>
              </div>
            </div>

            {/* PDF Specific Options */}
            {exportConfig.format === 'pdf' && (
              <div>
                <h5 className="text-xs font-medium text-gray-700 mb-3">PDF Options</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Page Size
                    </label>
                    <select
                      value={exportConfig.options.pageSize}
                      onChange={(e) => handleOptionsChange('pageSize', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="A4">A4 (210 x 297 mm)</option>
                      <option value="Letter">Letter (8.5 x 11 in)</option>
                      <option value="Legal">Legal (8.5 x 14 in)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Orientation
                    </label>
                    <select
                      value={exportConfig.options.orientation}
                      onChange={(e) => handleOptionsChange('orientation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Preview */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">3. Export Summary</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Format:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formatOptions.find(f => f.value === exportConfig.format)?.label}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Report:</span>
                <span className="ml-2 font-medium text-gray-900">{reportName}</span>
              </div>
              {exportConfig.format === 'pdf' && (
                <>
                  <div>
                    <span className="text-gray-500">Page Size:</span>
                    <span className="ml-2 font-medium text-gray-900">{exportConfig.options.pageSize}</span>
                  </div>
                  <div>
                                         <span className="text-gray-500">Orientation:</span>
                     <span className="ml-2 font-medium text-gray-900">
                       {exportConfig.options.orientation ? 
                         exportConfig.options.orientation.charAt(0).toUpperCase() + exportConfig.options.orientation.slice(1) :
                         'Portrait'
                       }
                     </span>
                  </div>
                </>
              )}
              <div>
                <span className="text-gray-500">Charts:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {exportConfig.options.includeCharts ? 'Included' : 'Excluded'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Summary:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {exportConfig.options.includeSummary ? 'Included' : 'Excluded'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="btn-secondary"
              disabled={isExporting}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={isExporting}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {onClose && (
              <button
                onClick={onClose}
                className="btn-secondary"
                disabled={isExporting}
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="btn-primary"
            >
              {isExporting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}