'use client';

import React from 'react';
import { MoreHorizontal, Download, RefreshCw, Maximize2 } from 'lucide-react';
import type { ChartContainerProps } from '../../types/analytics';

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  isLoading = false,
  icon: Icon,
  children,
  actions,
}) => {
  // Loading skeleton for charts
  if (isLoading) {
    return (
      <div className="chart-container">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-48 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Chart skeleton */}
          <div className="space-y-3">
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-full h-64 bg-gray-100 rounded animate-pulse"></div>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex-1 h-3 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-gray-600" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {actions}
            <div className="relative">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {/* Dropdown menu would go here */}
            </div>
          </div>
        </div>

        {/* Chart Content */}
        <div className="chart-content">
          {children}
        </div>
      </div>
    </div>
  );
};

// Chart container with actions
export const ChartContainerWithActions: React.FC<ChartContainerProps & {
  onRefresh?: () => void;
  onExport?: () => void;
  onFullscreen?: () => void;
  refreshing?: boolean;
}> = ({
  title,
  subtitle,
  isLoading = false,
  icon: Icon,
  children,
  onRefresh,
  onExport,
  onFullscreen,
  refreshing = false,
}) => {
  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      isLoading={isLoading}
      icon={Icon}
      actions={
        <div className="flex items-center space-x-1">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      }
    >
      {children}
    </ChartContainer>
  );
};

// Compact chart container for smaller charts
export const CompactChartContainer: React.FC<{
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
}> = ({
  title,
  children,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="compact-chart-container">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="w-full h-32 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="compact-chart-container">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {title}
        </h4>
        <div className="chart-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ChartContainer;