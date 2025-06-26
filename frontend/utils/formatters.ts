// Currency formatting for Ghana Cedi
export const formatCurrency = (amount: number, currency: string = 'GHS'): string => {
  try {
    // Handle edge cases
    if (isNaN(amount) || amount === null || amount === undefined) {
      return `${currency} 0.00`;
    }

    // Format large numbers with appropriate suffixes
    if (Math.abs(amount) >= 1e9) {
      return `${currency} ${(amount / 1e9).toFixed(1)}B`;
    }
    if (Math.abs(amount) >= 1e6) {
      return `${currency} ${(amount / 1e6).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1e3) {
      return `${currency} ${(amount / 1e3).toFixed(1)}K`;
    }

    // Standard formatting for smaller amounts
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount).replace(currency, `${currency} `);
  } catch (error) {
    // Fallback formatting
    return `${currency} ${amount.toFixed(2)}`;
  }
};

// Number formatting with thousand separators
export const formatNumber = (num: number): string => {
  try {
    if (isNaN(num) || num === null || num === undefined) {
      return '0';
    }

    // Format large numbers with suffixes
    if (Math.abs(num) >= 1e9) {
      return `${(num / 1e9).toFixed(1)}B`;
    }
    if (Math.abs(num) >= 1e6) {
      return `${(num / 1e6).toFixed(1)}M`;
    }
    if (Math.abs(num) >= 1e3) {
      return `${(num / 1e3).toFixed(1)}K`;
    }

    // Standard number formatting
    return new Intl.NumberFormat('en-GH').format(Math.round(num));
  } catch (error) {
    return num.toString();
  }
};

// Percentage formatting
export const formatPercentage = (value: number, decimals: number = 1): string => {
  try {
    if (isNaN(value) || value === null || value === undefined) {
      return '0.0%';
    }

    return `${value.toFixed(decimals)}%`;
  } catch (error) {
    return '0.0%';
  }
};

// Compact number formatting for large values
export const formatCompactNumber = (num: number): string => {
  try {
    if (isNaN(num) || num === null || num === undefined) {
      return '0';
    }

    return new Intl.NumberFormat('en-GH', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  } catch (error) {
    return formatNumber(num);
  }
};

// Date formatting for analytics
export const formatDate = (date: string | Date, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const options: Intl.DateTimeFormatOptions = {
      short: { month: 'short' as const, day: 'numeric' as const },
      medium: { month: 'short' as const, day: 'numeric' as const, year: 'numeric' as const },
      long: { weekday: 'long' as const, year: 'numeric' as const, month: 'long' as const, day: 'numeric' as const },
    }[format];

    return new Intl.DateTimeFormat('en-GH', options).format(dateObj);
  } catch (error) {
    return 'Invalid Date';
  }
};

// Time formatting
export const formatTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Time';
    }

    return new Intl.DateTimeFormat('en-GH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(dateObj);
  } catch (error) {
    return 'Invalid Time';
  }
};

// Relative time formatting (e.g., "2 hours ago")
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
  } catch (error) {
    return 'Unknown time';
  }
};

// Duration formatting (e.g., for session lengths)
export const formatDuration = (seconds: number): string => {
  try {
    if (isNaN(seconds) || seconds < 0) {
      return '0s';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  } catch (error) {
    return '0s';
  }
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  try {
    if (isNaN(bytes) || bytes === 0) {
      return '0 B';
    }

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);

    return `${size.toFixed(1)} ${sizes[i]}`;
  } catch (error) {
    return '0 B';
  }
};

// Phone number formatting for Ghana
export const formatPhoneNumber = (phone: string): string => {
  try {
    if (!phone) return '';

    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    // Handle Ghana phone numbers
    if (cleaned.startsWith('233')) {
      const number = cleaned.slice(3);
      return `+233 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`;
    }

    if (cleaned.startsWith('0')) {
      const number = cleaned.slice(1);
      return `+233 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`;
    }

    // Default formatting
    return `+233 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  } catch (error) {
    return phone;
  }
};

// ID number formatting (Ghana Card, etc.)
export const formatIdNumber = (id: string, type: 'ghana_card' | 'passport' | 'voter_id' | 'driver_license'): string => {
  try {
    if (!id) return '';

    switch (type) {
      case 'ghana_card':
        // Format: GHA-123456789-1
        const cleaned = id.replace(/\D/g, '');
        if (cleaned.length >= 10) {
          return `GHA-${cleaned.slice(0, 9)}-${cleaned.slice(9)}`;
        }
        return id;

      case 'passport':
        // Format: G1234567
        return id.toUpperCase();

      case 'voter_id':
        // Format: 12345678901
        return id.replace(/\D/g, '');

      case 'driver_license':
        // Format: DL-123456789
        return `DL-${id.replace(/\D/g, '')}`;

      default:
        return id;
    }
  } catch (error) {
    return id;
  }
};

// Trend indicator formatting
export const formatTrend = (value: number, showSign: boolean = true): {
  text: string;
  color: string;
  icon: '↑' | '↓' | '→';
} => {
  try {
    const absValue = Math.abs(value);
    const sign = showSign ? (value > 0 ? '+' : value < 0 ? '-' : '') : '';
    const text = `${sign}${formatPercentage(absValue)}`;

    if (value > 0) {
      return { text, color: 'text-green-600', icon: '↑' };
    }
    if (value < 0) {
      return { text, color: 'text-red-600', icon: '↓' };
    }
    return { text: '0.0%', color: 'text-gray-600', icon: '→' };
  } catch (error) {
    return { text: '0.0%', color: 'text-gray-600', icon: '→' };
  }
};

// Account number formatting
export const formatAccountNumber = (accountNumber: string): string => {
  try {
    if (!accountNumber) return '';

    // Format as: 1234-5678-9012
    const cleaned = accountNumber.replace(/\D/g, '');
    return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
  } catch (error) {
    return accountNumber;
  }
};

// Transaction reference formatting
export const formatTransactionRef = (ref: string): string => {
  try {
    if (!ref) return '';

    // Format as: TXN-20240129-ABCD1234
    if (ref.includes('-')) {
      return ref.toUpperCase();
    }

    // Add formatting if not present
    return `TXN-${ref.slice(0, 8)}-${ref.slice(8)}`.toUpperCase();
  } catch (error) {
    return ref;
  }
};

// Chart axis label formatting
export const formatAxisLabel = (value: number, type: 'currency' | 'number' | 'percentage'): string => {
  try {
    switch (type) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
      default:
        return formatCompactNumber(value);
    }
  } catch (error) {
    return value.toString();
  }
};

// Export filename formatting
export const formatExportFilename = (
  type: string,
  timeRange: string,
  format: string
): string => {
  try {
    const timestamp = new Date().toISOString().slice(0, 10);
    const cleanType = type.replace(/\s+/g, '_').toLowerCase();
    return `${cleanType}_${timeRange}_${timestamp}.${format}`;
  } catch (error) {
    return `export_${Date.now()}.${format}`;
  }
};

// Ghana region formatting
export const formatGhanaRegion = (region: string): string => {
  try {
    if (!region) return '';

    // Convert to proper case
    return region
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  } catch (error) {
    return region;
  }
};

// Default export for convenience
export default {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatCompactNumber,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatDuration,
  formatFileSize,
  formatPhoneNumber,
  formatIdNumber,
  formatTrend,
  formatAccountNumber,
  formatTransactionRef,
  formatAxisLabel,
  formatExportFilename,
  formatGhanaRegion,
};