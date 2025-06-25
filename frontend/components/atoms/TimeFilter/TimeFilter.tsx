import React, { useState, useEffect } from 'react';
import { cn } from '../../../utils/helpers';
import { Button } from '../Button';
import { Input } from '../Input';

export interface TimeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  presets?: TimeFilterPreset[];
  className?: string;
  disabled?: boolean;
  showCompare?: boolean;
  onCompareChange?: (compare: boolean) => void;
  compareValue?: TimeRange;
  onCompareRangeChange?: (range: TimeRange) => void;
}

export interface TimeRange {
  startDate: Date;
  endDate: Date;
  label?: string;
}

export interface TimeFilterPreset {
  label: string;
  value: TimeRange;
  key: string;
}

// Calendar Icon SVG
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

// Chevron Down Icon SVG
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const DEFAULT_PRESETS: TimeFilterPreset[] = [
  {
    key: 'today',
    label: 'Today',
    value: {
      startDate: new Date(),
      endDate: new Date(),
    },
  },
  {
    key: 'yesterday',
    label: 'Yesterday',
    value: {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  },
  {
    key: 'thisWeek',
    label: 'This Week',
    value: {
      startDate: (() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek;
        return new Date(now.setDate(diff));
      })(),
      endDate: new Date(),
    },
  },
  {
    key: 'lastWeek',
    label: 'Last Week',
    value: {
      startDate: (() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek - 7;
        return new Date(now.setDate(diff));
      })(),
      endDate: (() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek - 1;
        return new Date(now.setDate(diff));
      })(),
    },
  },
  {
    key: 'thisMonth',
    label: 'This Month',
    value: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(),
    },
  },
  {
    key: 'lastMonth',
    label: 'Last Month',
    value: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
    },
  },
  {
    key: 'thisQuarter',
    label: 'This Quarter',
    value: {
      startDate: (() => {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      })(),
      endDate: new Date(),
    },
  },
  {
    key: 'lastQuarter',
    label: 'Last Quarter',
    value: {
      startDate: (() => {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3) - 1;
        const year = quarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
        const adjustedQuarter = quarter < 0 ? 3 : quarter;
        return new Date(year, adjustedQuarter * 3, 1);
      })(),
      endDate: (() => {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 0);
      })(),
    },
  },
  {
    key: 'thisYear',
    label: 'This Year',
    value: {
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(),
    },
  },
  {
    key: 'lastYear',
    label: 'Last Year',
    value: {
      startDate: new Date(new Date().getFullYear() - 1, 0, 1),
      endDate: new Date(new Date().getFullYear() - 1, 11, 31),
    },
  },
];

export const TimeFilter: React.FC<TimeFilterProps> = ({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  className,
  disabled = false,
  showCompare = false,
  onCompareChange,
  compareValue,
  onCompareRangeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(
    value.startDate.toISOString().split('T')[0]
  );
  const [tempEndDate, setTempEndDate] = useState(
    value.endDate.toISOString().split('T')[0]
  );

  useEffect(() => {
    setTempStartDate(value.startDate.toISOString().split('T')[0]);
    setTempEndDate(value.endDate.toISOString().split('T')[0]);
  }, [value]);

  const formatDateRange = (range: TimeRange): string => {
    if (range.label) return range.label;
    
    const start = range.startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: range.startDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
    
    const end = range.endDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: range.endDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
    
    if (start === end) return start;
    return `${start} - ${end}`;
  };

  const handlePresetSelect = (preset: TimeFilterPreset) => {
    onChange({ ...preset.value, label: preset.label });
    setIsOpen(false);
    setCustomMode(false);
  };

  const handleCustomApply = () => {
    const startDate = new Date(tempStartDate);
    const endDate = new Date(tempEndDate);
    
    if (startDate <= endDate) {
      onChange({
        startDate,
        endDate,
        label: 'Custom Range',
      });
      setIsOpen(false);
      setCustomMode(false);
    }
  };

  const handleCompareToggle = () => {
    const newCompareMode = !compareMode;
    setCompareMode(newCompareMode);
    onCompareChange?.(newCompareMode);
    
    if (newCompareMode && !compareValue) {
      // Default to previous period
      const diffTime = value.endDate.getTime() - value.startDate.getTime();
      onCompareRangeChange?.({
        startDate: new Date(value.startDate.getTime() - diffTime),
        endDate: new Date(value.startDate.getTime() - 1),
        label: 'Previous Period',
      });
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="min-w-[200px] justify-between"
        rightIcon={<ChevronDownIcon className="h-4 w-4" />}
        leftIcon={<CalendarIcon className="h-4 w-4" />}
      >
        {formatDateRange(value)}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            {/* Preset Options */}
            {!customMode && (
              <div className="space-y-1">
                <h4 className="font-medium text-sm text-gray-900 mb-2">Quick Select</h4>
                {presets.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => handlePresetSelect(preset)}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  onClick={() => setCustomMode(true)}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors text-primary-600"
                >
                  Custom Range...
                </button>
              </div>
            )}

            {/* Custom Date Selection */}
            {customMode && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-gray-900">Custom Range</h4>
                  <button
                    onClick={() => setCustomMode(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Back
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      max={tempEndDate}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      min={tempStartDate}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCustomApply}
                    disabled={!tempStartDate || !tempEndDate}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCustomMode(false);
                      setTempStartDate(value.startDate.toISOString().split('T')[0]);
                      setTempEndDate(value.endDate.toISOString().split('T')[0]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Compare Toggle */}
            {showCompare && !customMode && (
              <div className="border-t border-gray-200 pt-3 mt-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={compareMode}
                    onChange={handleCompareToggle}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Compare to previous period</span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TimeFilter;