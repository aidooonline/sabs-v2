'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface FilterValue {
  label: string;
  value: string | number | boolean | Record<string, any>;
  count?: number;
  metadata?: Record<string, any>;
}

interface FilterDefinition {
  id: string;
  name: string;
  type: 'single_select' | 'multi_select' | 'range' | 'date_range' | 'boolean' | 'search' | 'custom';
  field: string;
  values: FilterValue[];
  defaultValue?: any;
  placeholder?: string;
  icon?: string;
  category: 'status' | 'assignment' | 'risk' | 'time' | 'amount' | 'compliance' | 'customer';
  priority: number;
  conditional?: {
    dependsOn: string;
    showWhen: any;
  };
}

interface ActiveFilter {
  id: string;
  definition: FilterDefinition;
  value: any;
  displayValue: string;
}

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: Record<string, any>;
  icon: string;
  category: 'quick' | 'common' | 'advanced';
  usage_count: number;
  isDefault?: boolean;
}

interface SmartFiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void;
  currentFilters?: Record<string, any>;
  resultCount?: number;
  context?: 'dashboard' | 'queue' | 'review' | 'history';
  companyId: string;
  userId: string;
}

const FILTER_DEFINITIONS: FilterDefinition[] = [
  {
    id: 'status',
    name: 'Status',
    type: 'multi_select',
    field: 'status',
    category: 'status',
    priority: 1,
    icon: 'status',
    values: [
      { label: 'Pending Review', value: 'pending', count: 0 },
      { label: 'In Progress', value: 'in_review', count: 0 },
      { label: 'Approved', value: 'approved', count: 0 },
      { label: 'Rejected', value: 'rejected', count: 0 },
      { label: 'Escalated', value: 'escalated', count: 0 },
      { label: 'On Hold', value: 'on_hold', count: 0 }
    ]
  },
  {
    id: 'risk_level',
    name: 'Risk Level',
    type: 'multi_select',
    field: 'risk_level',
    category: 'risk',
    priority: 2,
    icon: 'shield',
    values: [
      { label: 'Low Risk', value: 'low', count: 0 },
      { label: 'Medium Risk', value: 'medium', count: 0 },
      { label: 'High Risk', value: 'high', count: 0 },
      { label: 'Critical Risk', value: 'critical', count: 0 }
    ]
  },
  {
    id: 'assigned_to',
    name: 'Assigned To',
    type: 'multi_select',
    field: 'assigned_to',
    category: 'assignment',
    priority: 3,
    icon: 'user',
    values: [
      { label: 'Me', value: 'current_user', count: 0 },
      { label: 'Unassigned', value: 'unassigned', count: 0 },
      { label: 'My Team', value: 'my_team', count: 0 }
    ]
  },
  {
    id: 'amount_range',
    name: 'Amount Range',
    type: 'range',
    field: 'amount',
    category: 'amount',
    priority: 4,
    icon: 'currency',
    values: [
      { label: 'Under ₵100', value: { min: 0, max: 100 }, count: 0 },
      { label: '₵100 - ₵1,000', value: { min: 100, max: 1000 }, count: 0 },
      { label: '₵1,000 - ₵10,000', value: { min: 1000, max: 10000 }, count: 0 },
      { label: 'Over ₵10,000', value: { min: 10000, max: null }, count: 0 }
    ]
  },
  {
    id: 'created_date',
    name: 'Created Date',
    type: 'single_select',
    field: 'created_at',
    category: 'time',
    priority: 5,
    icon: 'calendar',
    values: [
      { label: 'Today', value: 'today', count: 0 },
      { label: 'Yesterday', value: 'yesterday', count: 0 },
      { label: 'This Week', value: 'this_week', count: 0 },
      { label: 'Last Week', value: 'last_week', count: 0 },
      { label: 'This Month', value: 'this_month', count: 0 },
      { label: 'Last Month', value: 'last_month', count: 0 }
    ]
  },
  {
    id: 'sla_status',
    name: 'SLA Status',
    type: 'multi_select',
    field: 'sla_status',
    category: 'time',
    priority: 6,
    icon: 'clock',
    values: [
      { label: 'Within SLA', value: 'within_sla', count: 0 },
      { label: 'SLA Warning', value: 'sla_warning', count: 0 },
      { label: 'SLA Breached', value: 'sla_breached', count: 0 }
    ]
  },
  {
    id: 'priority',
    name: 'Priority',
    type: 'multi_select',
    field: 'priority',
    category: 'status',
    priority: 7,
    icon: 'flag',
    values: [
      { label: 'Low', value: 'low', count: 0 },
      { label: 'Medium', value: 'medium', count: 0 },
      { label: 'High', value: 'high', count: 0 },
      { label: 'Urgent', value: 'urgent', count: 0 }
    ]
  },
  {
    id: 'compliance_flags',
    name: 'Compliance Flags',
    type: 'boolean',
    field: 'has_compliance_flags',
    category: 'compliance',
    priority: 8,
    icon: 'flag-warning',
    values: [
      { label: 'Has Flags', value: true, count: 0 },
      { label: 'No Flags', value: false, count: 0 }
    ]
  },
  {
    id: 'customer_type',
    name: 'Customer Type',
    type: 'multi_select',
    field: 'customer_type',
    category: 'customer',
    priority: 9,
    icon: 'users',
    values: [
      { label: 'Individual', value: 'individual', count: 0 },
      { label: 'Business', value: 'business', count: 0 },
      { label: 'VIP', value: 'vip', count: 0 },
      { label: 'New Customer', value: 'new_customer', count: 0 }
    ]
  }
];

