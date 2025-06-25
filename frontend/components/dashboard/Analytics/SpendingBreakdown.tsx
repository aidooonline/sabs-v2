'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SpendingCategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface SpendingBreakdownProps {
  data: SpendingCategoryData[];
  isLoading?: boolean;
  onCategoryClick?: (category: string) => void;
  selectedCategory?: string;
  timePeriod?: string;
}

export const SpendingBreakdown: React.FC<SpendingBreakdownProps> = ({
  data,
  isLoading = false,
  onCategoryClick,
  selectedCategory = 'All Categories',
  timePeriod = '30d',
}) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

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

  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  const handleCategoryClick = (categoryData: any) => {
    if (onCategoryClick) {
      const category = categoryData.category || categoryData.payload?.category;
      if (category) {
        onCategoryClick(category);
      }
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.category}</p>
          <p className="text-sm text-gray-600">
            Amount: <span className="font-medium text-gray-900">{formatTooltipCurrency(data.amount)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-medium text-gray-900">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent * 100 < 5) return null; // Don't show labels for small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div className="skeleton h-6 w-40"></div>
          <div className="skeleton h-8 w-24"></div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="skeleton h-64 w-64 rounded-full"></div>
        </div>
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="skeleton h-4 w-4 rounded"></div>
                <div className="skeleton h-4 w-24"></div>
              </div>
              <div className="skeleton h-4 w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Spending Breakdown</h3>
          <p className="text-sm text-gray-600">
            By category • {timePeriod === '30d' ? 'Last 30 days' : timePeriod}
          </p>
        </div>
        
        {/* Chart Type Toggle */}
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setChartType('pie')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              chartType === 'pie'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Pie
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              chartType === 'bar'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📈 Bar
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomPieLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="amount"
                onClick={handleCategoryClick}
                className="cursor-pointer"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={selectedCategory === entry.category ? '#374151' : 'none'}
                    strokeWidth={selectedCategory === entry.category ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : (
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="amount" 
                onClick={handleCategoryClick}
                className="cursor-pointer"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={selectedCategory === entry.category ? '#374151' : 'none'}
                    strokeWidth={selectedCategory === entry.category ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Category Legend */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Categories ({data.length}) • Total: {formatCurrency(totalAmount)}
        </h4>
        
        <div className="grid grid-cols-1 gap-2">
          {data.map((category, index) => (
            <div
              key={category.category}
              onClick={() => handleCategoryClick(category)}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                selectedCategory === category.category
                  ? 'border-primary-200 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: category.color }}
                ></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {category.category}
                  </p>
                  <p className="text-xs text-gray-500">
                    {category.percentage}% of total
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(category.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      {onCategoryClick && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedCategory === 'All Categories' 
                ? 'Click a category to view details' 
                : `Viewing: ${selectedCategory}`
              }
            </span>
            {selectedCategory !== 'All Categories' && (
              <button
                onClick={() => onCategoryClick('All Categories')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All Categories
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};