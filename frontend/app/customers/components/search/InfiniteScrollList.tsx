'use client';

import React, { useEffect, useRef } from 'react';
import type { Customer } from '../../../../types/customer';
import { CustomerCard } from '../CustomerCard';

interface InfiniteScrollListProps {
  customers: Customer[];
  selectedCustomers: string[];
  onCustomerSelect: (customerId: string) => void;
  onCustomerAction: (action: string, customerId: string) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
}

export const InfiniteScrollList: React.FC<InfiniteScrollListProps> = ({
  customers,
  selectedCustomers,
  onCustomerSelect,
  onCustomerAction,
  hasMore,
  onLoadMore,
  isLoading,
}) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <div className="space-y-4">
      <div className="customer-grid">
        {customers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            isSelected={selectedCustomers.includes(customer.id)}
            onSelect={() => onCustomerSelect(customer.id)}
            onAction={onCustomerAction}
            showActions={true}
          />
        ))}
      </div>

      {/* Loading trigger */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="flex items-center justify-center py-8"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading more customers...</span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="customer-action-button primary"
            >
              Load More
            </button>
          )}
        </div>
      )}

      {!hasMore && customers.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No more customers to load</p>
        </div>
      )}
    </div>
  );
};