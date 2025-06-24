'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/atoms/Button';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Error Icon */}
        <div className="mx-auto h-24 w-24 text-red-500">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">
            You don&apos;t have permission to access this page.
          </p>
          {user && (
            <p className="mt-2 text-sm text-gray-500">
              Signed in as: {user.email} ({user.role})
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Link href="/dashboard">
            <Button variant="primary" fullWidth>
              Go to Dashboard
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            fullWidth 
            onClick={logout}
          >
            Sign out and try different account
          </Button>
        </div>

        {/* Contact Support */}
        <div className="text-sm text-gray-500">
          <p>
            If you believe this is an error, please{' '}
            <Link href="/help" className="text-indigo-600 hover:text-indigo-500">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}