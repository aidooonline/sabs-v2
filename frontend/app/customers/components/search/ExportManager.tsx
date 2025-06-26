'use client';

import React, { useState } from 'react';
import type { Customer, CustomerFilters, CustomerExportOptions } from '../../../../types/customer';
import { useExportCustomersMutation } from '../../../../store/api/customerApi';
import { Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface ExportManagerProps {
  customers: Customer[];
  filters?: CustomerFilters;
  searchQuery?: string;
  selectedCustomers: string[];
}

export const ExportManager: React.FC<ExportManagerProps> = ({
  customers,
  filters,
  searchQuery,
  selectedCustomers,
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState<CustomerExportOptions>({
    format: 'csv',
    fields: ['firstName', 'lastName', 'phone', 'email', 'accountBalance', 'status'],
    filters,
    includeTransactions: false,
  });

  const [exportCustomers, { isLoading, error, data }] = useExportCustomersMutation();

  const availableFields = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'email', label: 'Email Address' },
    { key: 'accountBalance', label: 'Account Balance' },
    { key: 'status', label: 'Customer Status' },
    { key: 'verificationStatus', label: 'Verification Status' },
    { key: 'createdAt', label: 'Registration Date' },
    { key: 'lastTransactionAt', label: 'Last Activity' },
    { key: 'idNumber', label: 'ID Number' },
    { key: 'address', label: 'Address' },
  ];

  const handleExport = async () => {
    try {
      const exportData: CustomerExportOptions = {
        ...exportOptions,
        filters: selectedCustomers.length > 0 ? { ...filters } : filters,
      };

      await exportCustomers(exportData).unwrap();
      setShowExportModal(false);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const toggleField = (field: string) => {
    setExportOptions(prev => ({
      ...prev,
      fields: prev.fields.includes(field)
        ? prev.fields.filter(f => f !== field)
        : [...prev.fields, field],
    }));
  };

  const getExportButtonText = () => {
    if (selectedCustomers.length > 0) {
      return `Export ${selectedCustomers.length} Selected`;
    }
    return `Export ${customers.length} Customers`;
  };

  const getExportDescription = () => {
    if (selectedCustomers.length > 0) {
      return `Export ${selectedCustomers.length} selected customers`;
    }
    if (searchQuery || (filters && Object.keys(filters).length > 0)) {
      return `Export ${customers.length} filtered customers`;
    }
    return `Export all ${customers.length} customers`;
  };

  return (
    <>
      {/* Export trigger button */}
      <button
        onClick={() => setShowExportModal(true)}
        className="customer-action-button flex items-center space-x-2"
        disabled={customers.length === 0}
      >
        <Download className="w-4 h-4" />
        <span>{getExportButtonText()}</span>
      </button>

      {/* Export modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Export Customers</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {getExportDescription()}
              </p>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Format selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['csv', 'excel', 'pdf'] as const).map(format => (
                    <button
                      key={format}
                      onClick={() => setExportOptions(prev => ({ ...prev, format }))}
                      className={`p-3 text-sm border rounded-lg transition-colors ${
                        exportOptions.format === format
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <FileText className="w-4 h-4" />
                        <span className="uppercase">{format}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Field selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fields to Export
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableFields.map(field => (
                    <label key={field.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.fields.includes(field.key)}
                        onChange={() => toggleField(field.key)}
                        className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{field.label}</span>
                    </label>
                  ))}
                </div>
                
                <div className="mt-2 flex items-center space-x-2">
                  <button
                    onClick={() => setExportOptions(prev => ({ 
                      ...prev, 
                      fields: availableFields.map(f => f.key) 
                    }))}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => setExportOptions(prev => ({ ...prev, fields: [] }))}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Additional options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Options
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeTransactions}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        includeTransactions: e.target.checked 
                      }))}
                      className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Include transaction history</span>
                  </label>
                </div>
              </div>

              {/* Export summary */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Export Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Records: {selectedCustomers.length > 0 ? selectedCustomers.length : customers.length}</div>
                  <div>Format: {exportOptions.format.toUpperCase()}</div>
                  <div>Fields: {exportOptions.fields.length} selected</div>
                  {exportOptions.includeTransactions && (
                    <div>Including transaction history</div>
                  )}
                </div>
              </div>

              {/* Error display */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Export failed. Please try again.</span>
                </div>
              )}

              {/* Success display */}
              {data && (
                <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  <div className="flex-1">
                    <span className="text-sm">Export ready for download</span>
                    <a
                      href={data.downloadUrl}
                      download={data.fileName}
                      className="block text-sm text-primary-600 hover:text-primary-700 mt-1"
                    >
                      Download {data.fileName}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="customer-action-button"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isLoading || exportOptions.fields.length === 0}
                className="customer-action-button primary"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Exporting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Quick export button for common formats
 */
interface QuickExportProps {
  customers: Customer[];
  selectedCustomers: string[];
  format: 'csv' | 'excel' | 'pdf';
  className?: string;
}

export const QuickExport: React.FC<QuickExportProps> = ({
  customers,
  selectedCustomers,
  format,
  className = "",
}) => {
  const [exportCustomers, { isLoading }] = useExportCustomersMutation();

  const handleQuickExport = async () => {
    try {
      const exportData: CustomerExportOptions = {
        format,
        fields: ['firstName', 'lastName', 'phone', 'email', 'accountBalance', 'status'],
        filters: selectedCustomers.length > 0 ? {} : undefined,
        includeTransactions: false,
      };

      await exportCustomers(exportData).unwrap();
    } catch (err) {
      console.error('Quick export failed:', err);
    }
  };

  return (
    <button
      onClick={handleQuickExport}
      disabled={isLoading || customers.length === 0}
      className={`flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50 ${className}`}
    >
      <Download className="w-3 h-3" />
      <span>{format.toUpperCase()}</span>
      {isLoading && <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>}
    </button>
  );
};