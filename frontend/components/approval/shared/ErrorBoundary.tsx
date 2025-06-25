'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

// Simple SVG icons to avoid external dependencies during foundation setup
const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const ArrowPathIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  context?: 'workflow' | 'dashboard' | 'review' | 'authorization' | 'reports';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ApprovalErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `approval-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Log error details
    console.error('Approval Workflow Error:', {
      error,
      errorInfo,
      context: this.props.context,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to monitoring service (would be implemented with actual service)
    this.reportError(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In a real application, this would send to error monitoring service
      // like Sentry, LogRocket, or custom error reporting endpoint
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        context: this.props.context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('userId'), // If available
      };

      // Send to error reporting endpoint
      await fetch('/api/error-reporting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      }).catch(() => {
        // Silently fail if error reporting fails
        console.warn('Failed to report error to monitoring service');
      });
    } catch (reportingError) {
      console.warn('Error reporting failed:', reportingError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private getContextMessage = () => {
    switch (this.props.context) {
      case 'workflow':
        return 'There was an error processing the approval workflow. This might be due to a network issue or data validation error.';
      case 'dashboard':
        return 'Unable to load the approval dashboard. Please check your connection and try again.';
      case 'review':
        return 'Error loading workflow review details. The workflow data might be corrupted or unavailable.';
      case 'authorization':
        return 'Security authorization error. Please verify your permissions and authentication status.';
      case 'reports':
        return 'Unable to generate approval reports. The reporting service might be temporarily unavailable.';
      default:
        return 'An unexpected error occurred in the approval system. Please try again or contact support.';
    }
  };

  private getRecoveryActions = () => {
    const canRetry = this.retryCount < this.maxRetries;
    
    return (
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        {canRetry && (
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Try Again ({this.maxRetries - this.retryCount} attempts left)
          </button>
        )}
        
        <button
          onClick={this.handleGoBack}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          Go Back
        </button>
        
        <button
          onClick={this.handleReload}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Oops! Something went wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {this.getContextMessage()}
              </p>
              
              {this.props.showErrorDetails && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Error Details (Click to expand)
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 rounded-md">
                    <p className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                      <strong>Error ID:</strong> {this.state.errorId}
                      {'\n\n'}
                      <strong>Message:</strong> {this.state.error.message}
                      {'\n\n'}
                      <strong>Stack:</strong>
                      {'\n'}
                      {this.state.error.stack}
                    </p>
                  </div>
                </details>
              )}
              
              {this.getRecoveryActions()}
              
              <div className="mt-6 text-xs text-gray-500">
                <p>
                  If this problem persists, please contact support with Error ID:{' '}
                  <span className="font-mono">{this.state.errorId}</span>
                </p>
                <p className="mt-1">
                  Time: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withApprovalErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ApprovalErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ApprovalErrorBoundary>
  );

  WrappedComponent.displayName = `withApprovalErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for triggering error boundary from child components
export function useErrorHandler() {
  return (error: Error, errorInfo?: Partial<ErrorInfo>) => {
    // This will be caught by the nearest error boundary
    throw error;
  };
}