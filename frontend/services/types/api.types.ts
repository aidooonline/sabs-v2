// Base API response structure
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp?: string;
}

// Error response structure
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
  stack?: string;
}

// Pagination parameters
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Request status for tracking async operations
export interface RequestStatus {
  loading: boolean;
  error: string | null;
  lastUpdated?: string;
}

// Filter parameters for list endpoints
export interface FilterParams {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  [key: string]: any;
}

// Common ID parameters
export interface IdParams {
  id: string;
}

// Bulk operation parameters
export interface BulkActionParams {
  ids: string[];
  action: string;
  data?: Record<string, any>;
}

// Upload file parameters
export interface FileUploadParams {
  file: File;
  category?: string;
  metadata?: Record<string, any>;
}