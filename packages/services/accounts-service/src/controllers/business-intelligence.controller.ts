import { HttpException, HttpStatus } from '@nestjs/common';
import { nanoid } from 'nanoid';
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ValidationPipe,
  BadRequestException,
  Logger,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  BusinessIntelligenceService,
  PredictiveModel,
  CustomerSegment,
  AnomalyDetection,
  ForecastResult,
  RiskModel,
  ModelType,
  ModelCategory,
  MLAlgorithm,
  ModelStatus,
  AnomalyType,
  AnomalySeverity,
  AnomalyCategory,
  AnomalyStatus,
  TimeHorizon,
  RiskType,
  CreateModelRequest,
  ForecastRequest,
  SegmentationRequest,
} from '../services/business-intelligence.service';

// ===== REQUEST DTOs =====

export class CreateModelDto {
  name: string;
  type: ModelType;
  category: ModelCategory;
  algorithm: MLAlgorithm;
  features: string[];
  configuration?: {
    hyperparameters?: Record<string, any>;
    featureSelection?: string[];
    crossValidation?: {
      method: 'k_fold' | 'time_series' | 'stratified';
      folds: number;
      testSize: number;
    };
  };
}

export class ForecastDto {
  metric: string;
  timeHorizon: TimeHorizon;
  periods: number;
  confidence: number;
  externalFactors?: Record<string, any>;
}

export class SegmentationDto {
  criteria: Array<{
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'in_range' | 'contains';
    value: any;
    weight: number;
  }>;
  method: 'rule_based' | 'ml_clustering' | 'hybrid';
  maxSegments?: number;
}

export class RiskAssessmentDto {
  customerId: string;
  riskType: RiskType;
  factors?: Record<string, any>;
}

// ===== RESPONSE DTOs =====

export class ModelResponseDto {
  id: string;
  name: string;
  type: ModelType;
  category: ModelCategory;
  algorithm: MLAlgorithm;
  status: ModelStatus;
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
  };
  lastTrained: Date;
  nextRetrain: Date;
}

export class ForecastResponseDto {
  id: string;
  metric: string;
  timeHorizon: TimeHorizon;
  predictions: Array<{
    timestamp: Date;
    value: number;
    upperBound: number;
    lowerBound: number;
  }>;
  ;
  methodology: {
    algorithm: string;
    features: string[];
    seasonality: boolean;
    trend: boolean;
  };
  generatedAt: Date;
}

export class AnomalyResponseDto {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  category: AnomalyCategory;
  description: string;
  detectedAt: Date;
  confidence: number;
  impact: {
    financial: number;
    operational: number;
    reputation: number;
    compliance: number;
  };
  status: AnomalyStatus;
  recommendations: string[];
}

@ApiTags('Business Intelligence & Predictive Analytics')
@Controller('business-intelligence')
export class BusinessIntelligenceController {
  private readonly logger = new Logger(BusinessIntelligenceController.name);

  constructor(private readonly biService: BusinessIntelligenceService) {}

  // ===== PREDICTIVE MODELING ENDPOINTS =====

