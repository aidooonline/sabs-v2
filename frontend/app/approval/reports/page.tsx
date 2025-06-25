import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Approval Reports - Sabs v2',
  description: 'Approval workflow analytics and performance reporting',
};

export default function ApprovalReports() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Approval Reports</h1>
        <p className="text-gray-600 mt-2">
          Analytics and performance reporting for approval workflows
        </p>
      </div>
      
      {/* Placeholder for reports - to be implemented in Day 7 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Dashboard</h2>
        <div className="text-center text-gray-500 py-8">
          <p>Reports and analytics components will be implemented here</p>
          <p className="text-sm mt-2">Day 7: AC6 - Reporting & Analytics</p>
        </div>
      </div>
    </div>
  );
}