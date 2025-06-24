import { api } from '../apiClient';
import { ApiResponse, PaginatedResponse, PaginationParams, RequestOptions } from '../types/api.types';

export abstract class BaseService {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Generic GET request
  protected async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return api.get<T>(`${this.baseUrl}${endpoint}`, params, options);
  }

  // Generic POST request
  protected async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return api.post<T>(`${this.baseUrl}${endpoint}`, data, options);
  }

  // Generic PUT request
  protected async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return api.put<T>(`${this.baseUrl}${endpoint}`, data, options);
  }

  // Generic PATCH request
  protected async patch<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return api.patch<T>(`${this.baseUrl}${endpoint}`, data, options);
  }

  // Generic DELETE request
  protected async delete<T>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return api.delete<T>(`${this.baseUrl}${endpoint}`, options);
  }

  // Paginated GET request
  protected async getPaginated<T>(
    endpoint: string,
    params?: PaginationParams & Record<string, any>,
    options?: RequestOptions
  ): Promise<PaginatedResponse<T>> {
    const response = await api.get<PaginatedResponse<T>>(`${this.baseUrl}${endpoint}`, params, options);
    return response.data;
  }

  // File upload with progress tracking
  protected async uploadFile<T>(
    endpoint: string,
    file: File,
    onProgress?: (progress: number) => void,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return api.uploadFile<T>(`${this.baseUrl}${endpoint}`, file, onProgress);
  }

  // Bulk operations
  protected async bulkCreate<T>(
    endpoint: string,
    items: any[],
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return api.post<T>(`${this.baseUrl}${endpoint}/bulk`, { items }, options);
  }

  protected async bulkUpdate<T>(
    endpoint: string,
    updates: Array<{ id: string; data: any }>,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return api.put<T>(`${this.baseUrl}${endpoint}/bulk`, { updates }, options);
  }

  protected async bulkDelete<T>(
    endpoint: string,
    ids: string[],
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return api.delete<T>(`${this.baseUrl}${endpoint}/bulk`, {
      ...options,
      data: { ids }
    } as any);
  }

  // Search functionality
  protected async search<T>(
    endpoint: string,
    query: string,
    filters?: Record<string, any>,
    options?: RequestOptions
  ): Promise<ApiResponse<T[]>> {
    return api.get<T[]>(`${this.baseUrl}${endpoint}/search`, {
      query,
      ...filters
    }, options);
  }

  // Health check for service
  protected async healthCheck(options?: RequestOptions): Promise<ApiResponse<{ status: string }>> {
    return api.get<{ status: string }>(`${this.baseUrl}/health`, undefined, options);
  }
}