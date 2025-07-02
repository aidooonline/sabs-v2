import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';

// ===== DATA VISUALIZATION ENTITIES =====

export interface Visualization {
  id: string;
  name: string;
  description: string;
  type: VisualizationType;
  category: VisualizationCategory;
  chartType: ChartType;
  dataSource: DataSource;
  configuration: VisualizationConfig;
  styling: VisualizationStyling;
  interactivity: InteractivityConfig;
  permissions: VisualizationPermissions;
  metadata: VisualizationMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface InteractiveReport {
  id: string;
  title: string;
  description: string;
  type: ReportType;
  layout: ReportLayout;
  sections: ReportSection[];
  filters: ReportFilter[];
  parameters: ReportParameter[];
  visualizations: string[]; // visualization IDs
  exportOptions: ExportOption[];
  sharingSettings: SharingSettings;
  lastGenerated: Date;
  status: ReportStatus;
}

export interface ChartLibrary {
  id: string;
  name: string;
  version: string;
  chartTypes: ChartTypeDefinition[];
  capabilities: LibraryCapability[];
  themes: ChartTheme[];
  customizations: CustomizationOption[];
  performance: PerformanceMetrics;
}

export interface CustomVisualization {
  id: string;
  name: string;
  description: string;
  code: string;
  language: 'javascript' | 'typescript' | 'python' | 'r';
  dependencies: string[];
  parameters: CustomParameter[];
  examples: VisualizationExample[];
  category: string;
  tags: string[];
}

// ===== ENUMS =====

export enum VisualizationType {
  CHART = 'chart',
  TABLE = 'table',
  METRIC = 'metric',
  MAP = 'map',
  GAUGE = 'gauge',
  TREEMAP = 'treemap',
  HEATMAP = 'heatmap',
  CUSTOM = 'custom',
}

export enum VisualizationCategory {
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  CUSTOMER = UserRole.CUSTOMER,
  MARKETING = 'marketing',
  SALES = 'sales',
  EXECUTIVE = 'executive',
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  AREA = 'area',
  SCATTER = 'scatter',
  BUBBLE = 'bubble',
  CANDLESTICK = 'candlestick',
  WATERFALL = 'waterfall',
  FUNNEL = 'funnel',
  SANKEY = 'sankey',
  RADAR = 'radar',
  POLAR = 'polar',
}



export enum ReportStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  ARCHIVED = 'archived',
}

// ===== SUPPORTING INTERFACES =====

export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'stream';
  connection: DataConnection;
  query: DataQuery;
  transformations: DataTransformation[];
  refreshRate: number;
}

export interface VisualizationConfig {
  dimensions: string[];
  measures: string[];
  aggregations: AggregationConfig[];
  sorting: SortConfig[];
  filtering: FilterConfig[];
  grouping: GroupConfig[];
}

export interface VisualizationStyling {
  theme: string;
  colors: ColorScheme;
  fonts: FontConfig;
  spacing: SpacingConfig;
  animations: AnimationConfig;
  responsive: boolean;
}

export interface InteractivityConfig {
  drillDown: DrillDownConfig;
  filtering: boolean;
  brushing: boolean;
  zooming: boolean;
  tooltip: TooltipConfig;
  legends: LegendConfig;
  crossFiltering: boolean;
}

export interface VisualizationPermissions {
  viewers: string[];
  editors: string[];
  owners: string[];
  public: boolean;
  embedding: EmbeddingConfig;
}

export interface VisualizationMetadata {
  tags: string[];
  description: string;
  documentation: string;
  examples: string[];
  lastAccessed: Date;
  accessCount: number;
  performance: PerformanceStats;
}

export interface ReportLayout {
  type: 'grid' | 'flex' | 'custom';
  columns: number;
  rows: number;
  responsive: boolean;
  breakpoints: BreakpointConfig[];
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'visualization' | 'text' | 'metric' | 'table';
  content: any;
  position: PositionConfig;
  styling: SectionStyling;
}

export interface ReportFilter {
  id: string;
  field: string;
  type: 'dropdown' | 'slider' | 'date' | 'text';
  values: any[];
  defaultValue: any;
  required: boolean;
}

export interface DataConnection {
  url: string;
  credentials?: any;
  headers?: Record<string, string>;
  timeout: number;
}

