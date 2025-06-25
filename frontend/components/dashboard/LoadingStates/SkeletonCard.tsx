'use client';

import React from 'react';

interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  lines?: number;
  animated?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  showAvatar = false,
  lines = 3,
  animated = true,
}) => {
  const skeletonClass = animated ? 'skeleton' : 'bg-gray-200';
  
  return (
    <div className={`dashboard-card ${className}`}>
      {showAvatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className={`w-12 h-12 rounded-full ${skeletonClass}`}></div>
          <div className="flex-1">
            <div className={`h-4 ${skeletonClass} mb-2 w-3/4`}></div>
            <div className={`h-3 ${skeletonClass} w-1/2`}></div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`h-4 ${skeletonClass}`}
            style={{
              width: index === lines - 1 ? '75%' : '100%',
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

interface SkeletonMetricCardProps {
  className?: string;
}

export const SkeletonMetricCard: React.FC<SkeletonMetricCardProps> = ({
  className = '',
}) => {
  return (
    <div className={`dashboard-card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-4 w-24"></div>
        <div className="skeleton h-8 w-8 rounded"></div>
      </div>
      
      <div className="skeleton h-8 w-32 mb-2"></div>
      
      <div className="flex items-center space-x-2">
        <div className="skeleton h-3 w-16"></div>
        <div className="skeleton h-3 w-12"></div>
      </div>
    </div>
  );
};

interface SkeletonChartCardProps {
  className?: string;
  chartHeight?: string;
}

export const SkeletonChartCard: React.FC<SkeletonChartCardProps> = ({
  className = '',
  chartHeight = 'h-64',
}) => {
  return (
    <div className={`dashboard-card ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="skeleton h-6 w-48"></div>
        <div className="skeleton h-8 w-24 rounded"></div>
      </div>
      
      <div className={`skeleton ${chartHeight} rounded mb-4`}></div>
      
      <div className="flex justify-between">
        <div className="skeleton h-4 w-20"></div>
        <div className="skeleton h-4 w-20"></div>
        <div className="skeleton h-4 w-20"></div>
      </div>
    </div>
  );
};

interface SkeletonTableProps {
  className?: string;
  rows?: number;
  columns?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  className = '',
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className={`dashboard-card ${className}`}>
      <div className="skeleton h-6 w-32 mb-6"></div>
      
      <div className="space-y-4">
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={`header-${index}`} className="skeleton h-4 w-full"></div>
          ))}
        </div>
        
        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="grid grid-cols-4 gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className="skeleton h-4"
                style={{
                  width: colIndex === 0 ? '80%' : colIndex === columns - 1 ? '60%' : '100%',
                }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading overlay for existing components
interface LoadingOverlayProps {
  children: React.ReactNode;
  isLoading: boolean;
  skeleton?: React.ReactNode;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  children,
  isLoading,
  skeleton,
  className = '',
}) => {
  if (isLoading && skeleton) {
    return <div className={className}>{skeleton}</div>;
  }
  
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-card">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};