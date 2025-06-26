'use client';

import React from 'react';

// ===== SKELETON LOADING COMPONENTS =====

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

export const Skeleton = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4', 
  rounded = true 
}: SkeletonProps) => (
  <div 
    className={`
      ${width} ${height} 
      ${rounded ? 'rounded' : ''} 
      bg-gray-200 animate-pulse 
      ${className}
    `} 
  />
);

// ===== APPROVAL WORKFLOW SPECIFIC LOADING STATES =====

export const WorkflowCardSkeleton = () => (
  <div className="approval-card">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <Skeleton width="w-32" height="h-5" className="mb-2" />
        <Skeleton width="w-24" height="h-4" />
      </div>
      <Skeleton width="w-16" height="h-6" />
    </div>
    
    <div className="space-y-3">
      <div className="flex justify-between">
        <Skeleton width="w-20" height="h-4" />
        <Skeleton width="w-16" height="h-4" />
      </div>
      <div className="flex justify-between">
        <Skeleton width="w-24" height="h-4" />
        <Skeleton width="w-20" height="h-4" />
      </div>
      <div className="flex justify-between">
        <Skeleton width="w-16" height="h-4" />
        <Skeleton width="w-12" height="h-3" rounded />
      </div>
    </div>
    
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex justify-between items-center">
        <Skeleton width="w-24" height="h-4" />
        <div className="flex space-x-2">
          <Skeleton width="w-16" height="h-8" />
          <Skeleton width="w-16" height="h-8" />
        </div>
      </div>
    </div>
  </div>
);

export const ApprovalQueueSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="approval-queue">
    {Array.from({ length: count }).map((_, index) => (
      <WorkflowCardSkeleton key={index} />
    ))}
  </div>
);

export const WorkflowDetailsSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-6">
    {/* Header */}
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton width="w-48" height="h-6" className="mb-2" />
          <Skeleton width="w-32" height="h-4" />
        </div>
        <div className="flex space-x-2">
          <Skeleton width="w-20" height="h-8" />
          <Skeleton width="w-20" height="h-8" />
          <Skeleton width="w-20" height="h-8" />
        </div>
      </div>
      <Skeleton width="w-full" height="h-1" />
    </div>
    
    {/* Customer & Request Details */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <Skeleton width="w-32" height="h-5" className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton width="w-24" height="h-4" />
              <Skeleton width="w-32" height="h-4" />
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <Skeleton width="w-28" height="h-5" className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton width="w-20" height="h-4" />
              <Skeleton width="w-28" height="h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
    
    {/* Risk Assessment */}
    <div className="bg-white rounded-lg shadow p-6">
      <Skeleton width="w-36" height="h-5" className="mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <Skeleton width="w-20" height="h-4" className="mb-2" />
            <Skeleton width="w-16" height="h-6" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <Skeleton width="w-16" height="h-8" className="mb-2" />
            <Skeleton width="w-24" height="h-4" />
          </div>
          <Skeleton width="w-12" height="h-12" />
        </div>
        <div className="mt-4">
          <Skeleton width="w-20" height="h-3" />
        </div>
      </div>
    ))}
  </div>
);

// ===== LOADING SPINNERS =====

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

export const Spinner = ({ 
  size = 'md', 
  color = 'text-primary-600',
  className = '' 
}: SpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <svg 
      className={`animate-spin ${sizeClasses[size]} ${color} ${className}`} 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// ===== LOADING OVERLAYS =====

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  blur?: boolean;
}

export const LoadingOverlay = ({ 
  isLoading, 
  message = 'Loading...', 
  children, 
  blur = true 
}: LoadingOverlayProps) => (
  <div className="relative">
    <div className={isLoading && blur ? 'filter blur-sm' : ''}>{children}</div>
    {isLoading && (
      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-gray-700">{message}</p>
        </div>
      </div>
    )}
  </div>
);

// ===== BUTTON LOADING STATES =====

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
}

export const LoadingButton = ({
  isLoading,
  children,
  disabled,
  className = '',
  onClick,
  type = 'button',
  variant = 'primary'
}: LoadingButtonProps) => {
  const baseClasses = 'inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'border-transparent text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-primary-500',
    danger: 'border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {isLoading && <Spinner size="sm" color="text-current" className="mr-2" />}
      {children}
    </button>
  );
};

// ===== PROGRESS INDICATORS =====

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const ProgressBar = ({ 
  progress, 
  className = '', 
  showLabel = false,
  variant = 'default' 
}: ProgressBarProps) => {
  const variantClasses = {
    default: 'bg-primary-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${variantClasses[variant]}`}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
    </div>
  );
};

// ===== EMPTY STATES =====

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({ 
  title, 
  description, 
  icon, 
  action, 
  className = '' 
}: EmptyStateProps) => (
  <div className={`text-center py-12 ${className}`}>
    {icon && (
      <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    {description && (
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
    )}
    {action}
  </div>
);

// ===== UTILITY HOOKS =====

export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  
  const startLoading = React.useCallback(() => setIsLoading(true), []);
  const stopLoading = React.useCallback(() => setIsLoading(false), []);
  const toggleLoading = React.useCallback(() => setIsLoading(prev => !prev), []);
  
  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    setIsLoading
  };
};