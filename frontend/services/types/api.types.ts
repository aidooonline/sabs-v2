// Base API response structure
export interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
  timestamp?: string;
  requestId?: string;
}

// Error response structure
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  status?: number;
  timestamp?: string;
  path?: string;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message: string;
  success: boolean;
}

// Request status for tracking async operations
export interface RequestStatus {
  loading: boolean;
  error: string | null;
  lastUpdated?: string;
}

// Filter parameters for list endpoints
export interface FilterParams {
  startDate?: string;
  endDate?: string;
  status?: string;
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

// File upload response
export interface FileUploadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
}

// Bulk operation response
export interface BulkOperationResponse {
  successful: number;
  failed: number;
  total: number;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

// API Configuration
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

// Request options
export interface RequestOptions {
  skipAuth?: boolean;
  skipErrorNotification?: boolean;
  timeout?: number;
  retries?: number;
  onUploadProgress?: (progress: number) => void;
}