export interface DataQuery {
  sql?: string;
  aggregation?: any;
  filters?: any[];
  pagination?: PaginationConfig;
}

export interface AggregationConfig {
  field: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct';
  alias?: string;
}

// ===== REQUEST INTERFACES =====

export interface CreateVisualizationRequest {
  name: string;
  description: string;
  type: VisualizationType;
  chartType: ChartType;
  dataSourceId: string;
  configuration: Partial<VisualizationConfig>;
  styling?: Partial<VisualizationStyling>;
}

export interface CreateReportRequest {
  title: string;
  description: string;
  type: ReportType;
  layout: Partial<ReportLayout>;
  visualizations: string[];
  filters?: ReportFilter[];
}

@Injectable()
export class DataVisualizationService {
  private readonly logger = new Logger(DataVisualizationService.name);

  // In-memory storage
  private visualizations: Map<string, Visualization> = new Map();
  private reports: Map<string, InteractiveReport> = new Map();
  private chartLibraries: Map<string, ChartLibrary> = new Map();
  private customVisualizations: Map<string, CustomVisualization> = new Map();

  private readonly vizConfig = {
    maxVisualizationsPerUser: 100,
    maxDataPoints: 50000,
    cacheDuration: 300, // 5 minutes
    exportFormats: ['png', 'svg', 'pdf', 'csv', 'excel'],
    supportedChartLibraries: ['chart.js', 'd3.js', 'plotly', 'highcharts'],
  };

  constructor(
    private eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.initializeChartLibraries();
    this.initializeSampleVisualizations();
  }

  // ===== VISUALIZATION MANAGEMENT =====

