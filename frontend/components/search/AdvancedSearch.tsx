'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { useSearchWorkflowsMutation } from '../../store/api/approvalApi';

interface SearchCriteria {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
  value: string | number | boolean | string[] | number[] | null;
  logic: 'AND' | 'OR';
}

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  criteria: SearchCriteria[];
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  shared: boolean;
  tags: string[];
  usage_count: number;
}

interface SearchField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'boolean' | 'user' | 'amount';
  options?: { value: string; label: string }[];
  operators: string[];
  searchable: boolean;
  filterable: boolean;
}

interface AdvancedSearchProps {
  onSearch: (criteria: SearchCriteria[], query: string) => void;
  onClear: () => void;
  loading?: boolean;
  resultCount?: number;
  defaultCriteria?: SearchCriteria[];
  maxCriteria?: number;
}

const SEARCH_FIELDS: SearchField[] = [
  {
    key: 'workflow_id',
    label: 'Workflow ID',
    type: 'text',
    operators: ['equals', 'contains', 'starts_with'],
    searchable: true,
    filterable: true
  },
  {
    key: 'customer_name',
    label: 'Customer Name',
    type: 'text',
    operators: ['equals', 'contains', 'starts_with'],
    searchable: true,
    filterable: true
  },
  {
    key: 'amount',
    label: 'Amount',
    type: 'amount',
    operators: ['equals', 'greater_than', 'less_than', 'between'],
    searchable: false,
    filterable: true
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'in_review', label: 'In Review' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'escalated', label: 'Escalated' }
    ],
    operators: ['equals', 'in', 'not_in'],
    searchable: false,
    filterable: true
  },
  {
    key: 'risk_level',
    label: 'Risk Level',
    type: 'select',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'critical', label: 'Critical' }
    ],
    operators: ['equals', 'in', 'not_in'],
    searchable: false,
    filterable: true
  },
  {
    key: 'assigned_to',
    label: 'Assigned To',
    type: 'user',
    operators: ['equals', 'in', 'not_in', 'is_null'],
    searchable: true,
    filterable: true
  },
  {
    key: 'created_at',
    label: 'Created Date',
    type: 'date',
    operators: ['equals', 'greater_than', 'less_than', 'between'],
    searchable: false,
    filterable: true
  },
  {
    key: 'sla_deadline',
    label: 'SLA Deadline',
    type: 'date',
    operators: ['equals', 'greater_than', 'less_than', 'between'],
    searchable: false,
    filterable: true
  },
  {
    key: 'priority',
    label: 'Priority',
    type: 'select',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' }
    ],
    operators: ['equals', 'in', 'not_in'],
    searchable: false,
    filterable: true
  },
  {
    key: 'has_flags',
    label: 'Has Compliance Flags',
    type: 'boolean',
    operators: ['equals'],
    searchable: false,
    filterable: true
  }
];

