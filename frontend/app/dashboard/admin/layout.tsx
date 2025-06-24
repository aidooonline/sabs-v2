'use client';

import { withAuth } from '@/components/auth/withAuth';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';

function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardTemplate title="Admin Panel">
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Administrator Area
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                You are accessing administrative functions. Please ensure you have proper authorization before making any changes.
              </p>
            </div>
          </div>
        </div>
      </div>
      {children}
    </DashboardTemplate>
  );
}

// Apply strict authentication guard for admin routes
export default withAuth(AdminLayout, {
  requiredRoles: ['super_admin', 'company_admin'],
  redirectTo: '/unauthorized',
  requireEmailVerified: true,
  showUnauthorized: true,
});