  async createVisualization(request: CreateVisualizationRequest): Promise<{
    visualizationId: string;
    configuration: VisualizationConfig;
    dataPreview: any[];
    renderTime: number;
  }> {
    this.logger.log(`Creating visualization: ${request.name}`);

    const visualizationId = `viz_${nanoid(10)}`;

    const visualization: Visualization = {
      id: visualizationId,
      name: request.name,
      description: request.description,
      type: request.type,
      category: VisualizationCategory.OPERATIONAL,
      chartType: request.chartType,
      dataSource: await this.getDataSource(request.dataSourceId),
      configuration: this.buildVisualizationConfig(request.configuration),
      styling: this.getDefaultStyling(request.styling),
      interactivity: this.getDefaultInteractivity(),
      permissions: this.createDefaultPermissions(),
      metadata: this.createMetadata(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user_001',
    };

    this.visualizations.set(visualizationId, visualization);

    const dataPreview = await this.generateDataPreview(visualization);
    const renderTime = this.estimateRenderTime(visualization);

    this.eventEmitter.emit('visualization.created', {
      visualizationId,
      name: request.name,
      type: request.type,
      chartType: request.chartType,
    });

    return {
      visualizationId,
      configuration: visualization.configuration,
      dataPreview,
      renderTime,
    };
  }

  async renderVisualization(visualizationId: string, options?: {
    width?: number;
    height?: number;
    theme?: string;
    interactive?: boolean;
  }): Promise<{
    visualization: Visualization;
    data: any[];
    chartSpec: any;
    renderOptions: any;
    performance: {
      dataLoadTime: number;
      renderTime: number;
      totalPoints: number;
    };
  }> {
    const visualization = this.visualizations.get(visualizationId);
    if (!visualization) {
      throw new BadRequestException('Visualization not found');
    }

    const startTime = Date.now();
    const data = await this.fetchVisualizationData(visualization);
    const dataLoadTime = Date.now() - startTime;

    const chartSpec = this.generateChartSpec(visualization, data, options);
    const renderOptions = this.buildRenderOptions(visualization, options);

    const performance = {
      dataLoadTime,
      renderTime: 50 + Math.random() * 100, // Simulated render time
      totalPoints: data.length,
    };

    // Update metadata
    visualization.metadata.lastAccessed = new Date();
    visualization.metadata.accessCount++;

    return {
      visualization,
      data,
      chartSpec,
      renderOptions,
      performance,
    };
  }

  async getVisualizationCatalog(filters?: {
    type?: VisualizationType;
    category?: VisualizationCategory;
    tags?: string[];
  }): Promise<{
    visualizations: Array<{
      id: string;
      name: string;
      description: string;
      type: VisualizationType;
      category: VisualizationCategory;
      chartType: ChartType;
      lastAccessed: Date;
      accessCount: number;
      performance: number;
    }>;
    summary: {
      total: number;
      byType: Record<VisualizationType, number>;
      byCategory: Record<VisualizationCategory, number>;
      mostPopular: string[];
    };
  }> {
    let visualizations = Array.from(this.visualizations.values());

    // Apply filters
    if (filters?.type) {
      visualizations = visualizations.filter(v => v.type === filters.type);
    }
    if (filters?.category) {
      visualizations = visualizations.filter(v => v.category === filters.category);
    }
    if (filters?.tags) {
      visualizations = visualizations.filter(v => 
        filters.tags.some(tag => v.metadata.tags.includes(tag))
      );
    }

    const catalogItems = visualizations.map(viz => ({
      id: viz.id,
      name: viz.name,
      description: viz.description,
      type: viz.type,
      category: viz.category,
      chartType: viz.chartType,
      lastAccessed: viz.metadata.lastAccessed,
      accessCount: viz.metadata.accessCount,
      performance: 95 + Math.random() * 5, // Mock performance score
    }));

    const summary = this.generateCatalogSummary(visualizations);

    return {
      visualizations: catalogItems,
      summary,
    };
  }

  // ===== INTERACTIVE REPORTING =====

  async createInteractiveReport(request: CreateReportRequest): Promise<{
    reportId: string;
    layout: ReportLayout;
    sections: ReportSection[];
    estimatedLoadTime: number;
  }> {
    this.logger.log(`Creating interactive report: ${request.title}`);

    const reportId = `report_${nanoid(8)}`;

    const report: InteractiveReport = {
      id: reportId,
      title: request.title,
      description: request.description,
      type: request.type,
      layout: this.buildReportLayout(request.layout),
      sections: await this.createReportSections(request.visualizations),
      filters: request.filters || [],
      parameters: [],
      visualizations: request.visualizations,
      exportOptions: this.getDefaultExportOptions(),
      sharingSettings: this.getDefaultSharingSettings(),
      lastGenerated: new Date(),
      status: ReportStatus.DRAFT,
    };

    this.reports.set(reportId, report);

    const estimatedLoadTime = this.estimateReportLoadTime(report);

    this.eventEmitter.emit('report.created', {
      reportId,
      title: request.title,
      type: request.type,
      visualizationCount: request.visualizations.length,
    });

    return {
      reportId,
      layout: report.layout,
      sections: report.sections,
      estimatedLoadTime,
    };
  }

  async renderInteractiveReport(reportId: string, filters?: Record<string, any>): Promise<{
    report: InteractiveReport;
    renderedSections: Array<{
      id: string;
      title: string;
      content: any;
      loadTime: number;
    }>;
    totalLoadTime: number;
    interactivityOptions: {
      availableFilters: ReportFilter[];
      drillDownPaths: string[];
      exportFormats: string[];
    };
  }> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new BadRequestException('Report not found');
    }

    const startTime = Date.now();
    const renderedSections = await this.renderReportSections(report, filters);
    const totalLoadTime = Date.now() - startTime;

    const interactivityOptions = {
      availableFilters: report.filters,
      drillDownPaths: await this.generateDrillDownPaths(report),
      exportFormats: this.vizConfig.exportFormats,
    };

