'use client';

import React, { useState, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { Input } from '../../atoms/Input';
import { Card } from '../../atoms/Card';
import { cn } from '../../../utils/helpers';
import type { MenuItem } from '../../../constants/menuItems';

export interface MainMenuProps {
  items: MenuItem[];
  onItemClick?: (item: MenuItem) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showFeatured?: boolean;
  className?: string;
  itemClassName?: string;
  compact?: boolean;
}

interface MenuItemCardProps {
  item: MenuItem;
  onClick: () => void;
  featured?: boolean;
  compact?: boolean;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  item, 
  onClick, 
  featured = false, 
  compact = false 
}) => {
  const IconComponent = item.icon;

  return (
    <Card
      interactive
      onClick={onClick}
      className={cn(
        'h-full transition-all duration-200 cursor-pointer hover:shadow-md',
        featured && 'ring-2 ring-primary-200 bg-primary-50'
      )}
    >
      <div className={cn(
        'flex items-start space-x-3',
        compact ? 'p-3' : 'p-4'
      )}>
        <div className={cn(
          'flex-shrink-0 p-2 rounded-lg',
          featured 
            ? 'bg-primary-100 text-primary-600' 
            : 'bg-gray-100 text-gray-600'
        )}>
          <IconComponent className={cn(
            compact ? 'w-5 h-5' : 'w-6 h-6'
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-medium text-gray-900 truncate',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {item.title}
          </h3>
          {item.description && !compact && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export const MainMenu: React.FC<MainMenuProps> = ({
  items,
  onItemClick,
  searchPlaceholder = 'Search menu items...',
  showSearch = true,
  showFeatured = true,
  className,
  itemClassName,
  compact = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { hasRole, hasPermission } = useAuth();

  // Filter menu items based on user permissions and search
  const filteredMenuItems = useMemo(() => {
    return items.filter(item => {
      // Check role-based access
      if (item.roles && !item.roles.some(role => hasRole(role))) {
        return false;
      }
      
      // Check permission-based access
      if (item.permissions && !item.permissions.some(permission => hasPermission(permission))) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [items, hasRole, hasPermission, searchQuery]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    filteredMenuItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredMenuItems]);

  // Featured items for quick access
  const featuredItems = useMemo(() => {
    return filteredMenuItems.filter(item => item.featured);
  }, [filteredMenuItems]);

  const handleItemClick = (item: MenuItem) => {
    if (onItemClick) {
      onItemClick(item);
    } else {
      router.push(item.path);
    }
  };

  const gridCols = compact 
    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' 
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search Bar */}
      {showSearch && (
        <div className="w-full max-w-md">
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            size={compact ? 'sm' : 'md'}
          />
        </div>
      )}

      {/* Featured Items */}
      {showFeatured && !searchQuery && featuredItems.length > 0 && (
        <section>
          <h2 className={cn(
            'font-semibold text-gray-900 mb-4',
            compact ? 'text-base' : 'text-lg'
          )}>
            Quick Actions
          </h2>
          <div className={cn('grid gap-4', gridCols)}>
            {featuredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
                featured
                compact={compact}
              />
            ))}
          </div>
        </section>
      )}

      {/* Grouped Menu Items */}
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <section key={category}>
          <h2 className={cn(
            'font-semibold text-gray-900 mb-4',
            compact ? 'text-base' : 'text-lg'
          )}>
            {category}
          </h2>
          <div className={cn('grid gap-4', gridCols)}>
            {categoryItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
                compact={compact}
              />
            ))}
          </div>
        </section>
      ))}

      {/* No Results */}
      {searchQuery && filteredMenuItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">
            Try adjusting your search query or browse the categories above.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!searchQuery && filteredMenuItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items available</h3>
          <p className="text-gray-500">
            Contact your administrator if you need access to additional features.
          </p>
        </div>
      )}
    </div>
  );
};

export default MainMenu;