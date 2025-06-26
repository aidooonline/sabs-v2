'use client';

import { ApprovalWorkflow } from '../../../../types/approval';

interface SupportingDocumentsViewerProps {
  documents: any[];
  workflow: ApprovalWorkflow;
  selectedDocument: string | null;
  onDocumentSelect: (documentId: string | null) => void;
  isLoading: boolean;
}

export const SupportingDocumentsViewer = ({ 
  documents, 
  workflow, 
  selectedDocument, 
  onDocumentSelect, 
  isLoading 
}: SupportingDocumentsViewerProps) => {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const workflowDocuments = workflow.withdrawalRequest?.documents || documents;

  return (
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-4">Supporting Documents</h4>
      
      {workflowDocuments && workflowDocuments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflowDocuments.map((document, index) => (
            <div 
              key={document.id || index} 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedDocument === document.id 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onDocumentSelect(
                selectedDocument === document.id ? null : document.id
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {document.type?.includes('image') || document.fileType?.includes('image') ? (
                    <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {document.filename || `Document ${index + 1}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {document.type || document.fileType || 'Unknown type'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              
              {document.verificationStatus && (
                <div className="mt-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    document.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                    document.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {document.verificationStatus}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="mt-2">No supporting documents available</p>
        </div>
      )}

      {/* Document Preview */}
      {selectedDocument && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <h5 className="text-md font-medium text-gray-900 mb-2">Document Preview</h5>
          <p className="text-sm text-gray-600">
            Document preview functionality will be implemented with proper file viewing capabilities.
          </p>
          <button 
            onClick={() => onDocumentSelect(null)}
            className="mt-2 text-sm text-primary-600 hover:text-primary-800"
          >
            Close Preview
          </button>
        </div>
      )}
    </div>
  );
};