    return {
      report,
      renderedSections,
      totalLoadTime,
      interactivityOptions,
    };
  }

  // ===== CHART LIBRARY MANAGEMENT =====

  async getChartLibraries(): Promise<{
    libraries: ChartLibrary[];
    recommendations: Array<{
      library: string;
      useCase: string;
      performance: number;
      features: string[];
    }>;
  }> {
    const libraries = Array.from(this.chartLibraries.values());

    const recommendations = [
      {
        library: 'chart.js',
        useCase: 'Simple, responsive charts',
        performance: 90,
        features: ['Responsive', 'Animated', 'Interactive'],
      },
      {
        library: 'd3.js',
        useCase: 'Custom, complex visualizations',
        performance: 85,
        features: ['Highly customizable', 'SVG-based', 'Data binding'],
      },
      {
        library: 'plotly',
        useCase: 'Scientific and statistical plots',
        performance: 88,
        features: ['3D plotting', 'Statistical charts', 'WebGL acceleration'],
      },
    ];

    return {
      libraries,
      recommendations,
    };
  }

  // ===== SELF-SERVICE ANALYTICS =====

  async generateVisualizationSuggestions(dataSourceId: string): Promise<{
    suggestions: Array<{
      chartType: ChartType;
      reasoning: string;
      confidence: number;
      sampleConfig: Partial<VisualizationConfig>;
    }>;
    dataInsights: {
      columnTypes: Record<string, string>;
      dataQuality: number;
      recordCount: number;
      recommendations: string[];
    };
  }> {
    this.logger.log(`Generating visualization suggestions for data source: ${dataSourceId}`);

    // Mock data analysis
    const suggestions = [
      {
        chartType: ChartType.LINE,
        reasoning: 'Time series data detected with numeric values',
        confidence: 0.92,
        sampleConfig: {
          dimensions: ['date'],
          measures: ['revenue'],
          aggregations: [{ field: 'revenue', function: 'sum' as const }],
        },
      },
      {
        chartType: ChartType.PIE,
        reasoning: 'Categorical data suitable for distribution analysis',
        confidence: 0.78,
        sampleConfig: {
          dimensions: ['category'],
          measures: ['count'],
          aggregations: [{ field: 'id', function: 'count' as const }],
        },
      },
    ];

    const dataInsights = {
      columnTypes: {
        date: 'datetime',
        revenue: 'numeric',
        category: 'categorical',
        id: 'identifier',
      },
      dataQuality: 95.5,
      recordCount: 15420,
      recommendations: [
        'Consider time-based analysis for trending',
        'Category distribution shows good balance',
        'Data quality is excellent for visualization',
      ],
    };

    return {
      suggestions,
      dataInsights,
    };
  }

  async exportVisualization(visualizationId: string, format: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
  }): Promise<{
    exportId: string;
    format: string;
    size: number;
    downloadUrl: string;
    expiresAt: Date;
  }> {
    this.logger.log(`Exporting visualization ${visualizationId} as ${format}`);

    const exportId = `export_${nanoid(8)}`;
    const size = 1024 * (1 + Math.random() * 10); // Mock file size in KB

    return {
      exportId,
      format,
      size,
      downloadUrl: `/api/exports/${exportId}/download`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async getDataSource(dataSourceId: string): Promise<DataSource> {
    return {
      id: dataSourceId,
      name: 'Sample Data Source',
      type: 'database',
      connection: {
        url: 'postgresql://localhost:5432/sabs',
        timeout: 30000,
      },
      query: {
        sql: 'SELECT * FROM transactions LIMIT 1000',
      },
      transformations: [],
      refreshRate: 300,
    };
  }

  private buildVisualizationConfig(config: Partial<VisualizationConfig>): VisualizationConfig {
    return {
      dimensions: config.dimensions || ['date'],
      measures: config.measures || ['amount'],
      aggregations: config.aggregations || [{ field: 'amount', function: 'sum' }],
      sorting: config.sorting || [],
      filtering: config.filtering || [],
      grouping: config.grouping || [],
    };
  }

  private getDefaultStyling(styling?: Partial<VisualizationStyling>): VisualizationStyling {
    return {
      theme: styling?.theme || 'default',
      colors: styling?.colors || {
        primary: '#2563eb',
        secondary: '#10b981',
        accent: '#f59e0b',
        scheme: 'categorical',
      },
      fonts: styling?.fonts || {
        family: 'Inter',
        size: 12,
        weight: 'normal',
      },
      spacing: styling?.spacing || {
        padding: 16,
        margin: 8,
      },
      animations: styling?.animations || {
        enabled: true,
        duration: 300,
        easing: 'ease-in-out',
      },
      responsive: styling?.responsive !== false,
    };
  }

  private getDefaultInteractivity(): InteractivityConfig {
    return {
      drillDown: {
        enabled: true,
        levels: ['year', 'quarter', 'month', 'day'],
      },
      filtering: true,
      brushing: true,
      zooming: true,
      tooltip: {
        enabled: true,
        format: 'default',
        fields: [],
      },
      legends: {
        enabled: true,
        position: 'right',
        interactive: true,
      },
      crossFiltering: false,
    };
  }

  private createDefaultPermissions(): VisualizationPermissions {
    return {
      viewers: ['all'],
      editors: ['creator'],
      owners: ['creator'],
      public: false,
      embedding: {
        enabled: false,
        domains: [],
        whiteLabel: false,
      },
    };
  }

  private createMetadata(): VisualizationMetadata {
    return {
      tags: [],
      description: '',
      documentation: '',
      examples: [],
      lastAccessed: new Date(),
      accessCount: 0,
      performance: {
        averageLoadTime: 0,
        dataSize: 0,
        renderComplexity: 1,
      },
    };
  }

  private async generateDataPreview(visualization: Visualization): Promise<any[]> {
    // Mock data preview
    return Array.from({ length: 10 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      amount: 1000 + Math.random() * 5000,
      category: ['Sales', 'Marketing', 'Operations'][i % 3],
    }));
  }

  private estimateRenderTime(visualization: Visualization): number {
    const baseTime = 50; // Base render time in ms
    const complexityMultiplier = visualization.type === VisualizationType.CUSTOM ? 2 : 1;
    return baseTime * complexityMultiplier + Math.random() * 100;
  }

  private async fetchVisualizationData(visualization: Visualization): Promise<any[]> {
    // Mock data fetching
    const dataPoints = 100 + Math.floor(Math.random() * 1000);
    return Array.from({ length: dataPoints }, (_, i) => ({
      x: i,
      y: Math.sin(i * 0.1) * 100 + Math.random() * 50,
      category: ['A', 'B', 'C'][i % 3],
    }));
  }

  private generateChartSpec(visualization: Visualization, data: any[], options?: any): any {
    return {
      type: visualization.chartType,
      data: {
        datasets: [{
          label: visualization.name,
          data: data,
          backgroundColor: visualization.styling.colors.primary,
        }],
      },
      options: {
        responsive: visualization.styling.responsive,
        animation: visualization.styling.animations,
        plugins: {
          tooltip: visualization.interactivity.tooltip,
          legend: visualization.interactivity.legends,
        },
        ...options,
      },
    };
  }

  private buildRenderOptions(visualization: Visualization, options?: any): any {
    return {
      width: options?.width || 800,
      height: options?.height || 400,
      theme: options?.theme || visualization.styling.theme,
      interactive: options?.interactive !== false,
      devicePixelRatio: 2,
    };
  }

  private generateCatalogSummary(visualizations: Visualization[]): any {
    const byType = {} as Record<VisualizationType, number>;
    const byCategory = {} as Record<VisualizationCategory, number>;

    visualizations.forEach(viz => {
      byType[viz.type] = (byType[viz.type] || 0) + 1;
      byCategory[viz.category] = (byCategory[viz.category] || 0) + 1;
    });

    const mostPopular = visualizations
      .sort((a, b) => b.metadata.accessCount - a.metadata.accessCount)
      .slice(0, 5)
      .map(viz => viz.name);

    return {
      total: visualizations.length,
      byType,
      byCategory,
      mostPopular,
    };
  }

  private buildReportLayout(layout?: Partial<ReportLayout>): ReportLayout {
    return {
      type: layout?.type || 'grid',
      columns: layout?.columns || 2,
      rows: layout?.rows || 3,
      responsive: layout?.responsive !== false,
      breakpoints: layout?.breakpoints || [
        { width: 768, columns: 1 },
        { width: 1024, columns: 2 },
        { width: 1440, columns: 3 },
      ],
    };
  }

  private async createReportSections(visualizationIds: string[]): Promise<ReportSection[]> {
    return visualizationIds.map((vizId, index) => ({
      id: `section_${index}`,
      title: `Visualization ${index + 1}`,
      type: 'visualization' as const,
      content: { visualizationId: vizId },
      position: {
        x: index % 2,
        y: Math.floor(index / 2),
        width: 1,
        height: 1,
      },
      styling: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 16,
      },
    }));
  }

  private getDefaultExportOptions(): ExportOption[] {
    return this.vizConfig.exportFormats.map(format => ({
      format,
      quality: format === 'pdf' ? 'high' : 'medium',
      size: 'standard',
    }));
  }

  private getDefaultSharingSettings(): SharingSettings {
    return {
      public: false,
      allowedUsers: [],
      embedCode: '',
      passwordProtected: false,
      expiresAt: null,
    };
  }

  private estimateReportLoadTime(report: InteractiveReport): number {
    const baseTime = 200; // Base load time in ms
    const visualizationCount = report.visualizations.length;
    return baseTime + (visualizationCount * 100) + Math.random() * 200;
  }

  private async renderReportSections(report: InteractiveReport, filters?: Record<string, any>): Promise<any[]> {
    return report.sections.map(section => ({
      id: section.id,
      title: section.title,
      content: this.renderSectionContent(section, filters),
      loadTime: 50 + Math.random() * 150,
    }));
  }

  private renderSectionContent(section: ReportSection, filters?: Record<string, any>): any {
    if (section.type === 'visualization') {
      return {
        type: 'chart',
        data: Array.from({ length: 20 }, (_, i) => ({
          x: i,
          y: Math.random() * 100,
        })),
        config: { responsive: true },
      };
    }
    return section.content;
  }

  private async generateDrillDownPaths(report: InteractiveReport): Promise<string[]> {
    return [
      'Year → Quarter → Month',
      'Product → Category → Subcategory',
      'Region → Country → City',
    ];
  }

  private initializeChartLibraries(): void {
    const libraries: ChartLibrary[] = [
      {
        id: 'chartjs',
        name: 'Chart.js',
        version: '4.4.0',
        chartTypes: [
          { type: ChartType.LINE, capabilities: ['responsive', 'animated'] },
          { type: ChartType.BAR, capabilities: ['responsive', 'stacked'] },
          { type: ChartType.PIE, capabilities: ['responsive', 'doughnut'] },
        ],
        capabilities: ['responsive', 'animated', 'interactive'],
        themes: [
          { name: 'default', colors: ['#2563eb', '#10b981', '#f59e0b'] },
          { name: 'dark', colors: ['#3b82f6', '#06d6a0', '#ffd23f'] },
        ],
        customizations: [],
        performance: { averageRenderTime: 45, maxDataPoints: 10000 },
      },
    ];

    libraries.forEach(lib => this.chartLibraries.set(lib.id, lib));
    this.logger.log('Chart libraries initialized');
  }

  private initializeSampleVisualizations(): void {
    this.logger.log('Sample visualizations initialized');
  }
}

