'use client';

import React, { useState } from 'react';
import type { ApprovalWorkflowQuery } from '../../../../types/approval';

interface QueueFiltersProps {
  filters: ApprovalWorkflowQuery;
  onFilterChange: (filters: Partial<ApprovalWorkflowQuery>) => void;
  workflowCount: number;
}

export const QueueFilters: React.FC<QueueFiltersProps> = ({
  filters,
  onFilterChange,
  workflowCount
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchTerm || undefined });
  };

  const handleFilterUpdate = (key: keyof ApprovalWorkflowQuery, value: any) => {
    onFilterChange({ [key]: value });
  };

  const clearFilters = () => {
    setSearchTerm('');
    onFilterChange({
      status: ['pending'],
      priority: undefined,
      riskLevel: undefined,
      assignedTo: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      amountMin: undefined,
      amountMax: undefined,
      search: undefined,
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    });
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'escalated', label: 'Escalated' },
    { value: 'on_hold', label: 'On Hold' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const riskLevelOptions = [
    { value: 'low', label: 'Low Risk' },
    { value: 'medium', label: 'Medium Risk' },
    { value: 'high', label: 'High Risk' },
    { value: 'very_high', label: 'Very High Risk' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'priority', label: 'Priority' },
    { value: 'amount', label: 'Amount' },
    { value: 'riskScore', label: 'Risk Score' },
    { value: 'slaDeadline', label: 'SLA Deadline' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Filter Workflows ({workflowCount} results)
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            {showAdvanced ? 'Simple View' : 'Advanced Filters'}
          </button>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-16 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Search by workflow number, customer name, agent..."
            data-testid="search-input"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              type="submit"
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            multiple
            value={filters.status || []}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              handleFilterUpdate('status', values);
            }}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            size={3}
            data-testid="status-filter"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            value={filters.priority || ''}
            onChange={(e) => handleFilterUpdate('priority', e.target.value || undefined)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Priorities</option>
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Risk Level Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Risk Level
          </label>
          <select
            value={filters.riskLevel || ''}
            onChange={(e) => handleFilterUpdate('riskLevel', e.target.value || undefined)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Risk Levels</option>
            {riskLevelOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <div className="flex space-x-2">
            <select
              value={filters.sortBy || 'createdAt'}
              onChange={(e) => handleFilterUpdate('sortBy', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              data-testid="sort-dropdown"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleFilterUpdate('sortOrder', filters.sortOrder === 'ASC' ? 'DESC' : 'ASC')}
              className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {filters.sortOrder === 'ASC' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
                         <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Date Range
               </label>
               <div className="grid grid-cols-2 gap-2">
                 <input
                   type="date"
                   value={filters.dateFrom || ''}
                   onChange={(e) => handleFilterUpdate('dateFrom', e.target.value || undefined)}
                   className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                 />
                 <input
                   type="date"
                   value={filters.dateTo || ''}
                   onChange={(e) => handleFilterUpdate('dateTo', e.target.value || undefined)}
                   className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                 />
               </div>
             </div>

                         {/* Amount Range */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Amount Range (GHS)
               </label>
               <div className="grid grid-cols-2 gap-2">
                 <input
                   type="number"
                   placeholder="Min"
                   value={filters.amountMin || ''}
                   onChange={(e) => handleFilterUpdate('amountMin', parseFloat(e.target.value) || undefined)}
                   className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                 />
                 <input
                   type="number"
                   placeholder="Max"
                   value={filters.amountMax || ''}
                   onChange={(e) => handleFilterUpdate('amountMax', parseFloat(e.target.value) || undefined)}
                   className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                 />
               </div>
             </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To
              </label>
              <input
                type="text"
                placeholder="Enter approver name or ID"
                value={filters.assignedTo || ''}
                onChange={(e) => handleFilterUpdate('assignedTo', e.target.value || undefined)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>

          {/* Quick Filter Buttons */}
                     <div className="mt-4 pt-4 border-t border-gray-100">
             <div className="flex flex-wrap gap-2">
               <button
                 onClick={() => {
                   const today = new Date().toISOString().split('T')[0];
                   onFilterChange({ dateFrom: today, dateTo: today });
                 }}
                 className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
               >
                 Today
               </button>
               
               <button
                 onClick={() => {
                   const yesterday = new Date();
                   yesterday.setDate(yesterday.getDate() - 1);
                   const dateStr = yesterday.toISOString().split('T')[0];
                   onFilterChange({ dateFrom: dateStr, dateTo: dateStr });
                 }}
                 className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
               >
                 Yesterday
               </button>
               
               <button
                 onClick={() => {
                   const weekAgo = new Date();
                   weekAgo.setDate(weekAgo.getDate() - 7);
                   onFilterChange({ 
                     dateFrom: weekAgo.toISOString().split('T')[0],
                     dateTo: new Date().toISOString().split('T')[0]
                   });
                 }}
                 className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                 data-testid="date-filter-button"
               >
                 Last 7 Days
               </button>
               
               <button
                 onClick={() => handleFilterUpdate('priority', 'urgent')}
                 className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
               >
                 Urgent Only
               </button>
               
               <button
                 onClick={() => handleFilterUpdate('riskLevel', 'high')}
                 className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
               >
                 High Risk
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};