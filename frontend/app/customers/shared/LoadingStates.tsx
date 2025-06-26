'use client';

import React from 'react';
import { Loader2, Users, Search, FileText, CreditCard } from 'lucide-react';

// Generic loading spinner
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin ${className}`} />
  );
};

// Customer list loading skeleton
export const CustomerListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="customer-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="customer-card animate-pulse">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
          <div className="mt-4 flex space-x-2">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded w-14"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Customer details loading skeleton
export const CustomerDetailsSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="w-24 h-8 bg-gray-200 rounded"></div>
      </div>

      {/* Content sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Information */}
        <div className="space-y-4">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 border rounded">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Transaction history loading skeleton
export const TransactionHistorySkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-4 border rounded animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Search results loading skeleton
export const SearchResultsSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Search header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      
      {/* Results skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="p-4 border rounded animate-pulse">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Form loading overlay
export const FormLoadingOverlay: React.FC<{ message?: string }> = ({ 
  message = 'Saving...' 
}) => {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
      <div className="flex items-center space-x-3">
        <LoadingSpinner size="md" />
        <span className="text-gray-600">{message}</span>
      </div>
    </div>
  );
};

// Page-level loading state
export const CustomerPageLoading: React.FC<{ 
  icon?: React.ReactNode;
  title?: string;
  message?: string;
}> = ({ 
  icon = <Users className="w-12 h-12 text-primary-500" />,
  title = 'Loading Customer Data',
  message = 'Please wait while we fetch the latest customer information...'
}) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        <LoadingSpinner size="lg" className="text-primary-500 mx-auto" />
      </div>
    </div>
  );
};

// Inline loading states for buttons and small components
export const InlineLoading: React.FC<{ 
  text?: string;
  size?: 'sm' | 'md';
}> = ({ text = 'Loading...', size = 'sm' }) => {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size={size} />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
};

// Document upload loading state
export const DocumentUploadLoading: React.FC<{ 
  progress?: number;
  fileName?: string;
}> = ({ progress, fileName }) => {
  return (
    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="flex items-center space-x-3 mb-3">
        <FileText className="w-8 h-8 text-gray-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {fileName || 'Uploading document...'}
          </p>
          <p className="text-xs text-gray-500">Please wait</p>
        </div>
      </div>
      
      {progress !== undefined && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

// Account creation loading state
export const AccountCreationLoading: React.FC = () => {
  return (
    <div className="p-6 text-center">
      <div className="flex justify-center mb-4">
        <CreditCard className="w-16 h-16 text-primary-500 animate-pulse" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Creating New Account
      </h3>
      <p className="text-gray-600 mb-4">
        Setting up the account with the provided information...
      </p>
      <LoadingSpinner size="lg" className="text-primary-500 mx-auto" />
    </div>
  );
};

// Empty state with loading option
export const EmptyStateWithLoading: React.FC<{
  isLoading?: boolean;
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ 
  isLoading = false,
  icon = <Search className="w-12 h-12 text-gray-400" />,
  title,
  description,
  action
}) => {
  if (isLoading) {
    return <CustomerPageLoading title="Searching..." message="Looking for customers..." />;
  }

  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  );
};