const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'my_tasks',
    name: 'My Tasks',
    description: 'Items assigned to me',
    filters: { assigned_to: ['current_user'] },
    icon: 'user',
    category: 'quick',
    usage_count: 0,
    isDefault: true
  },
  {
    id: 'urgent_items',
    name: 'Urgent Items',
    description: 'High priority and SLA warnings',
    filters: { 
      priority: ['high', 'urgent'],
      sla_status: ['sla_warning', 'sla_breached']
    },
    icon: 'alert',
    category: 'quick',
    usage_count: 0
  },
  {
    id: 'high_risk',
    name: 'High Risk',
    description: 'High and critical risk items',
    filters: { risk_level: ['high', 'critical'] },
    icon: 'shield',
    category: 'quick',
    usage_count: 0
  },
  {
    id: 'pending_review',
    name: 'Pending Review',
    description: 'Items waiting for review',
    filters: { status: ['pending'] },
    icon: 'clock',
    category: 'quick',
    usage_count: 0
  },
  {
    id: 'large_amounts',
    name: 'Large Amounts',
    description: 'Transactions over ₵10,000',
    filters: { amount_range: { min: 10000, max: null } },
    icon: 'currency',
    category: 'common',
    usage_count: 0
  },
  {
    id: 'compliance_issues',
    name: 'Compliance Issues',
    description: 'Items with compliance flags',
    filters: { compliance_flags: true },
    icon: 'flag-warning',
    category: 'common',
    usage_count: 0
  }
];

export const SmartFilters: React.FC<SmartFiltersProps> = ({
  onFiltersChange,
  currentFilters = {},
  resultCount,
  context = 'dashboard',
  companyId,
  userId
}) => {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [availableFilters, setAvailableFilters] = useState<FilterDefinition[]>(FILTER_DEFINITIONS);
  const [presets, setPresets] = useState<FilterPreset[]>(FILTER_PRESETS);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterCounts, setFilterCounts] = useState<Record<string, Record<string, number>>>({});
  const [suggestedFilters, setSuggestedFilters] = useState<FilterDefinition[]>([]);

  // Initialize filters from props
  useEffect(() => {
    updateActiveFiltersFromProps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilters]);

  // Update filter counts based on current results
  useEffect(() => {
    updateFilterCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultCount]);

  // Generate suggested filters based on context and current selection
  useEffect(() => {
    generateSuggestedFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilters, context]);

  // Update active filters from props
  const updateActiveFiltersFromProps = useCallback(() => {
    const newActiveFilters: ActiveFilter[] = [];
    
    Object.entries(currentFilters).forEach(([key, value]) => {
      const definition = availableFilters.find(f => f.field === key);
      if (definition && value !== null && value !== undefined) {
        const displayValue = formatDisplayValue(definition, value);
        newActiveFilters.push({
          id: `${definition.id}_${Date.now()}`,
          definition,
          value,
          displayValue
        });
      }
    });

    setActiveFilters(newActiveFilters);
  }, [currentFilters, availableFilters]);

  // Update filter counts (mock implementation)
  const updateFilterCounts = useCallback(() => {
    // In a real implementation, this would fetch actual counts from the API
    const mockCounts: Record<string, Record<string, number>> = {
      status: {
        pending: Math.floor(Math.random() * 50),
        in_review: Math.floor(Math.random() * 30),
        approved: Math.floor(Math.random() * 100),
        rejected: Math.floor(Math.random() * 20),
        escalated: Math.floor(Math.random() * 10)
      },
      risk_level: {
        low: Math.floor(Math.random() * 80),
        medium: Math.floor(Math.random() * 40),
        high: Math.floor(Math.random() * 20),
        critical: Math.floor(Math.random() * 5)
      }
    };

    setFilterCounts(mockCounts);
  }, []);

  // Generate suggested filters based on context
  const generateSuggestedFilters = useCallback(() => {
    const activeFieldIds = activeFilters.map(f => f.definition.id);
    const available = availableFilters.filter(f => !activeFieldIds.includes(f.id));
    
    // Context-specific suggestions
    let contextSuggestions: FilterDefinition[] = [];
    
    switch (context) {
      case 'dashboard':
        contextSuggestions = available.filter(f => 
          ['status', 'risk_level', 'assigned_to'].includes(f.id)
        );
        break;
      case 'queue':
        contextSuggestions = available.filter(f => 
          ['priority', 'sla_status', 'assigned_to'].includes(f.id)
        );
        break;
      case 'review':
        contextSuggestions = available.filter(f => 
          ['risk_level', 'compliance_flags', 'amount_range'].includes(f.id)
        );
        break;
      default:
        contextSuggestions = available.slice(0, 3);
    }

    setSuggestedFilters(contextSuggestions.slice(0, 4));
  }, [activeFilters, availableFilters, context]);

  // Format display value for filter
  const formatDisplayValue = useCallback((definition: FilterDefinition, value: any): string => {
    if (Array.isArray(value)) {
      if (value.length === 0) return '';
      if (value.length === 1) {
        const filterValue = definition.values.find(v => v.value === value[0]);
        return filterValue?.label || String(value[0]);
      }
      return `${value.length} selected`;
    }

    if (typeof value === 'object' && value.min !== undefined) {
      if (value.max === null) {
        return `> ₵${value.min.toLocaleString()}`;
      }
      return `₵${value.min.toLocaleString()} - ₵${value.max.toLocaleString()}`;
    }

    const filterValue = definition.values.find(v => v.value === value);
    return filterValue?.label || String(value);
  }, []);

  // Add filter
  const addFilter = useCallback((definition: FilterDefinition, value?: any) => {
    const filterValue = value || definition.defaultValue || (
      definition.type === 'multi_select' ? [] :
      definition.type === 'boolean' ? false :
      definition.type === 'range' ? { min: 0, max: 1000 } :
      ''
    );

    const displayValue = formatDisplayValue(definition, filterValue);
    
    const newFilter: ActiveFilter = {
      id: `${definition.id}_${Date.now()}`,
      definition,
      value: filterValue,
      displayValue
    };

    const newActiveFilters = [...activeFilters, newFilter];
    setActiveFilters(newActiveFilters);
    
    // Build filters object and notify parent
    const filtersObject = buildFiltersObject(newActiveFilters);
    onFiltersChange(filtersObject);
    
    setShowFilterMenu(false);
  }, [activeFilters, formatDisplayValue, onFiltersChange]);

  // Remove filter
  const removeFilter = useCallback((filterId: string) => {
    const newActiveFilters = activeFilters.filter(f => f.id !== filterId);
    setActiveFilters(newActiveFilters);
    
    const filtersObject = buildFiltersObject(newActiveFilters);
    onFiltersChange(filtersObject);
  }, [activeFilters, onFiltersChange]);

  // Update filter value
  const updateFilterValue = useCallback((filterId: string, newValue: any) => {
    const newActiveFilters = activeFilters.map(f => {
      if (f.id === filterId) {
        const displayValue = formatDisplayValue(f.definition, newValue);
        return { ...f, value: newValue, displayValue };
      }
      return f;
    });

    setActiveFilters(newActiveFilters);
    
    const filtersObject = buildFiltersObject(newActiveFilters);
    onFiltersChange(filtersObject);
  }, [activeFilters, formatDisplayValue, onFiltersChange]);

  // Apply preset
  const applyPreset = useCallback((preset: FilterPreset) => {
    // Clear existing filters
    setActiveFilters([]);
    
    // Apply preset filters
    onFiltersChange(preset.filters);
    
    // Update usage count
    const updatedPresets = presets.map(p => 
      p.id === preset.id ? { ...p, usage_count: p.usage_count + 1 } : p
    );
    setPresets(updatedPresets);
    
    setShowFilterMenu(false);
  }, [presets, onFiltersChange]);

  // Build filters object for API
  const buildFiltersObject = useCallback((filters: ActiveFilter[]): Record<string, any> => {
    const filtersObj: Record<string, any> = {};
    
    filters.forEach(filter => {
      filtersObj[filter.definition.field] = filter.value;
    });
    
    return filtersObj;
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
    onFiltersChange({});
  }, [onFiltersChange]);

  // Get icon for filter
  const getFilterIcon = useCallback((iconName: string) => {
    const icons: Record<string, JSX.Element> = {
      status: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      shield: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      user: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      currency: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      calendar: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      clock: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      flag: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2h7a2 2 0 012 2v6a2 2 0 01-2 2h-7l-1-2H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      ),
      'flag-warning': (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      users: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      alert: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    };

    return icons[iconName] || icons.status;
  }, []);

  // Get available filter definitions
  const availableFilterDefinitions = useMemo(() => {
    const activeFieldIds = activeFilters.map(f => f.definition.id);
    return availableFilters.filter(f => !activeFieldIds.includes(f.id));
  }, [activeFilters, availableFilters]);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="p-4">
        {/* Filter Presets */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-sm font-medium text-gray-700 mr-2">Quick Filters:</span>
          {presets.filter(p => p.category === 'quick').map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <span className="mr-1">{getFilterIcon(preset.icon)}</span>
              {preset.name}
            </button>
          ))}
          
          {/* More Presets Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              More Filters
            </button>

            {/* Filter Menu */}
            {showFilterMenu && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4">
                  {/* Common Presets */}
                  {presets.filter(p => p.category === 'common').length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Common Filters</h4>
                      <div className="space-y-1">
                        {presets.filter(p => p.category === 'common').map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => applyPreset(preset)}
                            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            <span className="mr-2">{getFilterIcon(preset.icon)}</span>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{preset.name}</div>
                              <div className="text-xs text-gray-500">{preset.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available Filters */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Add Filter</h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {availableFilterDefinitions
                        .sort((a, b) => a.priority - b.priority)
                        .map(definition => (
                          <button
                            key={definition.id}
                            onClick={() => addFilter(definition)}
                            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            <span className="mr-2">{getFilterIcon(definition.icon || 'status')}</span>
                            <span className="flex-1 text-left">{definition.name}</span>
                            <span className="text-xs text-gray-400 capitalize">{definition.category}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 mb-4">
            <span className="text-sm font-medium text-gray-700">Filters:</span>
            {activeFilters.map(filter => (
              <div
                key={filter.id}
                className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                <span className="mr-1">{getFilterIcon(filter.definition.icon || 'status')}</span>
                <span className="mr-1">{filter.definition.name}:</span>
                <span className="font-medium">{filter.displayValue}</span>
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Suggested Filters */}
        {suggestedFilters.length > 0 && activeFilters.length < 3 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Suggested:</span>
            {suggestedFilters.map(suggestion => (
              <button
                key={suggestion.id}
                onClick={() => addFilter(suggestion)}
                className="inline-flex items-center px-2 py-1 rounded text-xs text-gray-600 border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              >
                <span className="mr-1">{getFilterIcon(suggestion.icon || 'status')}</span>
                {suggestion.name}
              </button>
            ))}
          </div>
        )}

        {/* Result Count */}
        {resultCount !== undefined && (
          <div className="mt-3 text-sm text-gray-600">
            {resultCount} {resultCount === 1 ? 'item' : 'items'} found
            {activeFilters.length > 0 && (
              <span className="text-gray-400"> with {activeFilters.length} {activeFilters.length === 1 ? 'filter' : 'filters'} applied</span>
            )}
          </div>
        )}
      </div>

      {/* Click outside handler */}
      {showFilterMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowFilterMenu(false)}
        />
      )}
    </div>
  );
};