// ===== ADDITIONAL INTERFACES =====

interface DataTransformation {
  type: string;
  config: any;
}

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  scheme: string;
}

interface FontConfig {
  family: string;
  size: number;
  weight: string;
}

interface SpacingConfig {
  padding: number;
  margin: number;
}

interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: string;
}

interface DrillDownConfig {
  enabled: boolean;
  levels: string[];
}

interface TooltipConfig {
  enabled: boolean;
  format: string;
  fields: string[];
}

interface LegendConfig {
  enabled: boolean;
  position: string;
  interactive: boolean;
}

interface EmbeddingConfig {
  enabled: boolean;
  domains: string[];
  whiteLabel: boolean;
}

interface PerformanceStats {
  averageLoadTime: number;
  dataSize: number;
  renderComplexity: number;
}

interface BreakpointConfig {
  width: number;
  columns: number;
}

interface PositionConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SectionStyling {
  backgroundColor: string;
  border: string;
  borderRadius: number;
  padding: number;
}

interface PaginationConfig {
  page: number;
  size: number;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  field: string;
  operator: string;
  value: any;
}

interface GroupConfig {
  field: string;
  aggregation: string;
}

interface ReportParameter {
  name: string;
  type: string;
  defaultValue: any;
}

interface ExportOption {
  format: string;
  quality: string;
  size: string;
}

interface SharingSettings {
  public: boolean;
  allowedUsers: string[];
  embedCode: string;
  passwordProtected: boolean;
  expiresAt: Date | null;
}

interface ChartTypeDefinition {
  type: ChartType;
  capabilities: string[];
}

interface LibraryCapability {
  name: string;
  description: string;
}

interface ChartTheme {
  name: string;
  colors: string[];
}

interface CustomizationOption {
  name: string;
  type: string;
  options: any[];
}

interface PerformanceMetrics {
  averageRenderTime: number;
  maxDataPoints: number;
}

interface CustomParameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
}

interface VisualizationExample {
  name: string;
  description: string;
  code: string;
  data: any[];
}