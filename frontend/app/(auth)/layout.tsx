import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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