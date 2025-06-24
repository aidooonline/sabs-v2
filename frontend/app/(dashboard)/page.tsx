'use client';

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUI } from '../../hooks/useUI';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useUI();

  const handleTestNotification = () => {
    showNotification('success', 'Redux state management is working!', 5000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Dashboard - Sabs v2
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Authentication Status
          </h3>
          <p className="text-gray-600">
            Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              Welcome, {user.firstName} {user.lastName}
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Redux Integration
          </h3>
          <p className="text-gray-600 mb-4">
            State management is active and working.
          </p>
          <Button onClick={handleTestNotification} size="sm">
            Test Notification
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            System Status
          </h3>
          <p className="text-green-600">All systems operational</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Redux store initialized</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">UI state management active</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Auth slice configured</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Redux Slices</span>
              <span className="text-sm font-medium">2 Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Middleware</span>
              <span className="text-sm font-medium">3 Loaded</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Persistence</span>
              <span className="text-sm font-medium text-green-600">Enabled</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}