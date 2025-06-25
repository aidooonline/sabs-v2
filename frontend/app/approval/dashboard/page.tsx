import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Approval Dashboard - Sabs v2',
  description: 'Withdrawal approval queue management and workflow processing',
};

export default function ApprovalDashboard() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Approval Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage withdrawal approval workflows and process pending requests
        </p>
      </div>
      
      {/* Placeholder for approval queue - to be implemented in Day 2 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
        <div className="text-center text-gray-500 py-8">
          <p>Approval queue components will be implemented here</p>
          <p className="text-sm mt-2">Day 2: AC1 - Pending Withdrawals Dashboard</p>
        </div>
      </div>
    </div>
  );
}