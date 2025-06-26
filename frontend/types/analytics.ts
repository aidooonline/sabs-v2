// Analytics Time Range Types
export type AnalyticsTimeRange = '24h' | '7d' | '30d' | '90d' | '1y' | 'custom';

// Analytics Filter Types
export interface AnalyticsFilters {
  region?: string;
  customerType?: 'individual' | 'business';
  accountType?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  ageGroup?: string;
  transactionType?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Analytics Query Interface
export interface AnalyticsQuery {
  timeRange: AnalyticsTimeRange;
  filters: AnalyticsFilters;
}

// Core Analytics Data
export interface AnalyticsData {
  // Customer Metrics
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  customerGrowthRate: number;
  churnRate: number;
  
  // Transaction Metrics
  totalTransactions: number;
  transactionVolume: number;
  averageTransactionValue: number;
  transactionGrowthRate: number;
  
  // Revenue Metrics
  revenueGrowthRate: number;
  
  // Chart Data
  customerGrowthData: ChartDataPoint[];
  transactionVolumeData: ChartDataPoint[];
  regionalData: RegionalDataPoint[];
  transactionTypeData: TransactionTypeDataPoint[];
  
  // Time Series Data
  timeSeriesData: TimeSeriesDataPoint[];
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  color?: string;
}

export interface RegionalDataPoint {
  region: string;
  customerCount: number;
  transactionVolume: number;
  percentage: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TransactionTypeDataPoint {
  type: string;
  count: number;
  volume: number;
  percentage: number;
  color: string;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  customers: number;
  transactions: number;
  volume: number;
}

// Real-time Metrics
export interface RealtimeMetrics {
  activeUsers: number;
  pendingTransactions: number;
  systemStatus: 'operational' | 'degraded' | 'down';
  lastTransactionTime: string;
  currentLoad: number;
  responseTime: number;
  uptime: number;
  
  // Live counters
  counters: {
    newCustomersToday: number;
    transactionsToday: number;
    volumeToday: number;
  };
  
  // System health
  systemHealth: {
    database: 'healthy' | 'warning' | 'error';
    api: 'healthy' | 'warning' | 'error';
    websocket: 'healthy' | 'warning' | 'error';
    payment: 'healthy' | 'warning' | 'error';
  };
}

// Metric Card Types
export interface MetricCardProps {
  title: string;
  value: number;
  formatter: (value: number) => string;
  trend?: number;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  isLoading?: boolean;
  subtitle?: string;
}

// Chart Container Types
export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  icon?: React.ComponentType<any>;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

// Customer Growth Chart Data
export interface CustomerGrowthData {
  dates: string[];
  newCustomers: number[];
  totalCustomers: number[];
  activeCustomers: number[];
  churnedCustomers: number[];
}

// Transaction Volume Chart Data
export interface TransactionVolumeData {
  dates: string[];
  deposits: number[];
  withdrawals: number[];
  transfers: number[];
  totalVolume: number[];
}

// Regional Distribution Data
export interface RegionalDistributionData {
  regions: RegionalDataPoint[];
  totalCustomers: number;
  totalVolume: number;
}

// Activity Feed Types
export interface ActivityFeedItem {
  id: string;
  type: 'customer_registration' | 'transaction' | 'system_alert' | 'security_event';
  title: string;
  description: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  icon: string;
  data?: Record<string, any>;
}

// Export Types
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  timeRange: AnalyticsTimeRange;
  filters: AnalyticsFilters;
  includeCharts: boolean;
  sections: string[];
}

// Dashboard Configuration
export interface DashboardConfig {
  refreshInterval: number;
  autoRefresh: boolean;
  defaultTimeRange: AnalyticsTimeRange;
  visibleMetrics: string[];
  chartTypes: Record<string, 'line' | 'bar' | 'pie' | 'area'>;
}

// Ghana-specific Analytics
export interface GhanaRegionalData {
  region: string;
  regionCode: string;
  customerCount: number;
  transactionVolume: number;
  averageBalance: number;
  topTransactionType: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Performance Metrics
export interface PerformanceMetrics {
  averageResponseTime: number;
  transactionSuccessRate: number;
  systemUptime: number;
  peakConcurrentUsers: number;
  errorRate: number;
  throughput: number;
}

// Risk Analytics
export interface RiskAnalytics {
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  fraudDetections: number;
  suspiciousTransactions: number;
  riskTrends: ChartDataPoint[];
}

// API Response Types
export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
  metadata: {
    generatedAt: string;
    timeRange: AnalyticsTimeRange;
    filters: AnalyticsFilters;
    totalRecords: number;
  };
}

export interface RealtimeMetricsResponse {
  success: boolean;
  data: RealtimeMetrics;
  timestamp: string;
}

// Comparison Analytics
export interface ComparisonData {
  current: AnalyticsData;
  previous: AnalyticsData;
  percentageChange: Record<string, number>;
  significantChanges: {
    metric: string;
    change: number;
    significance: 'positive' | 'negative' | 'neutral';
  }[];
}

// Forecasting Data
export interface ForecastData {
  metric: string;
  historical: ChartDataPoint[];
  forecast: ChartDataPoint[];
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

// Customer Segmentation Analytics
export interface CustomerSegmentation {
  segments: {
    name: string;
    count: number;
    percentage: number;
    averageValue: number;
    characteristics: string[];
  }[];
  totalCustomers: number;
}

// Transaction Analytics
export interface TransactionAnalytics {
  byType: TransactionTypeDataPoint[];
  byHour: ChartDataPoint[];
  byDay: ChartDataPoint[];
  byWeek: ChartDataPoint[];
  successRate: number;
  averageProcessingTime: number;
  peakHour: string;
  totalVolume: number;
  volumeGrowthRate: number;
  totalTransactions: number;
  transactionGrowthRate: number;
  failureRate: number;
  volumeTrend: number;
  transactionTrend: number;
  volumeData: ChartDataPoint[];
  heatmapData: any;
  trends: {
    deposits: number;
    withdrawals: number;
    transfers: number;
  };
}

export default AnalyticsData;