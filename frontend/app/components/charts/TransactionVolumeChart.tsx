'use client';

import React from 'react';
import type { TransactionVolumeData, AnalyticsTimeRange } from '../../../types/analytics';

interface TransactionVolumeChartProps {
  data: TransactionVolumeData | undefined;
  timeRange: AnalyticsTimeRange;
}

export const TransactionVolumeChart: React.FC<TransactionVolumeChartProps> = ({
  data,
  timeRange,
}) => {
  if (!data) {
    return (
      <div className="transaction-volume-chart">
        <div className="w-full h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <div className="text-gray-500">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-volume-chart">
      <div className="w-full h-64 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 font-medium mb-2">Transaction Volume Chart</div>
          <div className="text-sm text-gray-500">
            Time Range: {timeRange} | Data Points: {data.dates?.length || 0}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Chart.js implementation goes here
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionVolumeChart;