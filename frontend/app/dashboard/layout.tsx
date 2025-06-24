'use client';

import { withAuth } from '@/components/auth/withAuth';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';

function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardTemplate>
      {children}
    </DashboardTemplate>
  );
}

// Apply authentication guard to the entire dashboard layout
export default withAuth(DashboardLayout, {
  requiredRoles: [], // Any authenticated user can access dashboard
  redirectTo: '/login',
  requireEmailVerified: true,
});