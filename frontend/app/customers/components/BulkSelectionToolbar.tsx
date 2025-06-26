'use client';

import React from 'react';
import { X, Download, Mail, UserPlus, FileText, Archive, AlertTriangle } from 'lucide-react';

interface BulkSelectionToolbarProps {
  selectedCount: number;
  selectedCustomers: string[];
  onClearSelection: () => void;
  onBulkAction: (action: string, customerIds: string[]) => void;
  isVisible: boolean;
}

export const BulkSelectionToolbar: React.FC<BulkSelectionToolbarProps> = ({
  selectedCount,
  selectedCustomers,
  onClearSelection,
  onBulkAction,
  isVisible,
}) => {
  if (!isVisible || selectedCount === 0) {
    return null;
  }

  const handleBulkAction = (action: string) => {
    onBulkAction(action, selectedCustomers);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-6 py-4 flex items-center space-x-4 min-w-max">
        {/* Selection count */}
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-semibold">{selectedCount}</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {selectedCount === 1 ? '1 customer selected' : `${selectedCount} customers selected`}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 pl-4 border-l border-gray-200">
          {/* Export selected */}
          <button
            onClick={() => handleBulkAction('export')}
            className="bulk-action-button hover:bg-blue-50 hover:text-blue-700"
            title="Export selected customers"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Export</span>
          </button>

          {/* Send email */}
          <button
            onClick={() => handleBulkAction('email')}
            className="bulk-action-button hover:bg-green-50 hover:text-green-700"
            title="Send email to selected customers"
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Email</span>
          </button>

          {/* Assign to group */}
          <button
            onClick={() => handleBulkAction('assign-group')}
            className="bulk-action-button hover:bg-purple-50 hover:text-purple-700"
            title="Assign to customer group"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Group</span>
          </button>

          {/* Generate report */}
          <button
            onClick={() => handleBulkAction('report')}
            className="bulk-action-button hover:bg-indigo-50 hover:text-indigo-700"
            title="Generate report for selected customers"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Report</span>
          </button>

          {/* Archive selected */}
          <button
            onClick={() => handleBulkAction('archive')}
            className="bulk-action-button hover:bg-orange-50 hover:text-orange-700"
            title="Archive selected customers"
          >
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Archive</span>
          </button>

          {/* Risk assessment */}
          <button
            onClick={() => handleBulkAction('risk-assessment')}
            className="bulk-action-button hover:bg-yellow-50 hover:text-yellow-700"
            title="Run risk assessment on selected customers"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Risk</span>
          </button>
        </div>

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="p-1 hover:bg-gray-100 rounded transition-colors ml-2"
          title="Clear selection"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

// Mobile-optimized bulk selection bar
export const MobileBulkSelectionBar: React.FC<BulkSelectionToolbarProps> = ({
  selectedCount,
  selectedCustomers,
  onClearSelection,
  onBulkAction,
  isVisible,
}) => {
  if (!isVisible || selectedCount === 0) {
    return null;
  }

  const handleBulkAction = (action: string) => {
    onBulkAction(action, selectedCustomers);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary-600 text-white px-4 py-3 animate-slide-down sm:hidden">
      <div className="flex items-center justify-between">
        {/* Selection info */}
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold">{selectedCount}</span>
          </div>
          <span className="text-sm font-medium">
            {selectedCount === 1 ? '1 selected' : `${selectedCount} selected`}
          </span>
        </div>

        {/* Primary actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleBulkAction('export')}
            className="p-2 hover:bg-white/10 rounded touch-target"
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleBulkAction('email')}
            className="p-2 hover:bg-white/10 rounded touch-target"
            title="Email"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={onClearSelection}
            className="p-2 hover:bg-white/10 rounded touch-target"
            title="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded actions (if needed) */}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={() => handleBulkAction('assign-group')}
          className="mobile-bulk-action-button"
        >
          Group
        </button>
        <button
          onClick={() => handleBulkAction('report')}
          className="mobile-bulk-action-button"
        >
          Report
        </button>
        <button
          onClick={() => handleBulkAction('archive')}
          className="mobile-bulk-action-button"
        >
          Archive
        </button>
        <button
          onClick={() => handleBulkAction('risk-assessment')}
          className="mobile-bulk-action-button"
        >
          Risk Check
        </button>
      </div>
    </div>
  );
};

// CSS for the bulk action components should be added to customer-ui.css
const bulkActionStyles = `
/* Bulk action button styles */
.bulk-action-button {
  @apply flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-150 border border-transparent;
  min-height: 40px;
}

.bulk-action-button:active {
  @apply scale-95;
  transition: all 0.1s ease-in-out;
}

.mobile-bulk-action-button {
  @apply px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/20 rounded text-white transition-colors duration-150;
  min-height: 32px;
}

/* Animations */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}

/* Desktop bulk toolbar positioning */
@media (min-width: 768px) {
  .bulk-selection-toolbar {
    @apply fixed bottom-6 left-1/2 transform -translate-x-1/2;
  }
}

/* Mobile bulk toolbar positioning */
@media (max-width: 767px) {
  .bulk-selection-toolbar {
    @apply fixed top-0 left-0 right-0;
  }
}
`;

export default BulkSelectionToolbar;