'use client';

import { useAuth } from '@/hooks/useAuth';
import { 
  ShowForSuperAdmin, 
  ShowForAdmins, 
  PermissionGuard 
} from '@/components/auth/PermissionGuard';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';

export default function AdminPage() {
  const { user, getFullName } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administration Panel</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {getFullName()}. You are logged in as: <span className="font-medium">{user?.role}</span>
        </p>
      </div>

      {/* Admin Functions Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* User Management - Admins and above */}
        <ShowForAdmins>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    User Management
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Manage users and roles
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="primary" size="sm" fullWidth>
                Manage Users
              </Button>
            </div>
          </Card>
        </ShowForAdmins>

        {/* System Settings - Super Admin Only */}
        <ShowForSuperAdmin>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    System Settings
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Global configuration
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="danger" size="sm" fullWidth>
                System Config
              </Button>
            </div>
          </Card>
        </ShowForSuperAdmin>

        {/* Reports - All Admins */}
        <ShowForAdmins>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Reports & Analytics
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    View system reports
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="secondary" size="sm" fullWidth>
                View Reports
              </Button>
            </div>
          </Card>
        </ShowForAdmins>

        {/* Company Management - Company Admins */}
        <PermissionGuard 
          roles={['company_admin']} 
          fallback={
            <Card className="p-6 opacity-50">
              <div className="text-center text-gray-500">
                <p className="text-sm">Company Management</p>
                <p className="text-xs mt-1">Company Admin access required</p>
              </div>
            </Card>
          }
        >
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Company Management
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Manage company settings
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="primary" size="sm" fullWidth>
                Company Settings
              </Button>
            </div>
          </Card>
        </PermissionGuard>

        {/* Audit Logs - Super Admin Only */}
        <ShowForSuperAdmin>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Audit Logs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    System audit trails
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="secondary" size="sm" fullWidth>
                View Logs
              </Button>
            </div>
          </Card>
        </ShowForSuperAdmin>

        {/* Backup & Maintenance - Super Admin Only */}
        <ShowForSuperAdmin>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    System Maintenance
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Backup and maintenance
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="danger" size="sm" fullWidth>
                Maintenance
              </Button>
            </div>
          </Card>
        </ShowForSuperAdmin>
      </div>

      {/* Role Information */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Access Level</h3>
        <div className="bg-gray-50 rounded-md p-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{user?.role?.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Company</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.companyId || 'Global'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user?.isEmailVerified ? (
                  <span className="text-green-600">✓ Verified</span>
                ) : (
                  <span className="text-red-600">✗ Not Verified</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Account Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className="text-green-600 capitalize">{user?.status}</span>
              </dd>
            </div>
          </dl>
        </div>
      </Card>
    </div>
  );
}