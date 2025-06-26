export interface Report {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  generatedBy: string;
  size?: number;
  downloadCount?: number;
  config: ReportConfig;
  data?: any;
  filePath?: string;
  error?: string;
}

export interface ReportConfig {
  dateRange: {
    start: string;
    end: string;
  };
  filters: Record<string, any>;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts: boolean;
  includeSummary: boolean;
  sections: string[];
}

export interface ScheduledReport {
  id: string;
  reportId: string;
  name: string;
  schedule: {
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour: number;
    minute: number;
    timezone: string;
  };
  active: boolean;
  nextRun: string;
  lastRun?: string;
  lastStatus?: 'success' | 'failed';
  recipients: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportFilters {
  type?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  generatedBy?: string;
  search?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  config: ReportConfig;
  fields: ReportField[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportField {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ReportMetrics {
  totalReports: number;
  recentReports: number;
  scheduledActive: number;
  totalDownloads: number;
  generationTime: number;
  successRate: number;
}

export interface ReportExport {
  reportId: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  options: {
    includeCharts: boolean;
    includeSummary: boolean;
    pageSize?: 'A4' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
  };
}

export interface ReportBuilderState {
  selectedType: string;
  config: Partial<ReportConfig>;
  fields: Record<string, any>;
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ReportAnalytics {
  generationTrends: {
    date: string;
    count: number;
    avgTime: number;
  }[];
  typeDistribution: {
    type: string;
    count: number;
    percentage: number;
  }[];
  userActivity: {
    userId: string;
    userName: string;
    reportCount: number;
    lastGenerated: string;
  }[];
  performanceMetrics: {
    avgGenerationTime: number;
    successRate: number;
    errorRate: number;
    peakHours: number[];
  };
}