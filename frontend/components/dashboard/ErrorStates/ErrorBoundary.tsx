'use client';

import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ error, errorInfo });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log error for monitoring
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return <DashboardErrorCard error={this.state.error} />;
    }

    return this.props.children;
  }
}

interface DashboardErrorCardProps {
  error?: Error;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const DashboardErrorCard: React.FC<DashboardErrorCardProps> = ({
  error,
  title = 'Something went wrong',
  message = 'An error occurred while loading this dashboard component.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`dashboard-card border border-danger-200 ${className}`}>
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-danger-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        
        {error && process.env.NODE_ENV === 'development' && (
          <details className="text-left mb-4 p-4 bg-gray-50 rounded text-sm">
            <summary className="cursor-pointer font-medium text-gray-700 mb-2">
              Error Details (Development Only)
            </summary>
            <pre className="text-xs text-gray-600 overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

interface ApiErrorCardProps {
  error: {
    status?: number;
    message?: string;
    data?: any;
  };
  onRetry?: () => void;
  className?: string;
}

export const ApiErrorCard: React.FC<ApiErrorCardProps> = ({
  error,
  onRetry,
  className = '',
}) => {
  const getErrorMessage = () => {
    if (error.status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    if (error.status === 403) {
      return 'You do not have permission to access this data.';
    }
    if (error.status === 404) {
      return 'The requested data could not be found.';
    }
    if (error.status === 500) {
      return 'A server error occurred. Please try again later.';
    }
    if (error.status && error.status >= 400) {
      return error.message || 'An error occurred while loading data.';
    }
    
    return 'Unable to connect to the server. Please check your internet connection.';
  };

  const getErrorIcon = () => {
    if (error.status === 401 || error.status === 403) {
      return (
        <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    }
    
    if (!error.status || error.status >= 500) {
      return (
        <svg className="w-8 h-8 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    );
  };

  return (
    <div className={`dashboard-card border border-warning-200 ${className}`}>
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning-100 flex items-center justify-center">
          {getErrorIcon()}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {error.status ? `Error ${error.status}` : 'Connection Error'}
        </h3>
        <p className="text-gray-600 mb-4">{getErrorMessage()}</p>
        
        {onRetry && error.status !== 401 && error.status !== 403 && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        )}
        
        {(error.status === 401 || error.status === 403) && (
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Log In
          </button>
        )}
      </div>
    </div>
  );
};

interface EmptyStateCardProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon,
  title = 'No data available',
  message = 'There is no data to display at this time.',
  action,
  className = '',
}) => {
  const defaultIcon = (
    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  return (
    <div className={`dashboard-card ${className}`}>
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          {icon || defaultIcon}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};