'use client';

import React from 'react';
import type { AnalyticsTimeRange } from '../../../types/analytics';

interface CohortAnalysisChartProps {
  data: any;
  timeRange: AnalyticsTimeRange;
  onCohortSelect?: (cohort: string) => void;
}

export const CohortAnalysisChart: React.FC<CohortAnalysisChartProps> = ({
  data,
  timeRange,
  onCohortSelect,
}) => {
  if (!data) {
    return (
      <div className="cohort-analysis-chart">
        <div className="w-full h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <div className="text-gray-500">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cohort-analysis-chart">
      <div className="w-full h-64 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 font-medium mb-2">Cohort Analysis</div>
          <div className="text-sm text-gray-500">
            Time Range: {timeRange}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Customer cohort behavior matrix goes here
          </div>
        </div>
      </div>
    </div>
  );
};

export default CohortAnalysisChart;