const OPERATOR_LABELS = {
  equals: 'Equals',
  contains: 'Contains',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
  greater_than: 'Greater than',
  less_than: 'Less than',
  between: 'Between',
  in: 'In',
  not_in: 'Not in',
  is_null: 'Is empty',
  is_not_null: 'Is not empty'
};

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onClear,
  loading = false,
  resultCount,
  defaultCriteria = [],
  maxCriteria = 10
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria[]>(defaultCriteria);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedSavedSearch, setSelectedSavedSearch] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // const [searchWorkflows, { isLoading: searchLoading }] = useSearchWorkflowsMutation();
  const searchLoading = false; // Placeholder until API hook is implemented

  // Initialize with saved searches
  useEffect(() => {
    loadSavedSearches();
    loadSearchHistory();
  }, []);

  // Load saved searches from localStorage/API
  const loadSavedSearches = useCallback(() => {
    try {
      const saved = localStorage.getItem('approval_saved_searches');
      if (saved) {
        setSavedSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  }, []);

  // Load search history
  const loadSearchHistory = useCallback(() => {
    try {
      const history = localStorage.getItem('approval_search_history');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Add search criterion
  const addCriterion = useCallback(() => {
    if (searchCriteria.length >= maxCriteria) return;

    const newCriterion: SearchCriteria = {
      id: `criteria_${Date.now()}`,
      field: SEARCH_FIELDS[0].key,
      operator: 'equals',
      value: '',
      logic: 'AND'
    };

    setSearchCriteria(prev => [...prev, newCriterion]);
  }, [searchCriteria.length, maxCriteria]);

  // Remove search criterion
  const removeCriterion = useCallback((id: string) => {
    setSearchCriteria(prev => prev.filter(c => c.id !== id));
  }, []);

  // Update search criterion
  const updateCriterion = useCallback((id: string, updates: Partial<SearchCriteria>) => {
    setSearchCriteria(prev => 
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  }, []);

  // Execute search
  const executeSearch = useCallback(() => {
    // Add to search history
    if (quickSearchQuery.trim()) {
      const newHistory = [quickSearchQuery, ...searchHistory.filter(h => h !== quickSearchQuery)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('approval_search_history', JSON.stringify(newHistory));
    }

    onSearch(searchCriteria, quickSearchQuery);
  }, [searchCriteria, quickSearchQuery, onSearch, searchHistory]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuickSearchQuery('');
    setSearchCriteria([]);
    setSelectedSavedSearch('');
    onClear();
  }, [onClear]);

  // Save current search
  const saveCurrentSearch = useCallback((name: string, description?: string) => {
    const newSavedSearch: SavedSearch = {
      id: `saved_${Date.now()}`,
      name,
      description,
      criteria: searchCriteria,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
      shared: false,
      tags: [],
      usage_count: 1
    };

    const updatedSavedSearches = [...savedSearches, newSavedSearch];
    setSavedSearches(updatedSavedSearches);
    localStorage.setItem('approval_saved_searches', JSON.stringify(updatedSavedSearches));
    setShowSaveDialog(false);
  }, [searchCriteria, savedSearches]);

  // Load saved search
  const loadSavedSearch = useCallback((searchId: string) => {
    const saved = savedSearches.find(s => s.id === searchId);
    if (saved) {
      setSearchCriteria(saved.criteria);
      setSelectedSavedSearch(searchId);
      
      // Update usage count
      const updatedSavedSearches = savedSearches.map(s => 
        s.id === searchId ? { ...s, usage_count: s.usage_count + 1 } : s
      );
      setSavedSearches(updatedSavedSearches);
      localStorage.setItem('approval_saved_searches', JSON.stringify(updatedSavedSearches));
    }
  }, [savedSearches]);

  // Delete saved search
  const deleteSavedSearch = useCallback((searchId: string) => {
    const updatedSavedSearches = savedSearches.filter(s => s.id !== searchId);
    setSavedSearches(updatedSavedSearches);
    localStorage.setItem('approval_saved_searches', JSON.stringify(updatedSavedSearches));
    
    if (selectedSavedSearch === searchId) {
      setSelectedSavedSearch('');
    }
  }, [savedSearches, selectedSavedSearch]);

  // Get field configuration
  const getFieldConfig = useCallback((fieldKey: string) => {
    return SEARCH_FIELDS.find(f => f.key === fieldKey) || SEARCH_FIELDS[0];
  }, []);

  // Render criterion value input
  const renderValueInput = useCallback((criterion: SearchCriteria, fieldConfig: SearchField) => {
    const updateValue = (value: any) => {
      updateCriterion(criterion.id, { value });
    };

    switch (fieldConfig.type) {
      case 'text':
        return (
          <input
            type="text"
            value={criterion.value as string || ''}
            onChange={(e) => updateValue(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
          />
        );

      case 'number':
      case 'amount':
        return (
          <input
            type="number"
            value={criterion.value as number || ''}
            onChange={(e) => updateValue(parseFloat(e.target.value) || 0)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="0"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={criterion.value as string || ''}
            onChange={(e) => updateValue(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        );

      case 'select':
        if (criterion.operator === 'in' || criterion.operator === 'not_in') {
          return (
            <select
              multiple
              value={criterion.value as string[] || []}
              onChange={(e) => updateValue(Array.from(e.target.selectedOptions, option => option.value))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {fieldConfig.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        } else {
          return (
            <select
              value={criterion.value as string || ''}
              onChange={(e) => updateValue(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select {fieldConfig.label}</option>
              {fieldConfig.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        }

      case 'boolean':
        return (
          <select
            value={criterion.value as string || ''}
            onChange={(e) => updateValue(e.target.value === 'true')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Select value</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );

      default:
        return null;
    }
  }, [updateCriterion]);

  // Check if search is valid
  const isSearchValid = useMemo(() => {
    return quickSearchQuery.trim().length > 0 || 
           searchCriteria.some(c => c.value !== '' && c.value !== null);
  }, [quickSearchQuery, searchCriteria]);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Quick Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={quickSearchQuery}
              onChange={(e) => setQuickSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Quick search workflows..."
            />
            
            {/* Search History Dropdown */}
            {searchHistory.length > 0 && quickSearchQuery === '' && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200">
                <div className="py-1">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Searches</div>
                  {searchHistory.slice(0, 5).map((query, index) => (
                    <button
                      key={index}
                      onClick={() => setQuickSearchQuery(query)}
                      className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            onClick={executeSearch}
            disabled={!isSearchValid || loading || searchLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {(loading || searchLoading) ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            Search
          </button>

          {/* Clear Button */}
          <button
            onClick={clearSearch}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear
          </button>

          {/* Advanced Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Advanced
            <svg className={`ml-2 h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Result Count */}
        {resultCount !== undefined && (
          <div className="mt-2 text-sm text-gray-600">
            {resultCount} {resultCount === 1 ? 'result' : 'results'} found
          </div>
        )}
      </div>

      {/* Advanced Search Panel */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Saved Searches */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">Saved Searches:</label>
              <select
                value={selectedSavedSearch}
                onChange={(e) => e.target.value ? loadSavedSearch(e.target.value) : setSelectedSavedSearch('')}
                className="text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a saved search</option>
                {savedSearches.map(search => (
                  <option key={search.id} value={search.id}>
                    {search.name} ({search.usage_count} uses)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={searchCriteria.length === 0}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              >
                Save Current Search
              </button>
              {selectedSavedSearch && (
                <button
                  onClick={() => deleteSavedSearch(selectedSavedSearch)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Search Criteria */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Search Criteria:</label>
              <button
                onClick={addCriterion}
                disabled={searchCriteria.length >= maxCriteria}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Criterion
              </button>
            </div>

            {searchCriteria.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="mt-2 text-sm">No search criteria added yet</p>
                <p className="text-xs">Click &quot;Add Criterion&quot; to build advanced search filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchCriteria.map((criterion, index) => {
                  const fieldConfig = getFieldConfig(criterion.field);
                  
                  return (
                    <div key={criterion.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      {/* Logic Operator */}
                      {index > 0 && (
                        <select
                          value={criterion.logic}
                          onChange={(e) => updateCriterion(criterion.id, { logic: e.target.value as 'AND' | 'OR' })}
                          className="w-16 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      )}

                      {/* Field Selector */}
                      <select
                        value={criterion.field}
                        onChange={(e) => updateCriterion(criterion.id, { 
                          field: e.target.value,
                          operator: SEARCH_FIELDS.find(f => f.key === e.target.value)?.operators[0] as any || 'equals',
                          value: ''
                        })}
                        className="w-40 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      >
                        {SEARCH_FIELDS.map(field => (
                          <option key={field.key} value={field.key}>
                            {field.label}
                          </option>
                        ))}
                      </select>

                      {/* Operator Selector */}
                      <select
                        value={criterion.operator}
                        onChange={(e) => updateCriterion(criterion.id, { operator: e.target.value as any, value: '' })}
                        className="w-32 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      >
                        {fieldConfig.operators.map(op => (
                          <option key={op} value={op}>
                            {OPERATOR_LABELS[op as keyof typeof OPERATOR_LABELS]}
                          </option>
                        ))}
                      </select>

                      {/* Value Input */}
                      {criterion.operator !== 'is_null' && criterion.operator !== 'is_not_null' && (
                        <div className="flex-1">
                          {renderValueInput(criterion, fieldConfig)}
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={() => removeCriterion(criterion.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">Save Search</h3>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    id="searchName"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter search name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                  <textarea
                    id="searchDescription"
                    rows={2}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter description"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-5">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const nameInput = document.getElementById('searchName') as HTMLInputElement;
                    const descInput = document.getElementById('searchDescription') as HTMLTextAreaElement;
                    if (nameInput.value.trim()) {
                      saveCurrentSearch(nameInput.value.trim(), descInput.value.trim() || undefined);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};