  @Get('models')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get predictive models' })
  @ApiQuery({ name: 'type', required: false, enum: ModelType })
  @ApiQuery({ name: 'category', required: false, enum: ModelCategory })
  @ApiQuery({ name: 'status', required: false, enum: ModelStatus })
  @ApiResponse({ status: 200, description: 'Models retrieved successfully' })
  async getPredictiveModels(
    @Headers('authorization') authorization: string,
    @Query('type') type?: ModelType,
    @Query('category') category?: ModelCategory,
    @Query('status') status?: ModelStatus,
  ): Promise<{
    models: ModelResponseDto[];
    summary: {
      total: number;
      active: number;
      training: number;
      averageAccuracy: number;
    };
    recommendations: Array<{
      type: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    // Mock models data
    const models: ModelResponseDto[] = [
      {
        id: 'model_credit_001',
        name: 'Credit Risk Assessment Model',
        type: ModelType.CLASSIFICATION,
        category: ModelCategory.RISK,
        algorithm: MLAlgorithm.GRADIENT_BOOSTING,
        status: ModelStatus.ACTIVE,
        performance: {
          accuracy: 0.92,
          precision: 0.89,
          recall: 0.94,
          f1Score: 0.91,
          auc: 0.96,
        },
        lastTrained: new Date('2024-11-15'),
        nextRetrain: new Date('2024-12-15'),
      },
      {
        id: 'model_churn_001',
        name: 'Customer Churn Prediction',
        type: ModelType.CLASSIFICATION,
        category: ModelCategory.CUSTOMER,
        algorithm: MLAlgorithm.RANDOM_FOREST,
        status: ModelStatus.ACTIVE,
        performance: {
          accuracy: 0.87,
          precision: 0.85,
          recall: 0.89,
          f1Score: 0.87,
          auc: 0.93,
        },
        lastTrained: new Date('2024-11-10'),
        nextRetrain: new Date('2024-12-10'),
      },
      {
        id: 'model_revenue_001',
        name: 'Revenue Forecasting Model',
        type: ModelType.TIME_SERIES,
        category: ModelCategory.REVENUE,
        algorithm: MLAlgorithm.LSTM,
        status: ModelStatus.TRAINING,
        performance: {
          accuracy: 0.0,
          precision: 0.0,
          recall: 0.0,
          f1Score: 0.0,
          auc: 0.0,
        },
        lastTrained: new Date('2024-11-28'),
        nextRetrain: new Date('2024-12-28'),
      },
    ];

    // Apply filters
    let filteredModels = models;
    if (type) filteredModels = filteredModels.filter(m => m.type === type);
    if (category) filteredModels = filteredModels.filter(m => m.category === category);
    if (status) filteredModels = filteredModels.filter(m => m.status === status);

    const summary = {
      total: Object.values(models).length,
      active: models.filter(m => m.status === ModelStatus.ACTIVE).length,
      training: models.filter(m => m.status === ModelStatus.TRAINING).length,
      averageAccuracy: models.filter(m => m.status === ModelStatus.ACTIVE)
        .reduce((sum, m) => sum + m.performance.accuracy, 0) / 
        models.filter(m => m.status === ModelStatus.ACTIVE).length,
    };

    const recommendations = [
      {
        type: 'Model Refresh',
        description: 'Credit risk model shows signs of drift - consider retraining',
        priority: 'high' as const,
      },
      {
        type: 'Feature Engineering',
        description: 'Add mobile app usage features to churn prediction model',
        priority: 'medium' as const,
      },
      {
        type: 'Model Expansion',
        description: 'Develop fraud detection model for real-time scoring',
        priority: 'medium' as const,
      },
    ];

    return {
      models: filteredModels,
      summary,
      recommendations,
    };
  }

  @Post('models')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new predictive model' })
  @ApiResponse({ status: 201, description: 'Model created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid model configuration' })
  async createPredictiveModel(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) modelDto: CreateModelDto,
  ): Promise<{
    modelId: string;
    trainingStatus: string;
    estimatedTrainingTime: number;
    features: Array<{
      name: string;
      type: string;
      importance?: number;
    }>;
    message: string;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Creating predictive model: ${userId} -> ${modelDto.name}`);

    const request: CreateModelRequest = {
      name: modelDto.name,
      type: modelDto.type,
      category: modelDto.category,
      algorithm: modelDto.algorithm,
      features: modelDto.features,
      configuration: modelDto.configuration || {},
    };

    const result = await this.biService.createPredictiveModel(request);

    return {
      ...result,
      message: 'Model creation initiated. Training will complete in approximately 30 seconds.',
    };
  }

  @Get('models/:modelId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get model details and performance' })
  @ApiParam({ name: 'modelId', description: 'Model ID' })
  @ApiResponse({ status: 200, description: 'Model details retrieved' })
  async getModelDetails(
    @Headers('authorization') authorization: string,
    @Param('modelId') modelId: string,
  ): Promise<{
    model: ModelResponseDto;
    performance: {
      trainingHistory: Array<{
        date: Date;
        accuracy: number;
        loss: number;
        epoch: number;
      }>;
      validationMetrics: {
        precision: number;
        recall: number;
        f1Score: number;
        confusionMatrix: number[][];
      };
      featureImportance: Array<{
        feature: string;
        importance: number;
        description: string;
      }>;
    };
    predictions: {
      recent: Array<{
        timestamp: Date;
        input: Record<string, any>;
        prediction: number;
        confidence: number;
      }>;
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    // Mock model details
    const model: ModelResponseDto = {
      id: modelId,
      name: 'Credit Risk Assessment Model',
      type: ModelType.CLASSIFICATION,
      category: ModelCategory.RISK,
      algorithm: MLAlgorithm.GRADIENT_BOOSTING,
      status: ModelStatus.ACTIVE,
      performance: {
        accuracy: 0.92,
        precision: 0.89,
        recall: 0.94,
        f1Score: 0.91,
        auc: 0.96,
      },
      lastTrained: new Date('2024-11-15'),
      nextRetrain: new Date('2024-12-15'),
    };

    const performance = {
      trainingHistory: Array.from({ length: 10 }, (_, i) => ({
        date: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000),
        accuracy: 0.7 + (i * 0.02) + Math.random() * 0.02,
        loss: 0.5 - (i * 0.04) + Math.random() * 0.02,
        epoch: i + 1,
      })),
      validationMetrics: {
        precision: 0.89,
        recall: 0.94,
        f1Score: 0.91,
        confusionMatrix: [[850, 45], [32, 573]],
      },
      featureImportance: [
        { feature: 'credit_score', importance: 0.35, description: 'Customer credit score' },
        { feature: 'debt_to_income', importance: 0.28, description: 'Debt to income ratio' },
        { feature: 'payment_history', importance: 0.22, description: 'Historical payment behavior' },
        { feature: 'account_age', importance: 0.15, description: 'Age of customer relationship' },
      ],
    };

    const predictions = {
      recent: Array.from({ length: 5 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
        input: {
          credit_score: 720 + Math.random() * 100,
          debt_to_income: 0.2 + Math.random() * 0.3,
          payment_history: 0.8 + Math.random() * 0.2,
        },
        prediction: Math.random() > 0.5 ? 1 : 0,
        confidence: 0.7 + Math.random() * 0.3,
      })),
      
    };

    return {
      model,
      performance,
      predictions: {
        recent: [],
      },
    };
  }

  // ===== FORECASTING ENDPOINTS =====

  @Post('forecasts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate business forecast' })
  @ApiResponse({ status: 201, description: 'Forecast generated successfully' })
  async generateForecast(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) forecastDto: ForecastDto,
  ): Promise<ForecastResponseDto> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Generating forecast: ${userId} -> ${forecastDto.metric}`);

