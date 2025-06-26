'use client';

import React from 'react';
import type { WorkflowComment, WorkflowPermissions } from '../../../../../types/approval';

interface WorkflowCommentsProps {
  workflowId: string;
  comments: WorkflowComment[];
  permissions?: WorkflowPermissions;
  onCommentAdded: () => void;
}

export const WorkflowComments: React.FC<WorkflowCommentsProps> = ({
  workflowId,
  comments,
  permissions,
  onCommentAdded
}) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Comments & Collaboration</h3>
          <p className="text-gray-600">
            Workflow comments and collaboration features will be implemented here
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Comments: {comments.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};