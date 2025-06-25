import React from 'react';
import { Card } from '../../atoms/Card';
import { Badge } from '../../atoms/Badge';
import { Spinner } from '../../atoms/Spinner';
import { cn } from '../../../utils/helpers';

export interface DashboardSummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: number;
    percentage: boolean;
    period: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

// Trend Arrow SVG Components
const TrendUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

export const DashboardSummaryCard: React.FC<DashboardSummaryCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon,
  variant = 'default',
  loading = false,
  onClick,
  className,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          accentColor: 'text-green-600',
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          accentColor: 'text-yellow-600',
        };
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          accentColor: 'text-red-600',
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          accentColor: 'text-blue-600',
        };
      default:
        return {
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          accentColor: 'text-primary-600',
        };
    }
  };

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format large numbers with K, M, B suffixes
      if (val >= 1000000000) {
        return (val / 1000000000).toFixed(1) + 'B';
      } else if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      } else if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K';
      }
      return val.toLocaleString();
    }
    return val;
  };

  const formatChange = (changeValue: number, isPercentage: boolean): string => {
    const formattedValue = isPercentage 
      ? `${Math.abs(changeValue).toFixed(1)}%` 
      : Math.abs(changeValue).toLocaleString();
    
    return changeValue >= 0 ? `+${formattedValue}` : `-${formattedValue}`;
  };

  const getChangeColor = (changeValue: number): string => {
    if (changeValue > 0) return 'text-green-600 bg-green-50';
    if (changeValue < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const styles = getVariantStyles();

  if (loading) {
    return (
      <Card className={cn('p-6 animate-pulse', className)}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="ml-4 flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn('p-6 transition-all duration-200', className)}
      interactive={!!onClick}
      onClick={onClick}
    >
      <div className="flex items-center">
        {icon && (
          <div className={cn(
            'flex-shrink-0 p-3 rounded-lg',
            styles.iconBg
          )}>
            <div className={cn('w-6 h-6', styles.iconColor)}>
              {icon}
            </div>
          </div>
        )}
        
        <div className={cn('flex-1', icon ? 'ml-4' : '')}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600 truncate">
              {title}
            </p>
            {change && (
              <div className={cn(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                getChangeColor(change.value)
              )}>
                {change.value > 0 ? (
                  <TrendUpIcon className="w-3 h-3 mr-1" />
                ) : change.value < 0 ? (
                  <TrendDownIcon className="w-3 h-3 mr-1" />
                ) : null}
                {formatChange(change.value, change.percentage)}
              </div>
            )}
          </div>
          
          <div className="mt-2">
            <p className="text-2xl font-bold text-gray-900">
              {formatValue(value)}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">
                {subtitle}
              </p>
            )}
            {change && (
              <p className="text-xs text-gray-400 mt-1">
                vs {change.period}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DashboardSummaryCard;