'use client';

import { useEffect, useState, useCallback } from 'react';

interface UseKeyboardNavigationProps {
  customerIds: string[];
  selectedCustomers: string[];
  onCustomerSelect: (customerId: string) => void;
  onCustomerAction: (action: string, customerId: string) => void;
  onBulkAction?: (action: string, customerIds: string[]) => void;
}

export const useKeyboardNavigation = ({
  customerIds,
  selectedCustomers,
  onCustomerSelect,
  onCustomerAction,
  onBulkAction,
}: UseKeyboardNavigationProps) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [navigationMode, setNavigationMode] = useState<'normal' | 'selection'>('normal');

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle if focus is in an input or textarea
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'j': // Vim-style navigation
        event.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, customerIds.length - 1));
        break;

      case 'ArrowUp':
      case 'k': // Vim-style navigation
        event.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;

      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;

      case 'End':
        event.preventDefault();
        setFocusedIndex(customerIds.length - 1);
        break;

      case 'PageDown':
        event.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 10, customerIds.length - 1));
        break;

      case 'PageUp':
        event.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 10, 0));
        break;

      case ' ': // Space to select/deselect
        event.preventDefault();
        if (customerIds[focusedIndex]) {
          onCustomerSelect(customerIds[focusedIndex]);
          setNavigationMode('selection');
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (customerIds[focusedIndex]) {
          onCustomerAction('info', customerIds[focusedIndex]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        setNavigationMode('normal');
        // Clear focus or selections if needed
        break;

      case 'a':
        // Ctrl+A to select all
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          customerIds.forEach(id => {
            if (!selectedCustomers.includes(id)) {
              onCustomerSelect(id);
            }
          });
          setNavigationMode('selection');
        }
        break;

      case 'd':
        // 'd' for deposit action on focused customer
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          if (customerIds[focusedIndex]) {
            onCustomerAction('deposit', customerIds[focusedIndex]);
          }
        }
        break;

      case 'w':
        // 'w' for withdraw action on focused customer
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          if (customerIds[focusedIndex]) {
            onCustomerAction('withdraw', customerIds[focusedIndex]);
          }
        }
        break;

      case 'i':
        // 'i' for info/details on focused customer
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          if (customerIds[focusedIndex]) {
            onCustomerAction('info', customerIds[focusedIndex]);
          }
        }
        break;

      case 'e':
        // 'e' for edit on focused customer
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          if (customerIds[focusedIndex]) {
            onCustomerAction('edit', customerIds[focusedIndex]);
          }
        }
        break;

      case 'h':
        // 'h' for history on focused customer
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          if (customerIds[focusedIndex]) {
            onCustomerAction('history', customerIds[focusedIndex]);
          }
        }
        break;

      case 'Delete':
      case 'Backspace':
        // Delete/Archive selected customers
        if (selectedCustomers.length > 0 && onBulkAction) {
          event.preventDefault();
          onBulkAction('archive', selectedCustomers);
        }
        break;

      case 'x':
        // 'x' to export selected customers
        if (selectedCustomers.length > 0 && onBulkAction) {
          event.preventDefault();
          onBulkAction('export', selectedCustomers);
        }
        break;

      case 'm':
        // 'm' to email selected customers
        if (selectedCustomers.length > 0 && onBulkAction) {
          event.preventDefault();
          onBulkAction('email', selectedCustomers);
        }
        break;

      case '?':
        // Show keyboard shortcuts help
        event.preventDefault();
        showKeyboardShortcutsHelp();
        break;

      default:
        break;
    }
  }, [
    customerIds,
    focusedIndex,
    selectedCustomers,
    onCustomerSelect,
    onCustomerAction,
    onBulkAction,
  ]);

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Focus management
  useEffect(() => {
    const focusedElement = document.querySelector(`[data-customer-index="${focusedIndex}"]`);
    if (focusedElement) {
      (focusedElement as HTMLElement).focus();
    }
  }, [focusedIndex]);

  // Show keyboard shortcuts help modal
  const showKeyboardShortcutsHelp = () => {
    // This would trigger a modal or toast with keyboard shortcuts
    console.log('Keyboard shortcuts help would be shown here');
  };

  return {
    focusedIndex,
    navigationMode,
    setFocusedIndex,
    setNavigationMode,
  };
};

// Keyboard shortcuts reference for UI
export const KEYBOARD_SHORTCUTS = {
  navigation: [
    { key: '↑/↓ or j/k', description: 'Navigate up/down' },
    { key: 'Home/End', description: 'Go to first/last customer' },
    { key: 'Page Up/Down', description: 'Jump 10 customers' },
  ],
  selection: [
    { key: 'Space', description: 'Select/deselect customer' },
    { key: 'Ctrl+A', description: 'Select all customers' },
    { key: 'Escape', description: 'Clear selection' },
  ],
  actions: [
    { key: 'Enter or i', description: 'View customer details' },
    { key: 'd', description: 'Make deposit' },
    { key: 'w', description: 'Make withdrawal' },
    { key: 'e', description: 'Edit customer' },
    { key: 'h', description: 'View history' },
  ],
  bulkActions: [
    { key: 'x', description: 'Export selected' },
    { key: 'm', description: 'Email selected' },
    { key: 'Delete', description: 'Archive selected' },
  ],
  help: [
    { key: '?', description: 'Show keyboard shortcuts' },
  ],
};

// Hook for managing focus states
export const useFocusManagement = () => {
  const [focusVisible, setFocusVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key.startsWith('Arrow')) {
        setFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return { focusVisible };
};