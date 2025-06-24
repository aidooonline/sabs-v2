'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    // Redirect authenticated users away from auth pages
    if (isInitialized && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Don't render auth pages if user is already authenticated
  if (isInitialized && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Optional: Add auth-specific header or branding */}
      <div className="absolute top-4 left-4">
        <h1 className="text-2xl font-bold text-primary-600">Sabs v2</h1>
      </div>
      
      {/* Main auth content */}
      {children}
      
      {/* Optional: Add footer */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <p className="text-sm text-gray-500">
          © 2024 Sabs v2. All rights reserved.
        </p>
      </div>
    </div>
  );
}