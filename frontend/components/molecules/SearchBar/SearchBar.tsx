import React, { useState } from 'react';
import { Input } from '@/components/atoms/Input';
import { Icon } from '@/components/atoms/Icon';

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onSearch?: (value: string) => void;
  onChange?: (value: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value: controlledValue,
  onSearch,
  onChange,
  onClear,
  disabled = false,
  loading = false,
  className = '',
  size = 'md',
}) => {
  const [internalValue, setInternalValue] = useState('');
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch?.(value.trim());
    }
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
    }
    onClear?.();
    onChange?.('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        size={size}
        leftIcon={<Icon name="search" size={size === 'sm' ? 'sm' : 'md'} color="gray" />}
        rightIcon={
          <div className="flex items-center space-x-1">
            {loading && <Icon name="search" size="sm" color="gray" />}
            {value && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={disabled}
              >
                <Icon name="menu" size="sm" />
              </button>
            )}
          </div>
        }
        className="pr-12"
      />
    </form>
  );
};

export default SearchBar;