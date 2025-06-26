'use client';

import React from 'react';
import { formatNumber, formatPercentage } from '../../utils/formatters';

interface LifecycleStage {
  name: string;
  count: number;
  percentage: number;
  color: string;
  description: string;
}

interface LifecycleStageBreakdownProps {
  data: any;
  total: number;
}

export const LifecycleStageBreakdown: React.FC<LifecycleStageBreakdownProps> = ({
  data,
  total,
}) => {
  // Calculate lifecycle stages from data or use defaults
  const lifecycleStages: LifecycleStage[] = [
    {
      name: 'Onboarding',
      count: data?.onboarding || 145,
      percentage: ((data?.onboarding || 145) / total) * 100,
      color: 'bg-blue-500',
      description: 'New customers completing registration'
    },
    {
      name: 'Active',
      count: data?.active || 1250,
      percentage: ((data?.active || 1250) / total) * 100,
      color: 'bg-green-500',
      description: 'Regular transaction activity'
    },
    {
      name: 'Engaged',
      count: data?.engaged || 890,
      percentage: ((data?.engaged || 890) / total) * 100,
      color: 'bg-purple-500',
      description: 'High value, loyal customers'
    },
    {
      name: 'At Risk',
      count: data?.atRisk || 325,
      percentage: ((data?.atRisk || 325) / total) * 100,
      color: 'bg-yellow-500',
      description: 'Declining activity patterns'
    },
    {
      name: 'Churned',
      count: data?.churned || 180,
      percentage: ((data?.churned || 180) / total) * 100,
      color: 'bg-red-500',
      description: 'Inactive for 90+ days'
    },
  ];

  if (!data && total === 0) {
    return (
      <div className="lifecycle-stage-breakdown">
        <div className="w-full h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <div className="text-gray-500">Loading breakdown...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="lifecycle-stage-breakdown p-4">
      {/* Donut Chart Simulation */}
      <div className="relative w-48 h-48 mx-auto mb-6">
        <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{formatNumber(total)}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>

        {/* Stage Indicators */}
        {lifecycleStages.map((stage, index) => {
          const angle = (index / lifecycleStages.length) * 360;
          const radius = 85;
          const x = Math.cos((angle - 90) * (Math.PI / 180)) * radius;
          const y = Math.sin((angle - 90) * (Math.PI / 180)) * radius;
          
          return (
            <div
              key={stage.name}
              className="absolute w-4 h-4 rounded-full transform -translate-x-2 -translate-y-2"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                backgroundColor: stage.color.replace('bg-', '').includes('blue') ? '#3B82F6' :
                                stage.color.replace('bg-', '').includes('green') ? '#10B981' :
                                stage.color.replace('bg-', '').includes('purple') ? '#8B5CF6' :
                                stage.color.replace('bg-', '').includes('yellow') ? '#F59E0B' :
                                stage.color.replace('bg-', '').includes('red') ? '#EF4444' : '#6B7280'
              }}
            />
          );
        })}
      </div>

      {/* Stage Legend */}
      <div className="space-y-3">
        {lifecycleStages.map((stage) => (
          <div key={stage.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${stage.color}`}></div>
              <div>
                <div className="text-sm font-medium text-gray-900">{stage.name}</div>
                <div className="text-xs text-gray-500">{stage.description}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900">{formatNumber(stage.count)}</div>
              <div className="text-xs text-gray-500">{formatPercentage(stage.percentage)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">
              {formatPercentage(lifecycleStages.slice(0, 3).reduce((sum, stage) => sum + stage.percentage, 0))}
            </div>
            <div className="text-xs text-gray-500">Healthy Customers</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">
              {formatPercentage(lifecycleStages.slice(3).reduce((sum, stage) => sum + stage.percentage, 0))}
            </div>
            <div className="text-xs text-gray-500">At Risk + Churned</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifecycleStageBreakdown;