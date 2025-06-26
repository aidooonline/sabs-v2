'use client';

import React from 'react';
import type { AnalyticsTimeRange } from '../../types/analytics';

interface JourneyStage {
  id: string;
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface CustomerJourneyFlowProps {
  data: any;
  timeRange: AnalyticsTimeRange;
}

export const CustomerJourneyFlow: React.FC<CustomerJourneyFlowProps> = ({
  data,
  timeRange,
}) => {
  // Simulated journey data
  const journeyStages: JourneyStage[] = [
    { id: 'prospect', name: 'Prospect', count: 1250, percentage: 100, color: 'bg-gray-400' },
    { id: 'signup', name: 'Sign Up', count: 875, percentage: 70, color: 'bg-blue-400' },
    { id: 'verification', name: 'Verified', count: 700, percentage: 56, color: 'bg-green-400' },
    { id: 'first_transaction', name: 'First Transaction', count: 525, percentage: 42, color: 'bg-purple-400' },
    { id: 'active', name: 'Active User', count: 420, percentage: 34, color: 'bg-indigo-400' },
    { id: 'engaged', name: 'Engaged', count: 315, percentage: 25, color: 'bg-yellow-400' },
  ];

  if (!data) {
    return (
      <div className="customer-journey-flow">
        <div className="w-full h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <div className="text-gray-500">Loading journey flow...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-journey-flow p-4">
      <div className="space-y-4">
        {journeyStages.map((stage, index) => (
          <div key={stage.id} className="relative">
            {/* Stage Block */}
            <div className="flex items-center space-x-4">
              {/* Progress Bar */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                  <span className="text-xs text-gray-500">{stage.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                  <div
                    className={`h-full ${stage.color} transition-all duration-500 ease-out flex items-center justify-end px-2`}
                    style={{ width: `${stage.percentage}%` }}
                  >
                    <span className="text-xs font-medium text-white">
                      {stage.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversion Arrow */}
            {index < journeyStages.length - 1 && (
              <div className="flex items-center justify-center mt-2 mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-0.5 bg-gray-300"></div>
                  <div className="w-3 h-3 bg-gray-300 transform rotate-45 translate-x-1"></div>
                </div>
                <span className="text-xs text-gray-500 ml-3">
                  {index < journeyStages.length - 1 && (
                    `${(journeyStages[index + 1].percentage).toFixed(0)}% conversion`
                  )}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">70%</div>
            <div className="text-xs text-gray-500">Sign-up Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">42%</div>
            <div className="text-xs text-gray-500">Activation Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">25%</div>
            <div className="text-xs text-gray-500">Engagement Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerJourneyFlow;