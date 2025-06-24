import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig 
} from 'axios';
import { store } from '../store';
import { 
  refreshToken, 
  clearAuth 
} from '../store/slices/authSlice';
import { addNotification } from '../store/slices/uiSlice';
import { ApiResponse, ApiError, ApiConfig, RequestOptions } from './types/api.types';

// API Configuration
const API_CONFIG: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
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

// Request interceptor for authentication and logging
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const { token, isAuthenticated, companyId } = state.auth;
    
    // Don't attach auth for certain endpoints
    const skipAuth = (config as any).skipAuth;
    
    // Attach token if user is authenticated and not skipping auth
    if (isAuthenticated && token && !skipAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add company ID for multi-tenant requests
    if (companyId && !skipAuth) {
      config.headers['X-Company-ID'] = companyId;
    }
    
    // Add request timestamp for debugging
    config.headers['X-Request-Time'] = new Date().toISOString();
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId();
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
        params: config.params,
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
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const state = store.getState();
        const { refreshToken: refreshTokenValue } = state.auth;
        
        if (refreshTokenValue) {
          await store.dispatch(refreshToken());
          
          // Retry original request with new token
          const newState = store.getState();
          const { token } = newState.auth;
          
          if (token && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          }
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
    const skipNotification = (originalRequest as any)?.skipErrorNotification;
    if (!skipNotification && shouldShowErrorNotification(error)) {
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
      timestamp: new Date().toISOString(),
      path: error.config?.url,
    };
  } else if (error.request) {
    // Request made but no response received
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection.',
      details: { originalError: error.message },
      timestamp: new Date().toISOString(),
    };
  } else {
    // Something else happened
    return {
      code: 'REQUEST_ERROR',
      message: error.message || 'An unexpected error occurred.',
      details: { originalError: error.message },
      timestamp: new Date().toISOString(),
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
export const retryRequest = async (
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

// Utility functions
const generateRequestId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Enhanced API client with typed methods
export class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = apiClient;
  }

  // Generic request method
  async request<T>(config: AxiosRequestConfig & RequestOptions): Promise<ApiResponse<T>> {
    const { skipAuth, skipErrorNotification, onUploadProgress, ...axiosConfig } = config;
    
    // Add custom options to config for interceptor access
    (axiosConfig as any).skipAuth = skipAuth;
    (axiosConfig as any).skipErrorNotification = skipErrorNotification;
    
    const response = await this.client.request(axiosConfig);
    return response.data;
  }

  // GET request
  async get<T>(url: string, params?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const { skipAuth, skipErrorNotification, onUploadProgress, ...restOptions } = options || {};
    
    const config: AxiosRequestConfig = {
      params,
      timeout: restOptions.timeout,
    };
    
    // Add custom options for interceptor access
    (config as any).skipAuth = skipAuth;
    (config as any).skipErrorNotification = skipErrorNotification;
    
    const response = await this.client.get(url, config);
    return response.data;
  }

  // POST request
  async post<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const { skipAuth, skipErrorNotification, onUploadProgress, ...restOptions } = options || {};
    
    const config: AxiosRequestConfig = {
      timeout: restOptions.timeout,
      onUploadProgress: onUploadProgress ? (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        }
      } : undefined,
    };
    
    // Add custom options for interceptor access
    (config as any).skipAuth = skipAuth;
    (config as any).skipErrorNotification = skipErrorNotification;
    
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  // PUT request
  async put<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const { skipAuth, skipErrorNotification, onUploadProgress, ...restOptions } = options || {};
    
    const config: AxiosRequestConfig = {
      timeout: restOptions.timeout,
      onUploadProgress: onUploadProgress ? (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        }
      } : undefined,
    };
    
    // Add custom options for interceptor access
    (config as any).skipAuth = skipAuth;
    (config as any).skipErrorNotification = skipErrorNotification;
    
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  // PATCH request
  async patch<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const { skipAuth, skipErrorNotification, onUploadProgress, ...restOptions } = options || {};
    
    const config: AxiosRequestConfig = {
      timeout: restOptions.timeout,
      onUploadProgress: onUploadProgress ? (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        }
      } : undefined,
    };
    
    // Add custom options for interceptor access
    (config as any).skipAuth = skipAuth;
    (config as any).skipErrorNotification = skipErrorNotification;
    
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  // DELETE request
  async delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const { skipAuth, skipErrorNotification, onUploadProgress, ...restOptions } = options || {};
    
    const config: AxiosRequestConfig = {
      timeout: restOptions.timeout,
    };
    
    // Add custom options for interceptor access
    (config as any).skipAuth = skipAuth;
    (config as any).skipErrorNotification = skipErrorNotification;
    
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // File upload with progress
  async uploadFile<T>(
    url: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post(url, formData, {
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

// Export the default client instance and a new ApiClient class
export default apiClient;
export const api = new ApiClient();