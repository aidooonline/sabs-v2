'use client';

import React from 'react';
import type { RegionalDistributionData } from '../../../types/analytics';

interface RegionalDistributionMapProps {
  data: RegionalDistributionData | undefined;
}

export const RegionalDistributionMap: React.FC<RegionalDistributionMapProps> = ({
  data,
}) => {
  if (!data) {
    return (
      <div className="regional-distribution-map">
        <div className="w-full h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <div className="text-gray-500">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="regional-distribution-map">
      <div className="w-full h-64 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 font-medium mb-2">Ghana Regional Distribution</div>
          <div className="text-sm text-gray-500">
            Total Customers: {data.totalCustomers} | Regions: {data.regions?.length || 0}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Interactive Ghana map implementation goes here
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalDistributionMap;