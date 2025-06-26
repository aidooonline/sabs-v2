'use client';

interface SearchQuery {
  query: string;
  filters: Record<string, any>;
  sort: Array<{ field: string; direction: 'asc' | 'desc' }>;
  page: number;
  limit: number;
}

interface SearchResult {
  data: any[];
  total: number;
  page: number;
  limit: number;
  filters: Record<string, any>;
  timestamp: number;
  executionTime: number;
}

interface CacheEntry {
  result: SearchResult;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface SearchIndex {
  field: string;
  values: Map<string, Set<string>>;
  metadata: {
    totalEntries: number;
    lastUpdated: number;
    memoryUsage: number;
  };
}

interface PerformanceMetrics {
  averageQueryTime: number;
  cacheHitRate: number;
  totalQueries: number;
  slowQueries: Array<{
    query: SearchQuery;
    executionTime: number;
    timestamp: number;
  }>;
  memoryUsage: {
    cache: number;
    indexes: number;
    total: number;
  };
}

class SearchOptimizationService {
  private cache: Map<string, CacheEntry> = new Map();
  private indexes: Map<string, SearchIndex> = new Map();
  private queryHistory: Array<{ query: SearchQuery; executionTime: number; timestamp: number }> = [];
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private performanceMetrics: PerformanceMetrics = {
    averageQueryTime: 0,
    cacheHitRate: 0,
    totalQueries: 0,
    slowQueries: [],
    memoryUsage: { cache: 0, indexes: 0, total: 0 }
  };

  // Configuration
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private readonly DEBOUNCE_DELAY = 300; // milliseconds
  private readonly SLOW_QUERY_THRESHOLD = 1000; // milliseconds
  private readonly MAX_SLOW_QUERIES = 50;

  constructor() {
    this.initializeIndexes();
    this.startCleanupTimer();
    this.monitorMemoryUsage();
  }

  // Initialize search indexes
  private initializeIndexes(): void {
    const indexableFields = [
      'customer_name',
      'workflow_id',
      'status',
      'assigned_to',
      'risk_level',
      'priority'
    ];

    indexableFields.forEach(field => {
      this.indexes.set(field, {
        field,
        values: new Map(),
        metadata: {
          totalEntries: 0,
          lastUpdated: Date.now(),
          memoryUsage: 0
        }
      });
    });
  }

  // Generate cache key from search query
  private generateCacheKey(query: SearchQuery): string {
    const normalized = {
      query: query.query.toLowerCase().trim(),
      filters: this.normalizeFilters(query.filters),
      sort: query.sort,
      page: query.page,
      limit: query.limit
    };

    return btoa(JSON.stringify(normalized)).replace(/[/+=]/g, '');
  }

  // Normalize filters for consistent caching
  private normalizeFilters(filters: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    
    Object.keys(filters).sort().forEach(key => {
      const value = filters[key];
      if (Array.isArray(value)) {
        normalized[key] = [...value].sort();
      } else if (typeof value === 'object' && value !== null) {
        normalized[key] = this.normalizeFilters(value);
      } else {
        normalized[key] = value;
      }
    });

    return normalized;
  }

  // Debounced search execution
  public debouncedSearch(
    searchId: string,
    query: SearchQuery,
    searchFunction: (query: SearchQuery) => Promise<SearchResult>
  ): Promise<SearchResult> {
    return new Promise((resolve, reject) => {
      // Clear existing timer for this search ID
      const existingTimer = this.debounceTimers.get(searchId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        try {
          const result = await this.optimizedSearch(query, searchFunction);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.debounceTimers.delete(searchId);
        }
      }, this.DEBOUNCE_DELAY);

      this.debounceTimers.set(searchId, timer);
    });
  }

  // Optimized search with caching and indexing
  public async optimizedSearch(
    query: SearchQuery,
    searchFunction: (query: SearchQuery) => Promise<SearchResult>
  ): Promise<SearchResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(query);

    // Check cache first
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      this.updatePerformanceMetrics(Date.now() - startTime, true);
      return cachedResult;
    }

    try {
      // Check if we can use indexes for filtering
      const indexOptimizedQuery = this.applyIndexOptimization(query);
      
      // Execute search
      const result = await searchFunction(indexOptimizedQuery);
      
      // Calculate execution time
      const executionTime = Date.now() - startTime;
      result.executionTime = executionTime;

      // Cache the result
      this.addToCache(cacheKey, result);

      // Update indexes with new data
      this.updateIndexes(result.data);

      // Track performance
      this.updatePerformanceMetrics(executionTime, false);
      this.trackSlowQueries(query, executionTime);

      return result;

    } catch (error) {
      console.error('Search optimization error:', error);
      throw error;
    }
  }

  // Apply index-based optimizations
  private applyIndexOptimization(query: SearchQuery): SearchQuery {
    const optimizedQuery = { ...query };

    // If query is simple text search, try to use indexes
    if (query.query && !Object.keys(query.filters).length) {
      const potentialMatches = this.searchIndexes(query.query);
      if (potentialMatches.size > 0 && potentialMatches.size < 1000) {
        // Use index results as filter
        optimizedQuery.filters = {
          ...optimizedQuery.filters,
          workflow_ids: Array.from(potentialMatches)
        };
        optimizedQuery.query = ''; // Clear text query since we're using indexed results
      }
    }

    return optimizedQuery;
  }

  // Search through indexes
  private searchIndexes(searchTerm: string): Set<string> {
    const results = new Set<string>();
    const lowercaseSearch = searchTerm.toLowerCase();

    this.indexes.forEach((index) => {
      index.values.forEach((workflowIds, value) => {
        if (value.toLowerCase().includes(lowercaseSearch)) {
          workflowIds.forEach(id => results.add(id));
        }
      });
    });

    return results;
  }

  // Cache management
  private getFromCache(key: string): SearchResult | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.result;
  }

  private addToCache(key: string, result: SearchResult): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldestCacheEntries();
    }

    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
  }

  private evictOldestCacheEntries(): void {
    // Sort by last accessed time and remove oldest 20%
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    const entriesToRemove = Math.ceil(entries.length * 0.2);
    
    for (let i = 0; i < entriesToRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  // Index management
  private updateIndexes(data: any[]): void {
    data.forEach(item => {
      this.indexes.forEach((index, fieldName) => {
        const fieldValue = item[fieldName];
        if (fieldValue !== undefined && fieldValue !== null) {
          const stringValue = String(fieldValue);
          
          if (!index.values.has(stringValue)) {
            index.values.set(stringValue, new Set());
          }
          
          index.values.get(stringValue)!.add(item.id || item.workflow_id);
          index.metadata.totalEntries++;
        }
      });
    });

    // Update metadata
    this.indexes.forEach(index => {
      index.metadata.lastUpdated = Date.now();
      index.metadata.memoryUsage = this.calculateIndexMemoryUsage(index);
    });
  }

  private calculateIndexMemoryUsage(index: SearchIndex): number {
    let memoryUsage = 0;
    
    index.values.forEach((workflowIds, value) => {
      memoryUsage += value.length * 2; // Approximate string memory
      memoryUsage += workflowIds.size * 36; // Approximate Set memory
    });

    return memoryUsage;
  }

  // Performance monitoring
  private updatePerformanceMetrics(executionTime: number, wasFromCache: boolean): void {
    this.performanceMetrics.totalQueries++;
    
    if (wasFromCache) {
      this.performanceMetrics.cacheHitRate = 
        (this.performanceMetrics.cacheHitRate * (this.performanceMetrics.totalQueries - 1) + 1) / 
        this.performanceMetrics.totalQueries;
    } else {
      this.performanceMetrics.cacheHitRate = 
        (this.performanceMetrics.cacheHitRate * (this.performanceMetrics.totalQueries - 1)) / 
        this.performanceMetrics.totalQueries;
      
      // Update average query time
      this.performanceMetrics.averageQueryTime = 
        (this.performanceMetrics.averageQueryTime * (this.performanceMetrics.totalQueries - 1) + executionTime) / 
        this.performanceMetrics.totalQueries;
    }
  }

  private trackSlowQueries(query: SearchQuery, executionTime: number): void {
    if (executionTime > this.SLOW_QUERY_THRESHOLD) {
      this.performanceMetrics.slowQueries.push({
        query,
        executionTime,
        timestamp: Date.now()
      });

      // Keep only recent slow queries
      if (this.performanceMetrics.slowQueries.length > this.MAX_SLOW_QUERIES) {
        this.performanceMetrics.slowQueries = this.performanceMetrics.slowQueries
          .slice(-this.MAX_SLOW_QUERIES);
      }
    }
  }

  // Memory monitoring
  private monitorMemoryUsage(): void {
    setInterval(() => {
      this.performanceMetrics.memoryUsage = {
        cache: this.calculateCacheMemoryUsage(),
        indexes: this.calculateTotalIndexMemoryUsage(),
        total: 0
      };
      
      this.performanceMetrics.memoryUsage.total = 
        this.performanceMetrics.memoryUsage.cache + this.performanceMetrics.memoryUsage.indexes;

    }, 30000); // Every 30 seconds
  }

  private calculateCacheMemoryUsage(): number {
    let usage = 0;
    this.cache.forEach((entry, key) => {
      usage += key.length * 2; // Key string memory
      usage += JSON.stringify(entry.result).length * 2; // Result memory approximation
      usage += 100; // Entry metadata overhead
    });
    return usage;
  }

  private calculateTotalIndexMemoryUsage(): number {
    let total = 0;
    this.indexes.forEach(index => {
      total += index.metadata.memoryUsage;
    });
    return total;
  }

  // Cleanup operations
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupCache();
      this.cleanupIndexes();
    }, 60000); // Every minute
  }

  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.CACHE_TTL) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private cleanupIndexes(): void {
    // Remove indexes that haven't been updated in a while
    const staleThreshold = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();

    this.indexes.forEach((index, fieldName) => {
      if (now - index.metadata.lastUpdated > staleThreshold) {
        // Clear the index values but keep the structure
        index.values.clear();
        index.metadata.totalEntries = 0;
        index.metadata.memoryUsage = 0;
      }
    });
  }

  // Public API methods
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public clearIndexes(): void {
    this.indexes.forEach(index => {
      index.values.clear();
      index.metadata.totalEntries = 0;
      index.metadata.memoryUsage = 0;
    });
  }

  public getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
    entries: Array<{ key: string; accessCount: number; age: number }>;
  } {
    const now = Date.now();
    const entries: Array<{ key: string; accessCount: number; age: number }> = [];

    this.cache.forEach((entry, key) => {
      entries.push({
        key: key.substring(0, 20) + '...', // Truncate for readability
        accessCount: entry.accessCount,
        age: now - entry.timestamp
      });
    });

    return {
      size: this.cache.size,
      hitRate: this.performanceMetrics.cacheHitRate,
      memoryUsage: this.calculateCacheMemoryUsage(),
      entries: entries.sort((a, b) => b.accessCount - a.accessCount).slice(0, 10)
    };
  }

  public getIndexStats(): Array<{
    field: string;
    uniqueValues: number;
    totalEntries: number;
    memoryUsage: number;
    lastUpdated: number;
  }> {
    const stats: Array<{
      field: string;
      uniqueValues: number;
      totalEntries: number;
      memoryUsage: number;
      lastUpdated: number;
    }> = [];

    this.indexes.forEach((index, fieldName) => {
      stats.push({
        field: fieldName,
        uniqueValues: index.values.size,
        totalEntries: index.metadata.totalEntries,
        memoryUsage: index.metadata.memoryUsage,
        lastUpdated: index.metadata.lastUpdated
      });
    });

    return stats;
  }

  // Search suggestions based on indexes
  public getSearchSuggestions(query: string, limit = 10): Array<{
    value: string;
    field: string;
    frequency: number;
  }> {
    const suggestions: Array<{
      value: string;
      field: string;
      frequency: number;
    }> = [];

    const lowercaseQuery = query.toLowerCase();

    this.indexes.forEach((index, fieldName) => {
      index.values.forEach((workflowIds, value) => {
        if (value.toLowerCase().includes(lowercaseQuery)) {
          suggestions.push({
            value,
            field: fieldName,
            frequency: workflowIds.size
          });
        }
      });
    });

    return suggestions
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  // Query optimization suggestions
  public getOptimizationSuggestions(query: SearchQuery): Array<{
    type: 'cache' | 'index' | 'filter' | 'limit';
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
  }> {
    const suggestions: Array<{
      type: 'cache' | 'index' | 'filter' | 'limit';
      suggestion: string;
      impact: 'high' | 'medium' | 'low';
    }> = [];

    // Check if query could benefit from caching
    if (query.query && !Object.keys(query.filters).length) {
      suggestions.push({
        type: 'cache',
        suggestion: 'Consider adding filters to improve cache efficiency',
        impact: 'medium'
      });
    }

    // Check if query could use indexes
    if (query.query && this.searchIndexes(query.query).size > 0) {
      suggestions.push({
        type: 'index',
        suggestion: 'This query can be optimized using search indexes',
        impact: 'high'
      });
    }

    // Check for overly broad queries
    if (!query.query && Object.keys(query.filters).length === 0) {
      suggestions.push({
        type: 'filter',
        suggestion: 'Add filters to reduce query scope and improve performance',
        impact: 'high'
      });
    }

    // Check for large result sets
    if (query.limit > 100) {
      suggestions.push({
        type: 'limit',
        suggestion: 'Consider reducing result limit for better performance',
        impact: 'medium'
      });
    }

    return suggestions;
  }
}

// Singleton instance
export const searchOptimization = new SearchOptimizationService();

// Utility functions
export const createOptimizedSearchHook = (searchFunction: (query: SearchQuery) => Promise<SearchResult>) => {
  return {
    search: (query: SearchQuery) => searchOptimization.optimizedSearch(query, searchFunction),
    debouncedSearch: (searchId: string, query: SearchQuery) => 
      searchOptimization.debouncedSearch(searchId, query, searchFunction),
    getMetrics: () => searchOptimization.getPerformanceMetrics(),
    getSuggestions: (query: string) => searchOptimization.getSearchSuggestions(query),
    getOptimizationTips: (query: SearchQuery) => searchOptimization.getOptimizationSuggestions(query)
  };
};

// React hook for search optimization
export const useSearchOptimization = (searchFunction: (query: SearchQuery) => Promise<SearchResult>) => {
  return createOptimizedSearchHook(searchFunction);
};