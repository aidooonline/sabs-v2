'use client';

import React from 'react';
import type { AnalyticsTimeRange } from '../../../types/analytics';

interface PredictiveInsightsChartProps {
  data: any;
  type: 'churn' | 'clv' | 'upsell';
  timeRange: AnalyticsTimeRange;
}

export const PredictiveInsightsChart: React.FC<PredictiveInsightsChartProps> = ({
  data,
  type,
  timeRange,
}) => {
  const getChartTitle = () => {
    switch (type) {
      case 'churn':
        return 'Churn Prediction Model';
      case 'clv':
        return 'Customer Lifetime Value Prediction';
      case 'upsell':
        return 'Upsell Opportunity Analysis';
      default:
        return 'Predictive Insights';
    }
  };

  if (!data) {
    return (
      <div className="predictive-insights-chart">
        <div className="w-full h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <div className="text-gray-500">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="predictive-insights-chart">
      <div className="w-full h-64 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 font-medium mb-2">{getChartTitle()}</div>
          <div className="text-sm text-gray-500">
            Time Range: {timeRange} | Type: {type}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            AI-powered predictive model visualization goes here
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveInsightsChart;