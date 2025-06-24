# Story 1.4: Implement Central API Client (Axios) - Sabs v2 Frontend

## 📋 Story Overview

**Epic**: Phase 1 - Project Setup & Core Services  
**Story ID**: FRONTEND-1.4  
**Story Title**: Implement Central API Client (Axios)  
**Story Points**: 8  
**Priority**: High  
**Status**: Ready for Development

---

## 👤 User Story

**As a** Frontend Developer  
**I want to** implement a centralized Axios API client with authentication, error handling, and automatic token management  
**So that** all API communications are standardized, secure, and properly integrated with the Redux state management system

---

## 🎯 Acceptance Criteria

### ✅ **AC 1: Centralized Axios Configuration**
- [ ] Create centralized Axios instance with base configuration
- [ ] Set up proper TypeScript interfaces for API responses
- [ ] Implement request/response interceptors for authentication
- [ ] Configure proper timeout and retry mechanisms
- [ ] Set up environment-based API URL configuration

### ✅ **AC 2: Authentication Integration**
- [ ] Automatic JWT token attachment to requests
- [ ] Token refresh handling for expired tokens
- [ ] Automatic logout on authentication failures
- [ ] Session management integration with Redux state
- [ ] Proper handling of authentication redirects

### ✅ **AC 3: Error Handling System**
- [ ] Global error handling with proper error types
- [ ] Network error handling and retry logic
- [ ] User-friendly error messages and notifications
- [ ] Error logging and reporting system
- [ ] Proper error state management in Redux

### ✅ **AC 4: Service Layer Implementation**
- [ ] Feature-based service organization (auth, customers, users, etc.)
- [ ] Standardized service interfaces and methods
- [ ] Proper TypeScript typing for all API calls
- [ ] Request/response data transformation
- [ ] Caching integration with TanStack Query

### ✅ **AC 5: Development and Testing Support**
- [ ] Mock API client for testing environments
- [ ] Request/response logging in development
- [ ] API monitoring and performance tracking
- [ ] Proper error simulation for testing
- [ ] Integration with existing backend services

---

## 🏗️ Technical Implementation Guidelines

### **Core API Client Setup**

#### **Base API Client (`services/apiClient.ts`)**
```typescript
import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig 
} from 'axios';
import { store } from '@/store';
import { 
  refreshToken, 
  clearAuth, 
  selectAuth 
} from '@/store/slices/authSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { ApiResponse, ApiError } from './types/api.types';

// API Configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const { token, isAuthenticated } = selectAuth(state);
    
    // Attach token if user is authenticated
    if (isAuthenticated && token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add company ID for multi-tenant requests
    const { companyId } = selectAuth(state);
    if (companyId) {
      config.headers['X-Company-ID'] = companyId;
    }
    
    // Add request timestamp for debugging
    config.headers['X-Request-Time'] = new Date().toISOString();
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        await store.dispatch(refreshToken());
        
        // Retry original request with new token
        const state = store.getState();
        const { token } = selectAuth(state);
        
        if (token && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        store.dispatch(clearAuth());
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other error types
    const apiError = handleApiError(error);
    
    // Show user notification for certain errors
    if (shouldShowErrorNotification(error)) {
      store.dispatch(addNotification({
        type: 'error',
        message: apiError.message,
        duration: 5000,
      }));
    }
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        message: apiError.message,
        data: error.response?.data,
      });
    }
    
    return Promise.reject(apiError);
  }
);

// Error handling utilities
const handleApiError = (error: AxiosError): ApiError => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data as any;
    
    return {
      code: data?.code || `HTTP_${status}`,
      message: data?.message || getDefaultErrorMessage(status),
      details: data?.details || {},
      status,
    };
  } else if (error.request) {
    // Request made but no response received
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection.',
      details: { originalError: error.message },
    };
  } else {
    // Something else happened
    return {
      code: 'REQUEST_ERROR',
      message: error.message || 'An unexpected error occurred.',
      details: { originalError: error.message },
    };
  }
};

const getDefaultErrorMessage = (status: number): string => {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication required. Please log in.';
    case 403:
      return 'Access denied. You don\'t have permission.';
    case 404:
      return 'Resource not found.';
    case 409:
      return 'Conflict. The resource already exists.';
    case 422:
      return 'Validation error. Please check your input.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred.';
  }
};

const shouldShowErrorNotification = (error: AxiosError): boolean => {
  // Don't show notifications for certain endpoints or error types
  const url = error.config?.url || '';
  const status = error.response?.status;
  
  // Don't show notifications for:
  // - Token refresh failures (handled separately)
  // - 404 errors on optional resources
  // - Validation errors (handled by forms)
  if (
    url.includes('/auth/refresh') ||
    (status === 404 && url.includes('/optional/')) ||
    status === 422
  ) {
    return false;
  }
  
  return true;
};

// Retry mechanism with exponential backoff
const retryRequest = async (
  config: AxiosRequestConfig,
  retryCount: number = 0
): Promise<AxiosResponse> => {
  try {
    return await apiClient(config);
  } catch (error) {
    if (retryCount < API_CONFIG.retries && isRetryableError(error as AxiosError)) {
      const delay = API_CONFIG.retryDelay * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(config, retryCount + 1);
    }
    throw error;
  }
};

const isRetryableError = (error: AxiosError): boolean => {
  // Retry on network errors or 5xx server errors
  return !error.response || (error.response.status >= 500 && error.response.status < 600);
};

export default apiClient;
export { retryRequest };
```

#### **API Types (`services/types/api.types.ts`)**
```typescript
// Base API response structure
export interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
  timestamp?: string;
  requestId?: string;
}

// Paginated response structure
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

// API error structure
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  status?: number;
  timestamp?: string;
  path?: string;
}

// Request parameters for pagination and filtering
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Generic filter parameters
export interface FilterParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  category?: string;
  [key: string]: any;
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
```

### **Service Layer Implementation**

#### **Base Service Class (`services/base/BaseService.ts`)**
```typescript
import apiClient from '../apiClient';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../types/api.types';

export abstract class BaseService {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Generic GET request
  protected async get<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.get(`${this.baseUrl}${endpoint}`, { params });
    return response.data;
  }

  // Generic POST request
  protected async post<T>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.post(`${this.baseUrl}${endpoint}`, data);
    return response.data;
  }

  // Generic PUT request
  protected async put<T>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.put(`${this.baseUrl}${endpoint}`, data);
    return response.data;
  }

  // Generic PATCH request
  protected async patch<T>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.patch(`${this.baseUrl}${endpoint}`, data);
    return response.data;
  }

  // Generic DELETE request
  protected async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await apiClient.delete(`${this.baseUrl}${endpoint}`);
    return response.data;
  }

  // Paginated GET request
  protected async getPaginated<T>(
    endpoint: string,
    params?: PaginationParams & Record<string, any>
  ): Promise<PaginatedResponse<T>> {
    const response = await apiClient.get(`${this.baseUrl}${endpoint}`, { params });
    return response.data;
  }

  // File upload
  protected async uploadFile(
    endpoint: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`${this.baseUrl}${endpoint}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }
}
```

#### **Authentication Service (`services/api/authService.ts`)**
```typescript
import { BaseService } from '../base/BaseService';
import { 
  LoginCredentials, 
  AuthResponse, 
  RefreshTokenResponse,
  User,
  ChangePasswordRequest,
  ResetPasswordRequest,
  MfaVerificationRequest
} from '../types/auth.types';

class AuthService extends BaseService {
  constructor() {
    super('/auth');
  }

  // User login
  async login(credentials: LoginCredentials) {
    return this.post<AuthResponse>('/login', credentials);
  }

  // User logout
  async logout() {
    return this.post<void>('/logout');
  }

  // Refresh access token
  async refreshToken() {
    return this.post<RefreshTokenResponse>('/refresh');
  }

  // Get current user profile
  async getProfile() {
    return this.get<User>('/profile');
  }

  // Update user profile
  async updateProfile(data: Partial<User>) {
    return this.put<User>('/profile', data);
  }

  // Change password
  async changePassword(data: ChangePasswordRequest) {
    return this.post<void>('/change-password', data);
  }

  // Request password reset
  async requestPasswordReset(email: string) {
    return this.post<void>('/forgot-password', { email });
  }

  // Reset password with token
  async resetPassword(data: ResetPasswordRequest) {
    return this.post<void>('/reset-password', data);
  }

  // Enable MFA
  async enableMfa() {
    return this.post<{ qrCode: string; secret: string }>('/mfa/enable');
  }

  // Verify MFA setup
  async verifyMfa(data: MfaVerificationRequest) {
    return this.post<void>('/mfa/verify', data);
  }

  // Disable MFA
  async disableMfa(data: MfaVerificationRequest) {
    return this.post<void>('/mfa/disable', data);
  }

  // Check session validity
  async checkSession() {
    return this.get<{ valid: boolean }>('/session');
  }
}

export const authService = new AuthService();
```

#### **Customer Service (`services/api/customerService.ts`)**
```typescript
import { BaseService } from '../base/BaseService';
import { 
  Customer, 
  CreateCustomerRequest, 
  UpdateCustomerRequest,
  CustomerSearchFilters 
} from '../types/customer.types';
import { PaginationParams } from '../types/api.types';

class CustomerService extends BaseService {
  constructor() {
    super('/customers');
  }

  // Get all customers with pagination and filters
  async getCustomers(params?: PaginationParams & CustomerSearchFilters) {
    return this.getPaginated<Customer>('', params);
  }

  // Get customer by ID
  async getCustomer(id: string) {
    return this.get<Customer>(`/${id}`);
  }

  // Create new customer
  async createCustomer(data: CreateCustomerRequest) {
    return this.post<Customer>('', data);
  }

  // Update customer
  async updateCustomer(id: string, data: UpdateCustomerRequest) {
    return this.put<Customer>(`/${id}`, data);
  }

  // Delete customer
  async deleteCustomer(id: string) {
    return this.delete<void>(`/${id}`);
  }

  // Search customers
  async searchCustomers(query: string, filters?: CustomerSearchFilters) {
    return this.get<Customer[]>('/search', { query, ...filters });
  }

  // Get customer accounts
  async getCustomerAccounts(customerId: string) {
    return this.get<any[]>(`/${customerId}/accounts`);
  }

  // Get customer transactions
  async getCustomerTransactions(customerId: string, params?: PaginationParams) {
    return this.getPaginated<any>(`/${customerId}/transactions`, params);
  }

  // Upload customer documents
  async uploadDocument(
    customerId: string,
    file: File,
    documentType: string,
    onProgress?: (progress: number) => void
  ) {
    return this.uploadFile(`/${customerId}/documents?type=${documentType}`, file, onProgress);
  }
}

export const customerService = new CustomerService();
```

### **TanStack Query Integration**

#### **Query Client Setup (`lib/queryClient.ts`)**
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});
```

#### **React Query Hooks (`hooks/api/useCustomers.ts`)**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/api/customerService';
import { useUI } from '../useUI';
import { PaginationParams } from '@/services/types/api.types';
import { Customer, CreateCustomerRequest, CustomerSearchFilters } from '@/services/types/customer.types';

// Query keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: PaginationParams & CustomerSearchFilters) => 
    [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

// Get customers with pagination
export const useCustomers = (params?: PaginationParams & CustomerSearchFilters) => {
  return useQuery({
    queryKey: customerKeys.list(params || {}),
    queryFn: () => customerService.getCustomers(params),
    keepPreviousData: true,
  });
};

// Get single customer
export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerService.getCustomer(id),
    enabled: !!id,
  });
};

// Create customer mutation
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useUI();

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => customerService.createCustomer(data),
    onSuccess: (response) => {
      // Invalidate customers list
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      
      showNotification('success', 'Customer created successfully');
    },
    onError: (error: any) => {
      showNotification('error', error.message || 'Failed to create customer');
    },
  });
};

// Update customer mutation
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useUI();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerRequest }) =>
      customerService.updateCustomer(id, data),
    onSuccess: (response, { id }) => {
      // Update cached customer data
      queryClient.setQueryData(customerKeys.detail(id), response);
      
      // Invalidate customers list
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      
      showNotification('success', 'Customer updated successfully');
    },
    onError: (error: any) => {
      showNotification('error', error.message || 'Failed to update customer');
    },
  });
};
```

---

## 🧪 Testing Implementation

### **API Client Tests (`services/__tests__/apiClient.test.ts`)**
```typescript
import axios from 'axios';
import apiClient from '../apiClient';
import { store } from '@/store';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should attach authorization header when user is authenticated', () => {
    // Mock authenticated state
    const mockState = {
      auth: {
        isAuthenticated: true,
        token: 'test-token',
        companyId: 'test-company',
      },
    };
    
    // Test request interceptor logic
    // Implementation depends on your testing setup
  });

  it('should handle 401 errors and attempt token refresh', async () => {
    // Test token refresh logic
  });

  it('should retry requests on network errors', async () => {
    // Test retry mechanism
  });
});
```

### **Service Tests (`services/api/__tests__/customerService.test.ts`)**
```typescript
import { customerService } from '../customerService';
import apiClient from '../../apiClient';

// Mock API client
jest.mock('../../apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Customer Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch customers with pagination', async () => {
    const mockResponse = {
      data: {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      },
    };

    mockedApiClient.get.mockResolvedValue(mockResponse);

    const result = await customerService.getCustomers({ page: 1, limit: 10 });
    
    expect(mockedApiClient.get).toHaveBeenCalledWith('/customers', {
      params: { page: 1, limit: 10 },
    });
    expect(result).toEqual(mockResponse.data);
  });
});
```

---

## 📝 Definition of Done

### **API Client Configuration**
- [ ] Centralized Axios instance with proper configuration
- [ ] Request/response interceptors implemented
- [ ] Authentication token management
- [ ] Error handling with proper error types
- [ ] Retry mechanism with exponential backoff

### **Service Layer**
- [ ] Base service class with common functionality
- [ ] Feature-specific service implementations
- [ ] Proper TypeScript typing throughout
- [ ] TanStack Query integration
- [ ] File upload capabilities

### **Error Handling**
- [ ] Global error handling system
- [ ] User-friendly error messages
- [ ] Error logging and monitoring
- [ ] Network error handling
- [ ] Authentication error handling

### **Testing**
- [ ] Unit tests for API client
- [ ] Service layer tests
- [ ] Mock implementations for testing
- [ ] Integration tests with Redux
- [ ] Error scenario testing

---

## 🔗 Dependencies

**Previous Stories:**
- ✅ Story 1.1: Initialize Next.js Project
- ✅ Story 1.2: Implement Defined Directory Structure
- ✅ Story 1.3: Configure Global State (Redux) with sessionSlice

**Next Stories:**
- Story 2.1: Build Foundational "Atom" Components (Button, Input, Card)

---

## 📈 Success Metrics

- [ ] **API Performance**: Average response time <500ms
- [ ] **Error Handling**: 99% of errors properly handled and logged
- [ ] **Authentication**: Token refresh success rate >95%
- [ ] **Developer Experience**: Type safety and autocomplete working
- [ ] **Test Coverage**: >90% coverage on API client and services

---

**Story Status**: ✅ **READY FOR DEVELOPMENT**

*This story establishes a robust, centralized API client system that provides secure, typed, and reliable communication between the frontend and backend services, with comprehensive error handling and state management integration.*