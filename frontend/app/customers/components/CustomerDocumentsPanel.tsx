'use client';

import React from 'react';
import type { CustomerDocument } from '../../../types/customer';

interface CustomerDocumentsPanelProps {
  customerId: string;
  documents: CustomerDocument[];
  editMode: boolean;
}

export const CustomerDocumentsPanel: React.FC<CustomerDocumentsPanelProps> = ({
  customerId,
  documents,
  editMode,
}) => {
  return (
    <div className="customer-documents-panel p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
      <div className="text-center py-8">
        <div className="text-gray-500">Customer documents will be displayed here</div>
        <div className="text-sm text-gray-400 mt-2">
          Customer ID: {customerId} | Edit Mode: {editMode ? 'On' : 'Off'}
        </div>
        <div className="text-sm text-gray-400">Documents: {documents.length}</div>
      </div>
    </div>
  );
};