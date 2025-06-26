'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface RealTimeSearchProps {
  value: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  debounceMs?: number;
  className?: string;
}

export const RealTimeSearch: React.FC<RealTimeSearchProps> = ({
  value,
  onSearch,
  placeholder = "Search customers...",
  isLoading = false,
  debounceMs = 300,
  className = "",
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onSearch(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onSearch, value]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onSearch('');
  }, [onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  }, [handleClear]);

  return (
    <div className={`relative ${className}`}>
      {/* Search input */}
      <div className={`relative flex items-center transition-all duration-200 ${
        isFocused 
          ? 'ring-2 ring-primary-500 border-transparent' 
          : 'border-gray-300 hover:border-gray-400'
      } border rounded-lg`}>
        {/* Search icon */}
        <div className="absolute left-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>

        {/* Input field */}
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 text-sm bg-white border-0 rounded-lg focus:outline-none placeholder-gray-500"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Loading or clear button */}
        <div className="absolute right-3 flex items-center">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : localValue && (
            <button
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded"
              type="button"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search suggestions/history (placeholder for future enhancement) */}
      {isFocused && localValue.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 text-sm text-gray-500">
            Press Enter to search for "{localValue}"
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook for debounced search functionality
 */
export const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Enhanced search input with search history
 */
interface SearchWithHistoryProps extends RealTimeSearchProps {
  searchHistory?: string[];
  onSelectHistory?: (query: string) => void;
  maxHistoryItems?: number;
}

export const SearchWithHistory: React.FC<SearchWithHistoryProps> = ({
  searchHistory = [],
  onSelectHistory,
  maxHistoryItems = 5,
  ...props
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const recentHistory = searchHistory.slice(0, maxHistoryItems);
  const showHistoryDropdown = isFocused && showHistory && recentHistory.length > 0;

  return (
    <div className="relative">
      <RealTimeSearch
        {...props}
        className={`${props.className} ${showHistoryDropdown ? 'rounded-b-none' : ''}`}
      />

      {/* Search history dropdown */}
      {showHistoryDropdown && (
        <div className="absolute top-full left-0 right-0 bg-white border border-t-0 border-gray-200 rounded-b-lg shadow-lg z-50">
          <div className="py-2">
            <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recent Searches
            </div>
            {recentHistory.map((historyItem, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelectHistory?.(historyItem);
                  setShowHistory(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Search className="w-4 h-4 text-gray-400" />
                <span>{historyItem}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};