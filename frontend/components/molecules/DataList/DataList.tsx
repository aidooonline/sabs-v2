'use client';

import React, { ReactNode, useState } from 'react';
import { cn } from '../../../utils/helpers';
import { Card, CardHeader, CardBody } from '../../atoms/Card';
import { Button } from '../../atoms/Button';
import { SearchInput } from '../SearchInput';

export interface DataListItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, any>;
  status?: 'active' | 'inactive' | 'pending' | 'error';
  avatar?: ReactNode;
  icon?: ReactNode;
  badge?: string | number;
  actions?: DataListAction[];
}

export interface DataListAction {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  onClick: (item: DataListItem) => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface DataListProps {
  items: DataListItem[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onItemClick?: (item: DataListItem) => void;
  renderItem?: (item: DataListItem) => ReactNode;
  renderActions?: (item: DataListItem) => ReactNode;
  className?: string;
  itemClassName?: string;
  variant?: 'default' | 'compact' | 'detailed';
  selectable?: boolean;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  showHeader?: boolean;
  title?: string;
  headerActions?: ReactNode;
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
};

const variantStyles = {
  default: {
    container: 'space-y-3',
    item: 'p-4',
  },
  compact: {
    container: 'space-y-1',
    item: 'p-3',
  },
  detailed: {
    container: 'space-y-4',
    item: 'p-6',
  },
};

export const DataList: React.FC<DataListProps> = ({
  items,
  loading = false,
  error,
  emptyMessage = 'No items found',
  searchable = false,
  searchPlaceholder = 'Search items...',
  onSearch,
  onItemClick,
  renderItem,
  renderActions,
  className,
  itemClassName,
  variant = 'default',
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  showHeader = false,
  title,
  headerActions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const styles = variantStyles[variant];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleItemClick = (item: DataListItem) => {
    if (selectable) {
      const isSelected = selectedItems.includes(item.id);
      const newSelection = isSelected
        ? selectedItems.filter(id => id !== item.id)
        : [...selectedItems, item.id];
      onSelectionChange?.(newSelection);
    } else {
      onItemClick?.(item);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(items.map(item => item.id));
    }
  };

  const isAllSelected = selectedItems.length === items.length && items.length > 0;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < items.length;

  const renderDefaultItem = (item: DataListItem) => (
    <div className="flex items-center space-x-4">
      {selectable && (
        <input
          type="checkbox"
          checked={selectedItems.includes(item.id)}
          onChange={() => handleItemClick(item)}
          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
      )}
      
      {(item.avatar || item.icon) && (
        <div className="flex-shrink-0">
          {item.avatar || item.icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {item.title}
          </h3>
          {item.status && (
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                statusColors[item.status]
              )}
            >
              {item.status}
            </span>
          )}
          {item.badge && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {item.badge}
            </span>
          )}
        </div>
        
        {item.subtitle && (
          <p className="text-sm text-gray-600 truncate">{item.subtitle}</p>
        )}
        
        {item.description && variant === 'detailed' && (
          <p className="mt-1 text-sm text-gray-500">{item.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex space-x-2">
        {renderActions ? 
          renderActions(item) : 
          item.actions?.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'ghost'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(item);
              }}
              disabled={action.disabled}
              loading={action.loading}
              aria-label={action.label}
            >
              {action.icon && <span className="w-4 h-4">{action.icon}</span>}
              {variant === 'detailed' && action.label}
            </Button>
          ))
        }
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <div className={styles.item}>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 text-red-400">
              <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
              <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">{emptyMessage}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={cn(className)}>
      {/* Header */}
      {(showHeader || searchable) && (
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {title && (
                  <h2 className="text-lg font-medium text-gray-900">{title}</h2>
                )}
                {selectable && items.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-xs"
                  >
                    {isAllSelected ? 'Deselect All' : isPartiallySelected ? 'Select All' : 'Select All'}
                    {selectedItems.length > 0 && ` (${selectedItems.length})`}
                  </Button>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {searchable && (
                  <div className="w-64">
                    <SearchInput
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={handleSearch}
                      size="sm"
                      variant="filled"
                    />
                  </div>
                )}
                {headerActions}
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Items List */}
      <div className={styles.container}>
        {items.map((item) => (
          <Card
            key={item.id}
            className={cn(
              'transition-colors',
              onItemClick && !selectable && 'cursor-pointer hover:bg-gray-50',
              selectable && selectedItems.includes(item.id) && 'ring-2 ring-primary-500 bg-primary-50',
              itemClassName
            )}
            onClick={() => onItemClick && !selectable && handleItemClick(item)}
          >
            <div className={styles.item}>
              {renderItem ? renderItem(item) : renderDefaultItem(item)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DataList;