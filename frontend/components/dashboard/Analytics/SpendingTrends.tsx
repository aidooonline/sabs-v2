'use client';

import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface SpendingTrendData {
  month: string;
  amount: number;
  budget: number;
  year: number;
}

interface SpendingTrendsProps {
  data: SpendingTrendData[];
  isLoading?: boolean;
  timePeriod?: string;
  onPeriodChange?: (period: string) => void;
}

export const SpendingTrends: React.FC<SpendingTrendsProps> = ({
  data,
  isLoading = false,
  timePeriod = '12m',
  onPeriodChange,
}) => {
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  const [showBudget, setShowBudget] = useState(true);

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

  // Calculate trend metrics
  const currentMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  const averageSpending = data.reduce((sum, item) => sum + item.amount, 0) / data.length;
  const totalSpending = data.reduce((sum, item) => sum + item.amount, 0);
  const totalBudget = data.reduce((sum, item) => sum + item.budget, 0);
  const budgetUtilization = (totalSpending / totalBudget) * 100;
  
  const monthlyChange = previousMonth 
    ? ((currentMonth.amount - previousMonth.amount) / previousMonth.amount) * 100
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label} {payload[0]?.payload?.year}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600">{entry.name}:</span>
              </div>
              <span className="font-medium text-gray-900">
                {formatTooltipCurrency(entry.value)}
              </span>
            </div>
          ))}
          {payload[0]?.payload && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Budget Usage:</span>
                <span>
                  {((payload[0].payload.amount / payload[0].payload.budget) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const getDotColor = (entry: any) => {
    const usage = (entry.amount / entry.budget) * 100;
    if (usage > 100) return '#EF4444'; // Red for over budget
    if (usage > 80) return '#F59E0B'; // Yellow for close to budget
    return '#10B981'; // Green for under budget
  };

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div className="skeleton h-6 w-48"></div>
          <div className="skeleton h-8 w-32"></div>
        </div>
        
        {/* Trend metrics skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="skeleton h-6 w-16 mx-auto mb-1"></div>
              <div className="skeleton h-3 w-20 mx-auto"></div>
            </div>
          ))}
        </div>
        
        <div className="h-80 flex items-center justify-center">
          <div className="skeleton h-full w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Spending Trends</h3>
          <p className="text-sm text-gray-600">
            Monthly spending over time • {timePeriod === '12m' ? 'Last 12 months' : timePeriod}
          </p>
        </div>
        
        {/* Chart Controls */}
        <div className="flex items-center space-x-3">
          {/* Chart Type Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                chartType === 'line'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📈 Line
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                chartType === 'area'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Area
            </button>
          </div>
          
          {/* Budget Toggle */}
          <button
            onClick={() => setShowBudget(!showBudget)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              showBudget
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            {showBudget ? '👁️ Budget' : '👁️‍🗨️ Budget'}
          </button>
        </div>
      </div>

      {/* Trend Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(currentMonth?.amount || 0)}
          </div>
          <div className="text-xs text-gray-500">Current Month</div>
        </div>
        
        <div className="text-center">
          <div className={`text-xl font-bold ${
            monthlyChange >= 0 ? 'text-danger-600' : 'text-success-600'
          }`}>
            {monthlyChange >= 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Monthly Change</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(averageSpending)}
          </div>
          <div className="text-xs text-gray-500">Average Monthly</div>
        </div>
        
        <div className="text-center">
          <div className={`text-xl font-bold ${
            budgetUtilization > 100 ? 'text-danger-600' : 
            budgetUtilization > 80 ? 'text-warning-600' : 'text-success-600'
          }`}>
            {budgetUtilization.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">Budget Used</div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-80 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {showBudget && (
                <Line
                  type="monotone"
                  dataKey="budget"
                  stroke="#6B7280"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name="Budget"
                  dot={false}
                />
              )}
              
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3B82F6"
                strokeWidth={3}
                name="Spending"
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6, fill: '#1D4ED8' }}
              />
            </LineChart>
          ) : (
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {showBudget && (
                <Line
                  type="monotone"
                  dataKey="budget"
                  stroke="#6B7280"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name="Budget"
                  dot={false}
                />
              )}
              
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3B82F6"
                fill="url(#colorSpending)"
                strokeWidth={2}
                name="Spending"
              />
              
              <defs>
                <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Legend and Insights */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600">Actual Spending</span>
            </div>
            {showBudget && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-1 bg-gray-500" style={{ borderTop: '2px dashed #6B7280' }}></div>
                <span className="text-gray-600">Budget Line</span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            {data.length > 0 && (
              <>
                {data[0].month} {data[0].year} - {data[data.length - 1].month} {data[data.length - 1].year}
              </>
            )}
          </div>
        </div>
        
        {/* Quick Insights */}
        <div className="mt-3 text-xs text-gray-600">
          <div className="flex flex-wrap gap-4">
            <span>
              💡 {monthlyChange > 0 ? 'Spending increased' : 'Spending decreased'} by {Math.abs(monthlyChange).toFixed(1)}% this month
            </span>
            {budgetUtilization > 100 && (
              <span className="text-danger-600">
                ⚠️ Over budget by {(budgetUtilization - 100).toFixed(1)}%
              </span>
            )}
            {budgetUtilization <= 80 && (
              <span className="text-success-600">
                ✅ Well under budget ({(100 - budgetUtilization).toFixed(1)}% remaining)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};