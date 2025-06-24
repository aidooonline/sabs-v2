'use client';

import React, { ReactNode } from 'react';
import { cn } from '../../../utils/helpers';

export interface DashboardTemplateProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  fullWidth?: boolean;
  showBreadcrumbs?: boolean;
}

export const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  children,
  title,
  subtitle,
  actions,
  className,
  fullWidth = false,
  showBreadcrumbs = true,
}) => {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Page Header */}
      {(title || actions) && (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className={cn('mx-auto', !fullWidth && 'max-w-7xl')}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-600 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
              
              {actions && (
                <div className="ml-4 flex-shrink-0 flex space-x-4">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <div className={cn('mx-auto px-6 py-8', !fullWidth && 'max-w-7xl')}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardTemplate;