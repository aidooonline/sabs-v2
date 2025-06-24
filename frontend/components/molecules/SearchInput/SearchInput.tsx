'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { cn, debounce } from '../../../utils/helpers';
import { Input } from '../../atoms/Input';
import { Button } from '../../atoms/Button';
import { Card } from '../../atoms/Card';

export interface SearchSuggestion {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  category?: string;
}

export interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onSearch?: (value: string) => void;
  onChange?: (value: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  onClear?: () => void;
  suggestions?: SearchSuggestion[];
  loading?: boolean;
  disabled?: boolean;
  showSuggestions?: boolean;
  maxSuggestions?: number;
  debounceMs?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'filled';
  showSearchButton?: boolean;
  autoFocus?: boolean;
  clearable?: boolean;
}

const variantStyles = {
  default: {
    container: 'relative',
    input: '',
  },
  minimal: {
    container: 'relative',
    input: 'border-0 shadow-none bg-transparent focus:ring-0',
  },
  filled: {
    container: 'relative',
    input: 'bg-gray-50 border-gray-200 focus:bg-white',
  },
};

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  value: controlledValue,
  onSearch,
  onChange,
  onSuggestionSelect,
  onClear,
  suggestions = [],
  loading = false,
  disabled = false,
  showSuggestions = true,
  maxSuggestions = 10,
  debounceMs = 300,
  className,
  size = 'md',
  variant = 'default',
  showSearchButton = false,
  autoFocus = false,
  clearable = true,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  const styles = variantStyles[variant];

  // Debounced search function
  const debouncedSearch = useRef(
    debounce((searchValue: string) => {
      if (onSearch && searchValue.trim()) {
        onSearch(searchValue.trim());
      }
    }, debounceMs)
  ).current;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);
    setSelectedIndex(-1);
    
    if (newValue.trim()) {
      debouncedSearch(newValue);
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setIsFocused(false);
      setSelectedIndex(-1);
    }, 150);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentValue.trim()) {
      onSearch?.(currentValue.trim());
      setIsFocused(false);
    }
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
    }
    onClear?.();
    onChange?.('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (!isControlled) {
      setInternalValue(suggestion.label);
    }
    onChange?.(suggestion.label);
    onSuggestionSelect?.(suggestion);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
      return;
    }

    const visibleSuggestions = suggestions.slice(0, maxSuggestions);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < visibleSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : visibleSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && visibleSuggestions[selectedIndex]) {
          handleSuggestionClick(visibleSuggestions[selectedIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setIsFocused(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const showSuggestionsDropdown = 
    showSuggestions && 
    isFocused && 
    suggestions.length > 0 && 
    currentValue.trim().length > 0;

  const visibleSuggestions = suggestions.slice(0, maxSuggestions);

  const searchIcon = (
    <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const clearIcon = (
    <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const rightElement = (
    <div className="flex items-center space-x-1">
      {clearable && currentValue && !loading && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={disabled}
          className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <div className="w-4 h-4">
            {clearIcon}
          </div>
        </Button>
      )}
      {showSearchButton && (
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={disabled || loading}
          className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
          aria-label="Search"
        >
          <div className="w-4 h-4">
            {searchIcon}
          </div>
        </Button>
      )}
      {loading && (
        <div className="w-4 h-4 animate-spin">
          <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn(styles.container, className)}>
      <form onSubmit={handleSubmit}>
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={currentValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          size={size}
          leftIcon={!showSearchButton ? <div className="w-4 h-4 text-gray-400">{searchIcon}</div> : undefined}
          rightElement={rightElement}
          className={cn(styles.input)}
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestionsDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestionsDropdown && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          <Card className="shadow-none border-0">
            {visibleSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center space-x-3',
                  index === selectedIndex && 'bg-primary-50 text-primary-900',
                  index === 0 && 'rounded-t-md',
                  index === visibleSuggestions.length - 1 && 'rounded-b-md'
                )}
                role="option"
                aria-selected={index === selectedIndex}
              >
                {suggestion.icon && (
                  <div className="flex-shrink-0 w-5 h-5 text-gray-400">
                    {suggestion.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.label}
                  </div>
                  {suggestion.description && (
                    <div className="text-xs text-gray-500 truncate">
                      {suggestion.description}
                    </div>
                  )}
                </div>
                {suggestion.category && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {suggestion.category}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
};

export default SearchInput;