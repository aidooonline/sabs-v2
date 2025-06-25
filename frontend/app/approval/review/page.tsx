import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Review Requests - Sabs v2',
  description: 'Review withdrawal requests and customer verification',
};

export default function ReviewRequests() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Review Requests</h1>
        <p className="text-gray-600 mt-2">
          Review withdrawal requests and verify customer information
        </p>
      </div>
      
      {/* Placeholder for review interface - to be implemented in Day 3 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Request Review Interface</h2>
        <div className="text-center text-gray-500 py-8">
          <p>Request review components will be implemented here</p>
          <p className="text-sm mt-2">Day 3: AC2 - Withdrawal Request Review Interface</p>
        </div>
      </div>
    </div>
  );
}