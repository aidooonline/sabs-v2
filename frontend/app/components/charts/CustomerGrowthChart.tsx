'use client';

import React from 'react';
import type { CustomerGrowthData, AnalyticsTimeRange } from '../../../types/analytics';

interface CustomerGrowthChartProps {
  data: CustomerGrowthData | undefined;
  timeRange: AnalyticsTimeRange;
}

export const CustomerGrowthChart: React.FC<CustomerGrowthChartProps> = ({
  data,
  timeRange,
}) => {
  // Loading state
  if (!data) {
    return (
      <div className="customer-growth-chart">
        <div className="w-full h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <div className="text-gray-500">Loading chart...</div>
        </div>
      </div>
    );
  }

  // Chart placeholder - in a real implementation, this would use Chart.js, D3.js, or similar
  return (
    <div className="customer-growth-chart">
      <div className="w-full h-64 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 font-medium mb-2">Customer Growth Chart</div>
          <div className="text-sm text-gray-500">
            Time Range: {timeRange} | Data Points: {data.dates?.length || 0}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Chart implementation with Chart.js/D3.js goes here
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerGrowthChart;