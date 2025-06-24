'use client';

import React, { ReactNode } from 'react';
import { cn } from '../../../utils/helpers';
import { Button } from '../../atoms/Button';

export interface ActionBarAction {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link';
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  shortcut?: string;
  tooltip?: string;
  hidden?: boolean;
}

export interface ActionBarProps {
  actions: ActionBarAction[];
  variant?: 'default' | 'minimal' | 'elevated' | 'bordered';
  layout?: 'horizontal' | 'vertical';
  alignment?: 'left' | 'center' | 'right' | 'space-between' | 'space-around';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  separated?: boolean;
  sticky?: boolean;
  collapsible?: boolean;
  collapseBreakpoint?: number;
  moreMenuLabel?: string;
}

const variantStyles = {
  default: 'bg-white border-b border-gray-200',
  minimal: 'bg-transparent',
  elevated: 'bg-white shadow-md border border-gray-200',
  bordered: 'bg-white border border-gray-300 rounded-lg',
};

const alignmentClasses = {
  left: 'justify-start',
  center: 'justify-center', 
  right: 'justify-end',
  'space-between': 'justify-between',
  'space-around': 'justify-around',
};

export const ActionBar: React.FC<ActionBarProps> = ({
  actions,
  variant = 'default',
  layout = 'horizontal',
  alignment = 'left',
  size = 'md',
  className,
  separated = false,
  sticky = false,
  collapsible = false,
  collapseBreakpoint = 768,
  moreMenuLabel = 'More',
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  const moreMenuRef = React.useRef<HTMLDivElement>(null);

  // Filter out hidden actions
  const visibleActions = actions.filter(action => !action.hidden);

  // Handle window resize for collapsible behavior
  React.useEffect(() => {
    if (!collapsible) return;

    const handleResize = () => {
      setIsCollapsed(window.innerWidth < collapseBreakpoint);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsible, collapseBreakpoint]);

  // Handle click outside for more menu
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifierPressed = event.ctrlKey || event.metaKey;
      
      if (!isModifierPressed) return;

      const action = visibleActions.find(action => 
        action.shortcut && 
        action.shortcut.toLowerCase() === event.key.toLowerCase()
      );

      if (action && !action.disabled && !action.loading) {
        event.preventDefault();
        action.onClick();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visibleActions]);

  const renderAction = (action: ActionBarAction, inMenu = false) => (
    <Button
      key={action.id}
      variant={action.variant || 'ghost'}
      size={action.size || size}
      onClick={action.onClick}
      disabled={action.disabled}
      loading={action.loading}
      leftIcon={action.icon}
      className={cn(
        'transition-all duration-200',
        inMenu && 'w-full justify-start',
        separated && !inMenu && 'border-r border-gray-200 last:border-r-0 rounded-none first:rounded-l-md last:rounded-r-md'
      )}
      aria-label={action.label}
      title={action.tooltip || (action.shortcut ? `${action.label} (Ctrl+${action.shortcut.toUpperCase()})` : action.label)}
    >
      {inMenu || layout === 'vertical' ? action.label : (
        <>
          <span className="hidden sm:inline">{action.label}</span>
          <span className="sm:hidden sr-only">{action.label}</span>
        </>
      )}
    </Button>
  );

  const containerClasses = cn(
    'flex items-center gap-2 p-3',
    layout === 'vertical' ? 'flex-col items-stretch' : 'flex-row',
    alignmentClasses[alignment],
    variantStyles[variant],
    sticky && 'sticky top-0 z-40',
    separated && layout === 'horizontal' && 'gap-0',
    className
  );

  // For mobile/collapsed view, show first few actions + more menu
  if (collapsible && isCollapsed && visibleActions.length > 3) {
    const primaryActions = visibleActions.slice(0, 2);
    const secondaryActions = visibleActions.slice(2);

    return (
      <div className={containerClasses}>
        {primaryActions.map(action => renderAction(action))}
        
        <div className="relative" ref={moreMenuRef}>
          <Button
            variant="ghost"
            size={size}
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            aria-label={moreMenuLabel}
            aria-expanded={showMoreMenu}
            aria-haspopup="true"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </Button>

          {showMoreMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <div className="py-1">
                {secondaryActions.map(action => (
                  <div key={action.id} className="px-1">
                    {renderAction({ ...action, variant: 'ghost' }, true)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {visibleActions.map(action => renderAction(action))}
    </div>
  );
};

export default ActionBar;