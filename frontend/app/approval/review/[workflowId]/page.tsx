import { Metadata } from 'next';

interface ReviewWorkflowProps {
  params: {
    workflowId: string;
  };
}

export const metadata: Metadata = {
  title: 'Review Workflow - Sabs v2',
  description: 'Review individual withdrawal workflow request',
};

export default function ReviewWorkflow({ params }: ReviewWorkflowProps) {
  const { workflowId } = params;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Review Workflow</h1>
        <p className="text-gray-600 mt-2">
          Workflow ID: <span className="font-mono">{workflowId}</span>
        </p>
      </div>
      
      {/* Placeholder for workflow review - to be implemented in Day 3 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Workflow Details</h2>
        <div className="text-center text-gray-500 py-8">
          <p>Comprehensive workflow review interface will be implemented here</p>
          <p className="text-sm mt-2">Day 3: AC2 - Withdrawal Request Review Interface</p>
        </div>
      </div>
    </div>
  );
}