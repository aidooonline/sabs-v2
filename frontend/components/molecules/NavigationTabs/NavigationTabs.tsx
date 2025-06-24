'use client';

import React, { ReactNode } from 'react';
import { cn } from '../../../utils/helpers';
import { Button } from '../../atoms/Button';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: string | number;
  ariaLabel?: string;
}

export interface NavigationTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'segment';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
}

const tabVariants = {
  default: {
    container: 'border-b border-gray-200',
    tab: 'border-b-2 border-transparent hover:border-gray-300 hover:text-gray-700',
    activeTab: 'border-primary-500 text-primary-600',
    inactiveTab: 'text-gray-500',
  },
  pills: {
    container: 'bg-gray-100 p-1 rounded-lg',
    tab: 'rounded-md hover:bg-gray-200',
    activeTab: 'bg-white text-gray-900 shadow-sm',
    inactiveTab: 'text-gray-600',
  },
  underline: {
    container: '',
    tab: 'border-b-2 border-transparent hover:border-gray-300',
    activeTab: 'border-primary-500 text-primary-600',
    inactiveTab: 'text-gray-500',
  },
  segment: {
    container: 'bg-gray-100 p-1 rounded-lg flex',
    tab: 'flex-1 hover:bg-gray-200 rounded-md',
    activeTab: 'bg-white text-gray-900 shadow-sm',
    inactiveTab: 'text-gray-600',
  },
};

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  orientation = 'horizontal',
  fullWidth = false,
  className,
  disabled = false,
}) => {
  const variantStyles = tabVariants[variant];
  
  const isVertical = orientation === 'vertical';
  
  const containerClasses = cn(
    'flex',
    isVertical ? 'flex-col space-y-1' : 'space-x-1',
    fullWidth && !isVertical && 'w-full',
    variantStyles.container,
    className
  );

  const handleTabClick = (tabId: string, tabDisabled?: boolean) => {
    if (!disabled && !tabDisabled && tabId !== activeTab) {
      onTabChange(tabId);
    }
  };

  return (
    <div className={containerClasses} role="tablist" aria-orientation={orientation}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isTabDisabled = disabled || tab.disabled;
        
        return (
          <Button
            key={tab.id}
            variant="ghost"
            size={size}
            disabled={isTabDisabled}
            onClick={() => handleTabClick(tab.id, tab.disabled)}
            className={cn(
              'relative transition-all duration-200',
              variantStyles.tab,
              isActive ? variantStyles.activeTab : variantStyles.inactiveTab,
              isVertical && 'justify-start',
              fullWidth && variant === 'segment' && 'flex-1',
              isTabDisabled && 'opacity-50 cursor-not-allowed'
            )}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            aria-label={tab.ariaLabel || tab.label}
            tabIndex={isActive ? 0 : -1}
          >
            <div className="flex items-center space-x-2">
              {tab.icon && (
                <span className="flex-shrink-0" aria-hidden="true">
                  {tab.icon}
                </span>
              )}
              <span className="truncate">{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full',
                    isActive
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-200 text-gray-700'
                  )}
                  aria-label={`${tab.badge} notifications`}
                >
                  {tab.badge}
                </span>
              )}
            </div>
          </Button>
        );
      })}
    </div>
  );
};

export default NavigationTabs;