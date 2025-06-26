'use client';

import { ApprovalWorkflow } from '../../../../types/approval';

interface ReviewBreadcrumbProps {
  workflow: ApprovalWorkflow;
  onBack: () => void;
}

export const ReviewBreadcrumb = ({ workflow, onBack }: ReviewBreadcrumbProps) => {
  return (
    <nav className="flex py-3" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-4">
        <li>
          <div>
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </li>
        <li>
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Approval Dashboard
            </button>
          </div>
        </li>
        <li>
          <div className="flex items-center">
            <svg className="h-5 w-5 flex-shrink-0 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="ml-4 text-sm font-medium text-gray-900">
              Review Request #{workflow.id}
            </span>
          </div>
        </li>
      </ol>
    </nav>
  );
};