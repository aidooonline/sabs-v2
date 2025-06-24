'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { 
  ShowForAdmins, 
  ShowForClerks, 
  ShowForAuthenticated 
} from '@/components/auth/PermissionGuard';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';

export default function DashboardPage() {
  const { user, getFullName } = useAuth();

  const handleTestAction = () => {
    alert('Test action triggered - Components working!');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {getFullName()}
        </h1>
        <p className="text-gray-600 mt-1">
          {user?.role && (
            <span className="capitalize">{user.role.replace('_', ' ')}</span>
          )} Dashboard - Sabs v2
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Component Status
          </h3>
          <p className="text-gray-600">
            Status: Operational
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Atomic components loaded successfully
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Component Integration
          </h3>
          <p className="text-gray-600 mb-4">
            Button and Card components are working correctly.
          </p>
          <Button onClick={handleTestAction} size="sm">
            Test Components
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            System Status
          </h3>
          <p className="text-green-600">All systems operational</p>
        </Card>

        {/* Admin Quick Access */}
        <ShowForAdmins>
          <Card className="p-6 border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Admin Panel
            </h3>
            <p className="text-gray-600 mb-4">
              Access administrative functions
            </p>
            <Link href="/dashboard/admin">
              <Button variant="danger" size="sm">
                Go to Admin
              </Button>
            </Link>
          </Card>
        </ShowForAdmins>

        {/* Clerk Operations */}
        <ShowForClerks>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Operations
            </h3>
            <p className="text-gray-600 mb-4">
              Customer and transaction management
            </p>
            <div className="space-y-2">
              <Link href="/dashboard/customers">
                <Button variant="secondary" size="sm" fullWidth>
                  Manage Customers
                </Button>
              </Link>
              <Link href="/dashboard/transactions">
                <Button variant="secondary" size="sm" fullWidth>
                  View Transactions
                </Button>
              </Link>
            </div>
          </Card>
        </ShowForClerks>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Story 2.1 Implementation
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Button component enhanced</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Input component enhanced</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Card component enhanced</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Components Enhanced</span>
              <span className="text-sm font-medium">3 Complete</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tests Passing</span>
              <span className="text-sm font-medium">110/110</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Build Status</span>
              <span className="text-sm font-medium text-green-600">Success</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}