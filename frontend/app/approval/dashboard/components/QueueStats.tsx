'use client';

import React from 'react';
import type { DashboardStatsResponse } from '../../../../types/approval';

interface QueueStatsProps {
  dashboardStats?: DashboardStatsResponse;
  queueMetrics?: {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    averageProcessingTime: number;
    slaCompliance: number;
    riskDistribution: Array<{ riskLevel: string; count: number }>;
  };
}

export const QueueStats: React.FC<QueueStatsProps> = ({ 
  dashboardStats, 
  queueMetrics 
}) => {
  const stats = [
    {
      name: 'Pending Approvals',
      value: queueMetrics?.totalPending || dashboardStats?.queueStats?.totalPending || 0,
      change: '+12%',
      changeType: 'increase' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-warning-600 bg-warning-50'
    },
    {
      name: 'Approved Today',
      value: dashboardStats?.performanceMetrics?.approvalsToday || 0,
      change: '+5.2%',
      changeType: 'increase' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-success-600 bg-success-50'
    },
    {
      name: 'Average Processing Time',
      value: `${Math.round((queueMetrics?.averageProcessingTime || dashboardStats?.queueStats?.averageProcessingTime || 0) / 60)}min`,
      change: '-8.1%',
      changeType: 'decrease' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-primary-600 bg-primary-50'
    },
    {
      name: 'SLA Compliance',
      value: `${Math.round((queueMetrics?.slaCompliance || dashboardStats?.queueStats?.slaCompliance || 0) * 100)}%`,
      change: '+2.1%',
      changeType: 'increase' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-info-600 bg-info-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
        >
          <dt>
            <div className={`absolute rounded-md p-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="ml-16 text-sm font-medium text-gray-500 truncate">
              {stat.name}
            </p>
          </dt>
          <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
            <p 
              className="text-2xl font-semibold text-gray-900"
              data-testid={index === 0 ? "total-pending-count" : undefined}
            >
              {stat.value}
            </p>
            <p
              className={`ml-2 flex items-baseline text-sm font-semibold ${
                stat.changeType === 'increase'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {stat.changeType === 'increase' ? (
                <svg
                  className="self-center flex-shrink-0 h-5 w-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="self-center flex-shrink-0 h-5 w-5 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="sr-only">
                {stat.changeType === 'increase' ? 'Increased' : 'Decreased'} by
              </span>
              {stat.change}
            </p>
            <div className="absolute bottom-0 inset-x-0 bg-gray-50 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <span className="text-gray-600">vs last week</span>
              </div>
            </div>
          </dd>
        </div>
      ))}
    </div>
  );
};