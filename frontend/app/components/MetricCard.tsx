'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatTrend } from '../../utils/formatters';
import type { MetricCardProps } from '../../types/analytics';

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  formatter,
  trend,
  icon: Icon,
  color = 'blue',
  isLoading = false,
  subtitle,
}) => {
  // Color theme mapping
  const colorThemes = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100',
      text: 'text-blue-900',
      border: 'border-blue-200',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      iconBg: 'bg-green-100',
      text: 'text-green-900',
      border: 'border-green-200',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      iconBg: 'bg-purple-100',
      text: 'text-purple-900',
      border: 'border-purple-200',
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      iconBg: 'bg-orange-100',
      text: 'text-orange-900',
      border: 'border-orange-200',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      iconBg: 'bg-red-100',
      text: 'text-red-900',
      border: 'border-red-200',
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      text: 'text-yellow-900',
      border: 'border-yellow-200',
    },
  };

  const theme = colorThemes[color];

  // Trend indicator component
  const TrendIndicator = ({ trend }: { trend: number }) => {
    const { text, color: trendColor, icon } = formatTrend(trend);
    
    const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
    
    return (
      <div className={`flex items-center space-x-1 ${trendColor}`}>
        <TrendIcon className="w-3 h-3" />
        <span className="text-xs font-medium">{text}</span>
      </div>
    );
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="metric-card">
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
            <div className="w-32 h-8 bg-gray-200 rounded"></div>
            <div className="w-24 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="metric-card">
      <div className={`bg-white rounded-lg border ${theme.border} p-6 hover:shadow-md transition-shadow duration-200`}>
        {/* Header with icon and trend */}
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 rounded-lg ${theme.iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${theme.icon}`} />
          </div>
          {trend !== undefined && (
            <TrendIndicator trend={trend} />
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          {/* Title */}
          <h3 className="text-sm font-medium text-gray-700">
            {title}
          </h3>

          {/* Value */}
          <div className="text-2xl font-bold text-gray-900">
            {formatter(value)}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-gray-500">
              {subtitle}
            </p>
          )}
        </div>

        {/* Additional visual indicator */}
        <div className={`mt-4 h-1 rounded-full ${theme.bg}`}>
          <div 
            className={`h-full rounded-full ${theme.iconBg} transition-all duration-300`}
            style={{ width: '75%' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Metric card with comparison
export const ComparisonMetricCard: React.FC<MetricCardProps & {
  comparisonValue: number;
  comparisonLabel: string;
}> = ({
  title,
  value,
  formatter,
  trend,
  icon: Icon,
  color = 'blue',
  isLoading = false,
  subtitle,
  comparisonValue,
  comparisonLabel,
}) => {
  const colorThemes = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100',
      text: 'text-blue-900',
      border: 'border-blue-200',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      iconBg: 'bg-green-100',
      text: 'text-green-900',
      border: 'border-green-200',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      iconBg: 'bg-purple-100',
      text: 'text-purple-900',
      border: 'border-purple-200',
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      iconBg: 'bg-orange-100',
      text: 'text-orange-900',
      border: 'border-orange-200',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      iconBg: 'bg-red-100',
      text: 'text-red-900',
      border: 'border-red-200',
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      text: 'text-yellow-900',
      border: 'border-yellow-200',
    },
  };

  const theme = colorThemes[color];

  if (isLoading) {
    return (
      <div className="metric-card">
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
            <div className="w-32 h-8 bg-gray-200 rounded"></div>
            <div className="w-24 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="metric-card">
      <div className={`bg-white rounded-lg border ${theme.border} p-6 hover:shadow-md transition-shadow duration-200`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 rounded-lg ${theme.iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${theme.icon}`} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center space-x-1 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {trend > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : trend < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              <span className="text-xs font-medium">{formatTrend(trend).text}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          
          {/* Main Value */}
          <div className="text-2xl font-bold text-gray-900">
            {formatter(value)}
          </div>

          {/* Comparison Value */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{comparisonLabel}:</span>
            <span className="font-medium text-gray-700">
              {formatter(comparisonValue)}
            </span>
          </div>

          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Mini metric card for compact displays
export const MiniMetricCard: React.FC<{
  title: string;
  value: number;
  formatter: (value: number) => string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  trend?: number;
}> = ({
  title,
  value,
  formatter,
  color = 'blue',
  trend,
}) => {
  const colorThemes = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
  };

  return (
    <div className="mini-metric-card">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-xs font-medium text-gray-500 mb-1">{title}</div>
        <div className={`text-lg font-bold ${colorThemes[color]}`}>
          {formatter(value)}
        </div>
        {trend !== undefined && (
          <div className={`text-xs ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {formatTrend(trend).text}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;