    const request: ForecastRequest = {
      metric: forecastDto.metric,
      timeHorizon: forecastDto.timeHorizon,
      periods: forecastDto.periods,
      confidence: forecastDto.confidence,
      externalFactors: forecastDto.externalFactors,
    };

    const result = await this.biService.generateForecast(request);

    return {
      id: result.id,
      metric: result.metric,
      timeHorizon: result.timeHorizon,
      predictions: result.predictions.map(p => ({
        timestamp: p.timestamp,
        value: p.value,
        upperBound: p.upperBound,
        lowerBound: p.lowerBound,
      })),
      methodology: result.methodology,
      generatedAt: result.generatedAt,
    };
  }

  @Get('forecasts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent forecasts' })
  @ApiQuery({ name: 'metric', required: false, type: String })
  @ApiQuery({ name: 'timeHorizon', required: false, enum: TimeHorizon })
  @ApiResponse({ status: 200, description: 'Forecasts retrieved successfully' })
  async getForecasts(
    @Headers('authorization') authorization: string,
    @Query('metric') metric?: string,
    @Query('timeHorizon') timeHorizon?: TimeHorizon,
  ): Promise<{
    forecasts: ForecastResponseDto[];
    summary: {
      total: number;
      averageAccuracy: number;
      mostAccurate: string;
      recentlyGenerated: number;
    };
    insights: Array<{
      metric: string;
      trend: 'increasing' | 'decreasing' | 'stable';
      confidence: number;
      keyDriver: string;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    // Mock forecasts data
    const forecasts: ForecastResponseDto[] = [
      {
        id: 'forecast_revenue_001',
        metric: 'monthly_revenue',
        timeHorizon: TimeHorizon.MEDIUM_TERM,
        predictions: Array.from({ length: 12 }, (_, i) => ({
          timestamp: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
          value: 3200000 + i * 50000 + Math.random() * 100000,
          upperBound: 3200000 + i * 50000 + 200000,
          lowerBound: 3200000 + i * 50000 - 200000,
        })),
        
        methodology: {
          algorithm: 'LSTM Neural Network',
          features: ['historical_revenue', 'customer_count', 'seasonality', 'marketing_spend'],
          seasonality: true,
          trend: true,
        },
        generatedAt: new Date(),
      },
    ];

    const summary = {
      total: Object.values(forecasts).length,
      averageAccuracy: 92.5, // Mock average accuracy
      mostAccurate: 'monthly_revenue',
      recentlyGenerated: forecasts.filter(f => 
        (Date.now() - f.generatedAt.getTime()) < 24 * 60 * 60 * 1000
      ).length,
    };

    const insights = [
      {
        metric: 'monthly_revenue',
        trend: 'increasing' as const,
        confidence: 0.92,
        keyDriver: 'Customer acquisition growth',
      },
      {
        metric: 'transaction_volume',
        trend: 'stable' as const,
        confidence: 0.87,
        keyDriver: 'Seasonal patterns',
      },
    ];

    return {
      forecasts,
      summary,
      insights: [],
    };
  }

  // ===== CUSTOMER SEGMENTATION ENDPOINTS =====

  @Post('segmentation')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perform customer segmentation analysis' })
  @ApiResponse({ status: 201, description: 'Segmentation completed successfully' })
  async performCustomerSegmentation(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) segmentationDto: SegmentationDto,
  ): Promise<{
    segments: Array<{
      id: string;
      name: string;
      description: string;
      size: number;
      percentage: number;
      value: {
        lifetime: number;
        monthly: number;
        profitability: number;
      };
      characteristics: Record<string, any>;
    }>;
    summary: {
      totalSegments: number;
      coverage: number;
      silhouetteScore?: number;
    };
    recommendations: string[];
    insights: Array<{
      insight: string;
      impact: 'high' | 'medium' | 'low';
      actionable: boolean;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Performing customer segmentation: ${userId} -> ${segmentationDto.method}`);

    const request: SegmentationRequest = {
      criteria: segmentationDto.criteria,
      method: segmentationDto.method,
      maxSegments: segmentationDto.maxSegments,
    };

    const result = await this.biService.performCustomerSegmentation(request);

    const segments = result.segments.map(segment => ({
      id: segment.id,
      name: segment.name,
      description: segment.description,
      size: segment.size,
      percentage: segment.percentage,
      value: {
        lifetime: segment.value.lifetime,
        monthly: segment.value.monthly,
        profitability: segment.value.profitability,
      },
      characteristics: segment.characteristics,
    }));

    const insights = [
      {
        insight: 'High-value segment shows 25% growth potential',
        impact: 'high' as const,
        actionable: true,
      },
      {
        insight: 'Digital adoption varies significantly across segments',
        impact: 'medium' as const,
        actionable: true,
      },
    ];

    return {
      segments: [],
      summary: result.summary,
      recommendations: result.recommendations,
      insights: [],
    };
  }

  @Get('segments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer segments' })
  @ApiResponse({ status: 200, description: 'Customer segments retrieved' })
  async getCustomerSegments(
    @Headers('authorization') authorization: string,
  ): Promise<{
    segments: Array<{
      id: string;
      name: string;
      description: string;
      size: number;
      percentage: number;
      growth: number;
      healthScore: number;
    }>;
    analytics: {
      totalCustomers: number;
      segmentedCustomers: number;
      topSegmentByValue: string;
      fastestGrowingSegment: string;
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    const segments = [
      {
        id: 'segment_high_value',
        name: 'High Value Customers',
        description: 'Top 20% customers by lifetime value',
        size: 25000,
        percentage: 20,
        growth: 12.5,
        healthScore: 85,
      },
      {
        id: 'segment_digital_natives',
        name: 'Digital Natives',
        description: 'Young, tech-savvy mobile-first customers',
        size: 37500,
        percentage: 30,
        growth: 25.0,
        healthScore: 90,
      },
      {
        id: 'segment_traditional',
        name: 'Traditional Savers',
        description: 'Conservative customers preferring savings products',
        size: 31250,
        percentage: 25,
        growth: 5.2,
        healthScore: 75,
      },
    ];

    const analytics = {
      totalCustomers: 125000,
      segmentedCustomers: 93750,
      topSegmentByValue: 'High Value Customers',
      fastestGrowingSegment: 'Digital Natives',
    };

    return {
      segments: [],
      analytics,
    };
  }

  @Get('segments/:segmentId/insights')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed segment insights' })
  @ApiParam({ name: 'segmentId', description: 'Segment ID' })
  @ApiResponse({ status: 200, description: 'Segment insights retrieved' })
  async getSegmentInsights(
    @Headers('authorization') authorization: string,
    @Param('segmentId') segmentId: string,
  ): Promise<{
    segment: {
      id: string;
      name: string;
      description: string;
      size: number;
    };
    trends: Array<{
      metric: string;
      trend: 'increasing' | 'decreasing' | 'stable';
      change: number;
      significance: number;
    }>;
    opportunities: Array<{
      type: string;
      description: string;
      impact: number;
      effort: number;
      roi: number;
    }>;
    risks: Array<{
      type: string;
      description: string;
      probability: number;
      impact: number;
    }>;
    recommendations: Array<{
      recommendation: string;
      category: string;
      priority: 'high' | 'medium' | 'low';
      timeline: string;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    const result = await this.biService.getCustomerSegmentInsights(segmentId);

    const opportunities = result.opportunities.map(opp => ({
      ...opp,
      roi: opp.impact / opp.effort,
    }));

    const recommendations = [
      {
        recommendation: 'Launch targeted investment product campaign',
        category: 'Product Marketing',
        priority: 'high' as const,
        timeline: '2-4 weeks',
      },
      {
        recommendation: 'Enhance mobile app features for this segment',
        category: 'Digital Experience',
        priority: 'medium' as const,
        timeline: '1-2 months',
      },
    ];

    return {
      segment: result.segment,
      trends: result.trends,
      opportunities,
      risks: result.risks,
      recommendations,
    };
  }

  // ===== ANOMALY DETECTION ENDPOINTS =====

  @Get('anomalies')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detected anomalies' })
  @ApiQuery({ name: 'severity', required: false, enum: AnomalySeverity })
  @ApiQuery({ name: 'category', required: false, enum: AnomalyCategory })
  @ApiQuery({ name: 'status', required: false, enum: AnomalyStatus })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Anomalies retrieved successfully' })
  async getAnomalies(
    @Headers('authorization') authorization: string,
    @Query('severity') severity?: AnomalySeverity,
    @Query('category') category?: AnomalyCategory,
    @Query('status') status?: AnomalyStatus,
    @Query('days') days: number = 7,
  ): Promise<{
    anomalies: AnomalyResponseDto[];
    summary: {
      total: number;
      critical: number;
      confirmed: number;
      falsePositiveRate: number;
    };
    patterns: Array<{
      type: string;
      frequency: number;
      impact: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    insights: Array<{
      insight: string;
      recommendation: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    const timeRange = {
      start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    const result = await this.biService.detectAnomalies(timeRange);

    // Convert to response format
    const anomalies = result.anomalies.map(anomaly => ({
      id: anomaly.id,
      type: anomaly.type,
      severity: anomaly.severity,
      category: anomaly.category,
      description: anomaly.description,
      detectedAt: anomaly.detectedAt,
      confidence: anomaly.confidence,
      impact: anomaly.impact,
      status: anomaly.status,
      recommendations: anomaly.recommendations,
    }));

    const patterns = result.patterns.map(pattern => ({
      ...pattern,
      trend: 'stable' as const, // Mock trend
    }));

    const insights = [
      {
        insight: 'Transaction anomalies peak during evening hours',
        recommendation: 'Implement enhanced monitoring between 6-10 PM',
        priority: 'high' as const,
      },
      {
        insight: 'False positive rate has decreased by 15% this month',
        recommendation: 'Continue model optimization efforts',
        priority: 'medium' as const,
      },
    ];

    return {
      anomalies,
      summary: result.summary,
      patterns,
      insights: [],
    };
  }

  @Post('anomalies/:anomalyId/investigate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Investigate specific anomaly' })
  @ApiParam({ name: 'anomalyId', description: 'Anomaly ID' })
  @ApiResponse({ status: 200, description: 'Anomaly investigation completed' })
  async investigateAnomaly(
    @Headers('authorization') authorization: string,
    @Param('anomalyId') anomalyId: string,
  ): Promise<{
    anomaly: AnomalyResponseDto;
    analysis: {
      rootCause: string[];
      correlatedEvents: Array<{
        event: string;
        correlation: number;
        timing: string;
      }>;
      impactAssessment: {
        financial: number;
        operational: number;
        customer: number;
      };
      timeline: Array<{
        timestamp: Date;
        event: string;
        impact: number;
      }>;
    };
    recommendations: Array<{
      action: string;
      priority: 'immediate' | 'high' | 'medium' | 'low';
      resources: string[];
      timeline: string;
      estimatedCost: number;
    }>;
    prediction: {
      recurrenceProbability: number;
      potentialImpact: number;
      preventionMeasures: string[];
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Investigating anomaly: ${userId} -> ${anomalyId}`);

    const result = await this.biService.investigateAnomaly(anomalyId);

    const timeline = [
      {
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        event: 'Anomaly first detected',
        impact: 100,
      },
      {
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        event: 'System alert triggered',
        impact: 200,
      },
      {
        timestamp: new Date(),
        event: 'Investigation initiated',
        impact: 0,
      },
    ];

    const enhancedRecommendations = result.recommendations.map(rec => ({
      ...rec,
      estimatedCost: Math.floor(Math.random() * 10000) + 1000,
    }));

    const prediction = {
      recurrenceProbability: 0.15,
      potentialImpact: result.anomaly.impact.financial * 1.5,
      preventionMeasures: [
        'Implement real-time monitoring',
        'Update anomaly detection thresholds',
        'Enhance data validation',
      ],
    };

    return {
      anomaly: {
        id: result.anomaly.id,
        type: result.anomaly.type,
        severity: result.anomaly.severity,
        category: result.anomaly.category,
        description: result.anomaly.description,
        detectedAt: result.anomaly.detectedAt,
        confidence: result.anomaly.confidence,
        impact: result.anomaly.impact,
        status: result.anomaly.status,
        recommendations: result.anomaly.recommendations,
      },
      analysis: {
        ...result.analysis,
        timeline,
      },
      recommendations: enhancedRecommendations,
      prediction,
    };
  }

  // ===== RISK MODELING ENDPOINTS =====

  @Post('risk-assessment')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate customer risk score' })
  @ApiResponse({ status: 200, description: 'Risk assessment completed' })
  async calculateRiskScore(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) riskDto: RiskAssessmentDto,
  ): Promise<{
    customerId: string;
    riskType: RiskType;
    score: number;
    grade: string;
    probability: number;
    factors: Array<{
      name: string;
      value: any;
      contribution: number;
      impact: 'positive' | 'negative';
      description: string;
    }>;
    recommendations: string[];
    monitoring: {
      nextReview: Date;
      triggers: string[];
      frequency: string;
    };
    comparison: {
      peerAverage: number;
      percentile: number;
      trend: 'improving' | 'deteriorating' | 'stable';
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Calculating risk score: ${userId} -> ${riskDto.customerId}`);

    const result = await this.biService.calculateRiskScore(riskDto.customerId, riskDto.riskType);

    const enhancedFactors = result.factors.map(factor => ({
      ...factor,
      description: `Risk factor: ${factor.name}`,
    }));

    const comparison = {
      peerAverage: 720,
      percentile: 75,
      trend: 'stable' as const,
    };

    const monitoring = {
      ...result.monitoring,
      frequency: 'monthly',
    };

    return {
      customerId: riskDto.customerId,
      riskType: riskDto.riskType,
      score: result.score,
      grade: result.grade,
      probability: result.probability,
      factors: enhancedFactors,
      recommendations: result.recommendations,
      monitoring,
      comparison,
    };
  }

  @Get('risk-models')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available risk models' })
  @ApiResponse({ status: 200, description: 'Risk models retrieved' })
  async getRiskModels(
    @Headers('authorization') authorization: string,
  ): Promise<{
    models: Array<{
      id: string;
      name: string;
      type: RiskType;
      description: string;
      performance: {
        accuracy: number;
        gini: number;
        ks: number;
        auc: number;
      };
      lastCalibrated: Date;
      status: string;
    }>;
    performance: {
      averageAccuracy: number;
      totalAssessments: number;
      monthlyVolume: number;
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    const models = [
      {
        id: 'risk_credit_001',
        name: 'Personal Credit Risk Model',
        type: RiskType.CREDIT,
        description: 'Assesses credit default risk for individual customers',
        performance: {
          accuracy: 0.92,
          gini: 0.78,
          ks: 0.65,
          auc: 0.89,
        },
        lastCalibrated: new Date('2024-11-01'),
        status: 'active',
      },
      {
        id: 'risk_fraud_001',
        name: 'Transaction Fraud Detection',
        type: RiskType.FRAUD,
        description: 'Real-time fraud detection for transactions',
        performance: {
          accuracy: 0.95,
          gini: 0.85,
          ks: 0.72,
          auc: 0.93,
        },
        lastCalibrated: new Date('2024-11-15'),
        status: 'active',
      },
    ];

    const performance = {
      averageAccuracy: Object.values(models).reduce((sum, m) => sum + m.performance.accuracy, 0) / Object.values(models).length,
      totalAssessments: 125000,
      monthlyVolume: 15000,
    };

    return {
      models,
      performance,
    };
  }

  // ===== MARKET INTELLIGENCE ENDPOINTS =====

  @Get('market-intelligence')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get market intelligence insights' })
  @ApiResponse({ status: 200, description: 'Market intelligence retrieved' })
  async getMarketIntelligence(
    @Headers('authorization') authorization: string,
  ): Promise<{
    trends: Array<{
      trend: string;
      direction: 'up' | 'down' | 'stable';
      impact: number;
      confidence: number;
      timeframe: string;
      description: string;
    }>;
    opportunities: Array<{
      opportunity: string;
      market: string;
      potential: number;
      competition: number;
      resources: string[];
      timeline: string;
    }>;
    threats: Array<{
      threat: string;
      probability: number;
      impact: number;
      mitigation: string[];
      timeline: string;
    }>;
    predictions: Array<{
      metric: string;
      prediction: number;
      timeframe: string;
      confidence: number;
      methodology: string;
    }>;
    marketPosition: {
      marketShare: number;
      competitiveRanking: number;
      brandStrength: number;
      customerSatisfaction: number;
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    const result = await this.biService.generateMarketInsights();

    const enhancedTrends = result.trends.map(trend => ({
      ...trend,
      description: `Market trend analysis: ${trend.trend}`,
    }));

    const enhancedOpportunities = result.opportunities.map(opp => ({
      ...opp,
      timeline: '6-12 months',
    }));

    const enhancedThreats = result.threats.map(threat => ({
      ...threat,
      timeline: '3-9 months',
    }));

    const enhancedPredictions = result.predictions.map(pred => ({
      ...pred,
      methodology: 'Machine learning ensemble model',
    }));

    const marketPosition = {
      marketShare: 15.2,
      competitiveRanking: 3,
      brandStrength: 78,
      customerSatisfaction: 4.6,
    };

    return {
      trends: enhancedTrends,
      opportunities: enhancedOpportunities,
      threats: enhancedThreats,
      predictions: enhancedPredictions,
      marketPosition,
    };
  }

  // ===== UTILITY ENDPOINTS =====

  @Get('enums')
  @ApiOperation({ summary: 'Get business intelligence related enums' })
  @ApiResponse({ status: 200, description: 'Enums retrieved' })
  async getBIEnums(): Promise<{
    modelTypes: ModelType[];
    modelCategories: ModelCategory[];
    mlAlgorithms: MLAlgorithm[];
    modelStatuses: ModelStatus[];
    anomalyTypes: AnomalyType[];
    anomalySeverities: AnomalySeverity[];
    anomalyCategories: AnomalyCategory[];
    anomalyStatuses: AnomalyStatus[];
    timeHorizons: TimeHorizon[];
    riskTypes: RiskType[];
  }> {
    return {
      modelTypes: Object.values(ModelType),
      modelCategories: Object.values(ModelCategory),
      mlAlgorithms: Object.values(MLAlgorithm),
      modelStatuses: Object.values(ModelStatus),
      anomalyTypes: Object.values(AnomalyType),
      anomalySeverities: Object.values(AnomalySeverity),
      anomalyCategories: Object.values(AnomalyCategory),
      anomalyStatuses: Object.values(AnomalyStatus),
      timeHorizons: Object.values(TimeHorizon),
      riskTypes: Object.values(RiskType),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check business intelligence service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  
  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ description: 'Health status retrieved successfully' })
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    services: {
      dashboardEngine: string;
      metricsCollection: string;
      queryEngine: string;
      realtimeStreaming: string;
      reportGeneration: string;
    };
    performance: {
      averageQueryTime: number;
      cacheHitRate: number;
      memoryUsage: number;
    };
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        dashboardEngine: 'operational',
        metricsCollection: 'operational',
        queryEngine: 'operational',
        realtimeStreaming: 'operational',
        reportGeneration: 'operational',
      },
      performance: {
        averageQueryTime: 245,
        cacheHitRate: 0.89,
        memoryUsage: 0.67,
      },
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  
  private async extractUserId(authorization: string): Promise<string> {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new HttpException('Invalid authorization header', HttpStatus.UNAUTHORIZED);
    }
    // Extract user ID from JWT token
    const token = authorization.substring(7);
    // Mock implementation - replace with actual JWT decode
    return 'mock-user-id';
  }
}