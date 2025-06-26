'use client';

import React from 'react';
import type { AnalyticsTimeRange } from '../../../types/analytics';

interface RetentionChartProps {
  data: any;
  timeRange: AnalyticsTimeRange;
}

export const RetentionChart: React.FC<RetentionChartProps> = ({
  data,
  timeRange,
}) => {
  if (!data) {
    return (
      <div className="retention-chart">
        <div className="w-full h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <div className="text-gray-500">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="retention-chart">
      <div className="w-full h-64 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 font-medium mb-2">Customer Retention Curves</div>
          <div className="text-sm text-gray-500">
            Time Range: {timeRange}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Retention rate visualization over time goes here
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetentionChart;