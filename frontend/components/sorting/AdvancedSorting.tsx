'use client';

import React, { useState, useCallback, useMemo } from 'react';

interface SortField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'enum' | 'boolean' | 'custom';
  sortable: boolean;
  defaultDirection?: 'asc' | 'desc';
  customSort?: (a: any, b: any) => number;
  enumOrder?: string[];
  icon?: string;
  category: 'basic' | 'advanced' | 'time' | 'amount' | 'status';
  priority: number;
}

interface SortCriterion {
  id: string;
  field: string;
  direction: 'asc' | 'desc';
  label: string;
  type: string;
}

interface SortPreset {
  id: string;
  name: string;
  description: string;
  criteria: Omit<SortCriterion, 'id'>[];
  icon: string;
  category: 'default' | 'common' | 'custom';
  usage_count: number;
}

interface AdvancedSortingProps {
  onSortChange: (sortCriteria: SortCriterion[]) => void;
  currentSort?: SortCriterion[];
  context?: 'dashboard' | 'queue' | 'review' | 'history';
  maxCriteria?: number;
}

const SORT_FIELDS: SortField[] = [
  {
    key: 'created_at',
    label: 'Created Date',
    type: 'date',
    sortable: true,
    defaultDirection: 'desc',
    icon: 'calendar',
    category: 'time',
    priority: 1
  },
  {
    key: 'sla_deadline',
    label: 'SLA Deadline',
    type: 'date',
    sortable: true,
    defaultDirection: 'asc',
    icon: 'clock',
    category: 'time',
    priority: 2
  },
  {
    key: 'amount',
    label: 'Amount',
    type: 'number',
    sortable: true,
    defaultDirection: 'desc',
    icon: 'currency',
    category: 'amount',
    priority: 3
  },
  {
    key: 'risk_score',
    label: 'Risk Score',
    type: 'number',
    sortable: true,
    defaultDirection: 'desc',
    icon: 'shield',
    category: 'basic',
    priority: 4
  },
  {
    key: 'priority',
    label: 'Priority',
    type: 'enum',
    sortable: true,
    defaultDirection: 'desc',
    enumOrder: ['urgent', 'high', 'medium', 'low'],
    icon: 'flag',
    category: 'status',
    priority: 5
  },
  {
    key: 'status',
    label: 'Status',
    type: 'enum',
    sortable: true,
    defaultDirection: 'asc',
    enumOrder: ['pending', 'in_review', 'escalated', 'approved', 'rejected'],
    icon: 'status',
    category: 'status',
    priority: 6
  },
  {
    key: 'customer_name',
    label: 'Customer Name',
    type: 'string',
    sortable: true,
    defaultDirection: 'asc',
    icon: 'user',
    category: 'basic',
    priority: 7
  },
  {
    key: 'workflow_id',
    label: 'Workflow ID',
    type: 'string',
    sortable: true,
    defaultDirection: 'asc',
    icon: 'hash',
    category: 'basic',
    priority: 8
  },
  {
    key: 'assigned_to',
    label: 'Assigned To',
    type: 'string',
    sortable: true,
    defaultDirection: 'asc',
    icon: 'user-circle',
    category: 'basic',
    priority: 9
  },
  {
    key: 'updated_at',
    label: 'Last Updated',
    type: 'date',
    sortable: true,
    defaultDirection: 'desc',
    icon: 'clock',
    category: 'time',
    priority: 10
  },
  {
    key: 'time_in_queue',
    label: 'Time in Queue',
    type: 'number',
    sortable: true,
    defaultDirection: 'desc',
    icon: 'timer',
    category: 'time',
    priority: 11
  },
  {
    key: 'completion_percentage',
    label: 'Completion %',
    type: 'number',
    sortable: true,
    defaultDirection: 'desc',
    icon: 'progress',
    category: 'advanced',
    priority: 12
  }
];

const SORT_PRESETS: SortPreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Most recent first',
    criteria: [
      { field: 'created_at', direction: 'desc', label: 'Created Date', type: 'date' }
    ],
    icon: 'default',
    category: 'default',
    usage_count: 0
  },
  {
    id: 'urgent_first',
    name: 'Urgent First',
    description: 'High priority and approaching SLA',
    criteria: [
      { field: 'priority', direction: 'desc', label: 'Priority', type: 'enum' },
      { field: 'sla_deadline', direction: 'asc', label: 'SLA Deadline', type: 'date' }
    ],
    icon: 'alert',
    category: 'common',
    usage_count: 0
  },
  {
    id: 'highest_amount',
    name: 'Highest Amount',
    description: 'Largest transactions first',
    criteria: [
      { field: 'amount', direction: 'desc', label: 'Amount', type: 'number' }
    ],
    icon: 'currency',
    category: 'common',
    usage_count: 0
  },
  {
    id: 'risk_priority',
    name: 'Risk Priority',
    description: 'High risk items first',
    criteria: [
      { field: 'risk_score', direction: 'desc', label: 'Risk Score', type: 'number' },
      { field: 'amount', direction: 'desc', label: 'Amount', type: 'number' }
    ],
    icon: 'shield',
    category: 'common',
    usage_count: 0
  },
  {
    id: 'oldest_first',
    name: 'Oldest First',
    description: 'Longest waiting items',
    criteria: [
      { field: 'created_at', direction: 'asc', label: 'Created Date', type: 'date' }
    ],
    icon: 'clock',
    category: 'common',
    usage_count: 0
  },
  {
    id: 'alphabetical',
    name: 'Alphabetical',
    description: 'Customer name A-Z',
    criteria: [
      { field: 'customer_name', direction: 'asc', label: 'Customer Name', type: 'string' }
    ],
    icon: 'sort-alpha',
    category: 'common',
    usage_count: 0
  }
];

export const AdvancedSorting: React.FC<AdvancedSortingProps> = ({
  onSortChange,
  currentSort = [],
  context = 'dashboard',
  maxCriteria = 3
}) => {
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>(currentSort);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [presets, setPresets] = useState<SortPreset[]>(SORT_PRESETS);

  // Get field configuration
  const getFieldConfig = useCallback((fieldKey: string): SortField | undefined => {
    return SORT_FIELDS.find(f => f.key === fieldKey);
  }, []);

  // Add sort criterion
  const addSortCriterion = useCallback((field: SortField) => {
    if (sortCriteria.length >= maxCriteria) return;

    // Check if field is already being sorted
    const existingIndex = sortCriteria.findIndex(c => c.field === field.key);
    if (existingIndex >= 0) return;

    const newCriterion: SortCriterion = {
      id: `sort_${Date.now()}`,
      field: field.key,
      direction: field.defaultDirection || 'asc',
      label: field.label,
      type: field.type
    };

    const newCriteria = [...sortCriteria, newCriterion];
    setSortCriteria(newCriteria);
    onSortChange(newCriteria);
    setShowSortMenu(false);
  }, [sortCriteria, maxCriteria, onSortChange]);

  // Remove sort criterion
  const removeSortCriterion = useCallback((criterionId: string) => {
    const newCriteria = sortCriteria.filter(c => c.id !== criterionId);
    setSortCriteria(newCriteria);
    onSortChange(newCriteria);
  }, [sortCriteria, onSortChange]);

  // Update sort direction
  const updateSortDirection = useCallback((criterionId: string, direction: 'asc' | 'desc') => {
    const newCriteria = sortCriteria.map(c =>
      c.id === criterionId ? { ...c, direction } : c
    );
    setSortCriteria(newCriteria);
    onSortChange(newCriteria);
  }, [sortCriteria, onSortChange]);

  // Reorder sort criteria
  const reorderCriteria = useCallback((dragIndex: number, hoverIndex: number) => {
    const newCriteria = [...sortCriteria];
    const draggedItem = newCriteria[dragIndex];
    newCriteria.splice(dragIndex, 1);
    newCriteria.splice(hoverIndex, 0, draggedItem);
    setSortCriteria(newCriteria);
    onSortChange(newCriteria);
  }, [sortCriteria, onSortChange]);

  // Apply sort preset
  const applySortPreset = useCallback((preset: SortPreset) => {
    const newCriteria: SortCriterion[] = preset.criteria.map(c => ({
      ...c,
      id: `sort_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));

    setSortCriteria(newCriteria);
    onSortChange(newCriteria);

    // Update usage count
    const updatedPresets = presets.map(p =>
      p.id === preset.id ? { ...p, usage_count: p.usage_count + 1 } : p
    );
    setPresets(updatedPresets);
    setShowSortMenu(false);
  }, [onSortChange, presets]);

  // Clear all sorting
  const clearAllSorting = useCallback(() => {
    setSortCriteria([]);
    onSortChange([]);
  }, [onSortChange]);

  // Get available sort fields
  const availableSortFields = useMemo(() => {
    const usedFields = sortCriteria.map(c => c.field);
    return SORT_FIELDS
      .filter(f => f.sortable && !usedFields.includes(f.key))
      .sort((a, b) => a.priority - b.priority);
  }, [sortCriteria]);

  // Get context-specific suggested sorts
  const suggestedSorts = useMemo(() => {
    const suggestions: SortField[] = [];
    
    switch (context) {
      case 'dashboard':
        suggestions.push(
          ...SORT_FIELDS.filter(f => ['created_at', 'priority', 'sla_deadline'].includes(f.key))
        );
        break;
      case 'queue':
        suggestions.push(
          ...SORT_FIELDS.filter(f => ['sla_deadline', 'priority', 'time_in_queue'].includes(f.key))
        );
        break;
      case 'review':
        suggestions.push(
          ...SORT_FIELDS.filter(f => ['risk_score', 'amount', 'priority'].includes(f.key))
        );
        break;
      default:
        suggestions.push(...SORT_FIELDS.slice(0, 3));
    }

    return suggestions.filter(s => s.sortable && !sortCriteria.some(c => c.field === s.key));
  }, [context, sortCriteria]);

  // Get icon for sort field
  const getSortIcon = useCallback((iconName: string) => {
    const icons: Record<string, JSX.Element> = {
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
      currency: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      shield: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      flag: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2h7a2 2 0 012 2v6a2 2 0 01-2 2h-7l-1-2H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      ),
      status: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      user: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      'user-circle': (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      hash: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      ),
      timer: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      progress: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      default: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
      alert: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      'sort-alpha': (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
      )
    };

    return icons[iconName] || icons.default;
  }, []);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Sort Presets */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            
            {/* Quick Sort Buttons */}
            {presets.filter(p => p.category === 'default' || p.category === 'common').slice(0, 4).map(preset => (
              <button
                key={preset.id}
                onClick={() => applySortPreset(preset)}
                className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium transition-colors ${
                  preset.id === 'default' && sortCriteria.length === 0
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{getSortIcon(preset.icon)}</span>
                {preset.name}
              </button>
            ))}

            {/* More Sorts Button */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="inline-flex items-center px-3 py-1 rounded text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                More
              </button>

              {/* Sort Menu */}
              {showSortMenu && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4">
                    {/* Additional Presets */}
                    {presets.filter(p => p.category === 'common').length > 4 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Sort Presets</h4>
                        <div className="space-y-1">
                          {presets.filter(p => p.category === 'common').slice(4).map(preset => (
                            <button
                              key={preset.id}
                              onClick={() => applySortPreset(preset)}
                              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                            >
                              <span className="mr-2">{getSortIcon(preset.icon)}</span>
                              <div className="flex-1 text-left">
                                <div className="font-medium">{preset.name}</div>
                                <div className="text-xs text-gray-500">{preset.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Available Sort Fields */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Add Sort Field</h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {availableSortFields.map(field => (
                          <button
                            key={field.key}
                            onClick={() => addSortCriterion(field)}
                            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            <span className="mr-2">{getSortIcon(field.icon || 'default')}</span>
                            <span className="flex-1 text-left">{field.label}</span>
                            <span className="text-xs text-gray-400 capitalize">{field.category}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clear Sort */}
          {sortCriteria.length > 0 && (
            <button
              onClick={clearAllSorting}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear sorting
            </button>
          )}
        </div>

        {/* Active Sort Criteria */}
        {sortCriteria.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sorting by:</span>
              <div className="flex items-center space-x-1">
                {sortCriteria.map((criterion, index) => {
                  const fieldConfig = getFieldConfig(criterion.field);
                  
                  return (
                    <div
                      key={criterion.id}
                      className="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 rounded text-sm"
                    >
                      {/* Drag Handle */}
                      {sortCriteria.length > 1 && (
                        <svg className="w-3 h-3 mr-1 text-blue-600 cursor-move" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      )}

                      {/* Priority Number */}
                      {sortCriteria.length > 1 && (
                        <span className="mr-1 text-xs bg-blue-200 text-blue-800 px-1 rounded">
                          {index + 1}
                        </span>
                      )}

                      {/* Field Icon */}
                      <span className="mr-1">{getSortIcon(fieldConfig?.icon || 'default')}</span>

                      {/* Field Label */}
                      <span className="mr-1">{criterion.label}</span>

                      {/* Direction Button */}
                      <button
                        onClick={() => updateSortDirection(
                          criterion.id,
                          criterion.direction === 'asc' ? 'desc' : 'asc'
                        )}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                        title={`Sort ${criterion.direction === 'asc' ? 'descending' : 'ascending'}`}
                      >
                        {criterion.direction === 'asc' ? (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        )}
                      </button>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeSortCriterion(criterion.id)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                        title="Remove sort"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Suggested Sorts */}
        {suggestedSorts.length > 0 && sortCriteria.length < maxCriteria && (
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-sm text-gray-500">Suggested:</span>
            {suggestedSorts.slice(0, 3).map(suggestion => (
              <button
                key={suggestion.key}
                onClick={() => addSortCriterion(suggestion)}
                className="inline-flex items-center px-2 py-1 rounded text-xs text-gray-600 border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              >
                <span className="mr-1">{getSortIcon(suggestion.icon || 'default')}</span>
                {suggestion.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Click outside handler */}
      {showSortMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSortMenu(false)}
        />
      )}
    </div>
  );
};