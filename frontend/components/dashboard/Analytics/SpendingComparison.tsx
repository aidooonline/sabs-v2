'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface CategoryComparison {
  category: string;
  current: number;
  previous: number;
  change: number;
}

interface MonthComparisonData {
  currentMonth: {
    name: string;
    total: number;
    categories: CategoryComparison[];
  };
  previousMonth: {
    name: string;
    total: number;
  };
  change: number;
}

interface SpendingComparisonProps {
  data: MonthComparisonData;
  isLoading?: boolean;
  onCategoryFilter?: (category: string) => void;
}

export const SpendingComparison: React.FC<SpendingComparisonProps> = ({
  data,
  isLoading = false,
  onCategoryFilter,
}) => {
  const [view, setView] = useState<'categories' | 'summary'>('categories');
  const [sortBy, setSortBy] = useState<'amount' | 'change'>('change');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTooltipCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Prepare chart data
  const chartData = data.currentMonth.categories.map(category => ({
    category: category.category.split(' ')[0], // Shorten for chart
    fullCategory: category.category,
    current: category.current,
    previous: category.previous,
    change: category.change,
    changeAmount: category.current - category.previous,
  }));

  // Sort data based on selected criteria
  const sortedData = [...chartData].sort((a, b) => {
    if (sortBy === 'amount') {
      return b.current - a.current;
    } else {
      return Math.abs(b.change) - Math.abs(a.change);
    }
  });

  const totalChange = data.change;
  const totalChangeAmount = data.currentMonth.total - data.previousMonth.total;
  
  // Calculate insights
  const increasedCategories = data.currentMonth.categories.filter(cat => cat.change > 0);
  const decreasedCategories = data.currentMonth.categories.filter(cat => cat.change < 0);
  const biggestIncrease = data.currentMonth.categories.reduce((max, cat) => 
    cat.change > max.change ? cat : max
  );
  const biggestDecrease = data.currentMonth.categories.reduce((min, cat) => 
    cat.change < min.change ? cat : min
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{dataPoint.fullCategory}</p>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This month:</span>
              <span className="font-medium text-gray-900">
                {formatTooltipCurrency(dataPoint.current)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last month:</span>
              <span className="font-medium text-gray-900">
                {formatTooltipCurrency(dataPoint.previous)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 pt-1">
              <span className="text-sm text-gray-600">Change:</span>
              <span className={`font-medium ${
                dataPoint.change >= 0 ? 'text-danger-600' : 'text-success-600'
              }`}>
                {dataPoint.change >= 0 ? '+' : ''}{dataPoint.change.toFixed(1)}%
                <span className="text-gray-500 text-xs ml-1">
                  ({dataPoint.changeAmount >= 0 ? '+' : ''}{formatTooltipCurrency(Math.abs(dataPoint.changeAmount))})
                </span>
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (change: number) => {
    if (change > 20) return '#EF4444'; // High increase - red
    if (change > 0) return '#F59E0B'; // Increase - orange
    if (change > -20) return '#10B981'; // Small decrease - green
    return '#059669'; // Large decrease - dark green
  };

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div className="skeleton h-6 w-64"></div>
          <div className="skeleton h-8 w-32"></div>
        </div>
        
        {/* Summary skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="skeleton h-8 w-24 mx-auto mb-2"></div>
              <div className="skeleton h-4 w-32 mx-auto"></div>
            </div>
          ))}
        </div>
        
        <div className="h-80 skeleton"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Month-over-Month Comparison</h3>
          <p className="text-sm text-gray-600">
            {data.currentMonth.name} vs {data.previousMonth.name}
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-3">
          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'amount' | 'change')}
            className="text-sm border-gray-300 rounded-md focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="change">Sort by Change</option>
            <option value="amount">Sort by Amount</option>
          </select>
          
          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('categories')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                view === 'categories'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Categories
            </button>
            <button
              onClick={() => setView('summary')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                view === 'summary'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📈 Summary
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(data.currentMonth.total)}
          </div>
          <div className="text-sm text-gray-600">{data.currentMonth.name}</div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className={`text-2xl font-bold ${
            totalChange >= 0 ? 'text-danger-600' : 'text-success-600'
          }`}>
            {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Monthly Change</div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className={`text-2xl font-bold ${
            totalChangeAmount >= 0 ? 'text-danger-600' : 'text-success-600'
          }`}>
            {formatCurrency(Math.abs(totalChangeAmount))}
          </div>
          <div className="text-sm text-gray-600">
            {totalChangeAmount >= 0 ? 'Increase' : 'Decrease'}
          </div>
        </div>
      </div>

      {view === 'categories' ? (
        <>
          {/* Chart */}
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Bar 
                  dataKey="current" 
                  name="This Month"
                  fill="#3B82F6"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="previous" 
                  name="Last Month"
                  fill="#9CA3AF"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category List */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Category Details</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {sortedData.map((category, index) => (
                <div
                  key={category.fullCategory}
                  onClick={() => onCategoryFilter?.(category.fullCategory)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: getBarColor(category.change) }}
                    ></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {category.fullCategory}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(category.current)} this month
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      category.change >= 0 ? 'text-danger-600' : 'text-success-600'
                    }`}>
                      {category.change >= 0 ? '+' : ''}{category.change.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {category.changeAmount >= 0 ? '+' : ''}{formatCurrency(Math.abs(category.changeAmount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Summary View */
        <div className="space-y-6">
          {/* Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">📈 Increased Spending</h4>
              {increasedCategories.length > 0 ? (
                <div className="space-y-2">
                  {increasedCategories.slice(0, 3).map(cat => (
                    <div key={cat.category} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="text-sm text-gray-700">{cat.category}</span>
                      <span className="text-sm font-medium text-danger-600">
                        +{cat.change.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                  {increasedCategories.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{increasedCategories.length - 3} more categories increased
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No categories increased spending</p>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">📉 Decreased Spending</h4>
              {decreasedCategories.length > 0 ? (
                <div className="space-y-2">
                  {decreasedCategories.slice(0, 3).map(cat => (
                    <div key={cat.category} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm text-gray-700">{cat.category}</span>
                      <span className="text-sm font-medium text-success-600">
                        {cat.change.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                  {decreasedCategories.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{decreasedCategories.length - 3} more categories decreased
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No categories decreased spending</p>
              )}
            </div>
          </div>

          {/* Notable Changes */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Notable Changes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <h5 className="text-sm font-medium text-danger-900 mb-2">Biggest Increase</h5>
                <p className="text-sm text-gray-700">{biggestIncrease.category}</p>
                <p className="text-lg font-bold text-danger-600">
                  +{biggestIncrease.change.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600">
                  {formatCurrency(biggestIncrease.current)} this month
                </p>
              </div>

              {biggestDecrease.change < 0 && (
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <h5 className="text-sm font-medium text-success-900 mb-2">Biggest Decrease</h5>
                  <p className="text-sm text-gray-700">{biggestDecrease.category}</p>
                  <p className="text-lg font-bold text-success-600">
                    {biggestDecrease.change.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatCurrency(biggestDecrease.current)} this month
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {onCategoryFilter && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Click any category to filter and view details
            </span>
            <button
              onClick={() => onCategoryFilter('All Categories')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View All Categories
            </button>
          </div>
        </div>
      )}
    </div>
  );
};