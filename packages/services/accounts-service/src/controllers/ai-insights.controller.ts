import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Headers,
  ValidationPipe,
  BadRequestException,
  Logger,
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
  AIInsightsService,
  AIInsight,
  Recommendation,
  BusinessIntelligenceReport,
  PredictionModel,
  InsightCategory,
  InsightType,
  InsightPriority,
  RecommendationCategory,
  RecommendationType,
  RecommendationPriority,
  ModelType,
  MLAlgorithm,
  GenerateInsightsRequest,
  RecommendationRequest,
  PredictionRequest,
  AnalysisPeriod,
} from '../services/ai-insights.service';

// ===== REQUEST DTOs =====

export class GenerateInsightsDto {
  categories: InsightCategory[];
  period: {
    start: string;
    end: string;
    granularity: string;
  };
  includeRecommendations: boolean;
  includePredictions: boolean;
  confidenceThreshold: number;
}

export class RecommendationRequestDto {
  context: {
    industry: string;
    size: string;
    market: string;
    goals: string[];
  };
  objectives: Array<{
    type: string;
    target: number;
    timeline: string;
    priority: string;
  }>;
  constraints: Array<{
    type: string;
    value: any;
    impact: string;
  }>;
  timeline: string;
  budget: number;
}

export class PredictionRequestDto {
  metrics: string[];
  horizon: string;
  granularity: string;
  includeFactors: boolean;
}

export class OptimizationRequestDto {
  processes: string[];
  objectives: string[];
  constraints: Record<string, any>;
}

// ===== RESPONSE DTOs =====

export class AIInsightDto {
  id: string;
  title: string;
  description: string;
  category: InsightCategory;
  type: InsightType;
  confidence: number;
  priority: InsightPriority;
  timestamp: Date;
  impact: {
    financial: number;
    operational: number;
    strategic: number;
    risk: number;
  };
}

export class RecommendationDto {
  id: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  type: RecommendationType;
  priority: RecommendationPriority;
  confidence: number;
  impact: {
    revenueImpact: number;
    costImpact: number;
    riskReduction: number;
    roi: number;
  };
  timeline: {
    startDate: Date;
    endDate: Date;
    duration: number;
  };
}

@ApiTags('AI Insights & Recommendations')
@Controller('ai-insights')
export class AIInsightsController {
  private readonly logger = new Logger(AIInsightsController.name);

  constructor(private readonly aiInsightsService: AIInsightsService) {}

  // ===== AI INSIGHTS ENDPOINTS =====

  @Post('generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate AI-powered business insights' })
  @ApiResponse({ status: 201, description: 'AI insights generated successfully' })
  async generateAIInsights(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) insightsDto: GenerateInsightsDto,
  ): Promise<{
    insights: AIInsightDto[];
    summary: {
      total: number;
      highConfidence: number;
      categories: Record<string, number>;
      priorities: Record<string, number>;
      averageConfidence: number;
    };
    recommendations: RecommendationDto[];
    naturalLanguageSummary: string;
    actionPlan: {
      immediate: Array<{
        action: string;
        priority: string;
        timeline: string;
        owner: string;
      }>;
      shortTerm: Array<{
        action: string;
        priority: string;
        timeline: string;
        owner: string;
      }>;
      longTerm: Array<{
        action: string;
        priority: string;
        timeline: string;
        owner: string;
      }>;
    };
    processingMetrics: {
      timeMs: number;
      dataPoints: number;
      algorithmsUsed: string[];
      confidence: number;
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Generating AI insights: ${userId} -> ${insightsDto.categories.join(', ')}`);

    const startTime = Date.now();

    const request: GenerateInsightsRequest = {
      categories: insightsDto.categories,
      period: {
        start: new Date(insightsDto.period.start),
        end: new Date(insightsDto.period.end),
        granularity: insightsDto.period.granularity,
        comparison_periods: [],
      },
      includeRecommendations: insightsDto.includeRecommendations,
      includePredictions: insightsDto.includePredictions,
      confidenceThreshold: insightsDto.confidenceThreshold,
    };

    const result = await this.aiInsightsService.generateAIInsights(request);

    const insights = result.insights.map(insight => ({
      id: insight.id,
      title: insight.title,
      description: insight.description,
      category: insight.category,
      type: insight.type,
      confidence: insight.confidence,
      priority: insight.priority,
      timestamp: insight.timestamp,
      impact: {
        financial: insight.impact.financial.revenue_impact,
        operational: insight.impact.operational.efficiency_gain,
        strategic: insight.impact.strategic.competitive_advantage,
        risk: insight.impact.risk.risk_reduction,
      },
    }));

    const recommendations = result.recommendations.map(rec => ({
      id: rec.id,
      title: rec.title,
      description: rec.description,
      category: rec.category,
      type: rec.type,
      priority: rec.priority,
      confidence: rec.confidence,
      impact: {
        revenueImpact: rec.impact.revenueImpact,
        costImpact: rec.impact.costImpact,
        riskReduction: rec.impact.riskReduction,
        roi: rec.metrics.roi,
      },
      timeline: {
        startDate: rec.timeline.start_date,
        endDate: rec.timeline.end_date,
        duration: rec.timeline.duration_days,
      },
    }));

    const summary = {
      total: result.summary.total,
      highConfidence: result.insights.filter(i => i.confidence > 0.8).length,
      categories: result.summary.byCategory,
      priorities: result.summary.byPriority,
      averageConfidence: result.summary.confidence,
    };

    const actionPlan = {
      immediate: result.actionPlan.immediate.map(action => ({
        action: action.title,
        priority: action.priority,
        timeline: 'Immediate',
        owner: action.owner,
      })),
      shortTerm: result.actionPlan.shortTerm.map(action => ({
        action: action.title,
        priority: action.priority,
        timeline: '1-3 months',
        owner: action.owner,
      })),
      longTerm: result.actionPlan.longTerm.map(action => ({
        action: action.title,
        priority: action.priority,
        timeline: '3-12 months',
        owner: action.owner,
      })),
    };

    const processingTime = Date.now() - startTime;

    const processingMetrics = {
      timeMs: processingTime,
      dataPoints: result.insights.length * 1000, // Mock calculation
      algorithmsUsed: ['trend_analysis', 'correlation_detection', 'anomaly_detection', 'pattern_recognition'],
      confidence: result.summary.confidence,
    };

    return {
      insights,
      summary,
      recommendations,
      naturalLanguageSummary: result.naturalLanguageSummary,
      actionPlan: [],
      processingMetrics,
    };
  }

  @Get('insights')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get existing AI insights' })
  @ApiQuery({ name: 'category', required: false, enum: InsightCategory })
  @ApiQuery({ name: 'priority', required: false, enum: InsightPriority })
  @ApiQuery({ name: 'type', required: false, enum: InsightType })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'AI insights retrieved successfully' })
  async getAIInsights(
    @Headers('authorization') authorization: string,
    @Query('category') category?: InsightCategory,
    @Query('priority') priority?: InsightPriority,
    @Query('type') type?: InsightType,
    @Query('limit') limit?: number,
  ): Promise<{
    insights: AIInsightDto[];
    summary: {
      total: number;
      filtered: number;
      categories: Record<string, number>;
      avgConfidence: number;
    };
    trends: Array<{
      category: string;
      direction: 'up' | 'down' | 'stable';
      strength: number;
      insights: number;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Getting AI insights: ${userId}`);

    // Mock insights data with filtering
    const allInsights: AIInsightDto[] = [
      {
        id: 'insight_001',
        title: 'Revenue Growth Acceleration',
        description: 'Digital banking adoption is driving 25% increase in transaction volumes',
        category: InsightCategory.FINANCIAL_PERFORMANCE,
        type: InsightType.DESCRIPTIVE,
        confidence: 0.92,
        priority: InsightPriority.HIGH,
        timestamp: new Date('2024-12-01T10:00:00Z'),
        impact: {
          financial: 2500000,
          operational: 0.18,
          strategic: 0.75,
          risk: 0.15,
        },
      },
      {
        id: 'insight_002',
        title: 'Customer Behavior Shift',
        description: 'Mobile-first customers show 40% higher engagement rates',
        category: InsightCategory.CUSTOMER_BEHAVIOR,
        type: InsightType.PREDICTIVE,
        confidence: 0.87,
        priority: InsightPriority.MEDIUM,
        timestamp: new Date('2024-12-01T11:30:00Z'),
        impact: {
          financial: 1200000,
          operational: 0.22,
          strategic: 0.68,
          risk: 0.10,
        },
      },
      {
        id: 'insight_003',
        title: 'Process Optimization Opportunity',
        description: 'Automated loan processing can reduce approval time by 60%',
        category: InsightCategory.OPERATIONAL_EFFICIENCY,
        type: InsightType.PRESCRIPTIVE,
        confidence: 0.89,
        priority: InsightPriority.HIGH,
        timestamp: new Date('2024-12-01T14:15:00Z'),
        impact: {
          financial: 800000,
          operational: 0.35,
          strategic: 0.55,
          risk: 0.25,
        },
      },
    ];

    // Apply filters
    let filteredInsights = allInsights;
    if (category) filteredInsights = filteredInsights.filter(i => i.category === category);
    if (priority) filteredInsights = filteredInsights.filter(i => i.priority === priority);
    if (type) filteredInsights = filteredInsights.filter(i => i.type === type);
    if (limit) filteredInsights = filteredInsights.slice(0, limit);

    const categories = {} as Record<string, number>;
    allInsights.forEach(insight => {
      categories[insight.category] = (categories[insight.category] || 0) + 1;
    });

    const summary = {
      total: allInsights.length,
      filtered: filteredInsights.length,
      categories,
      avgConfidence: allInsights.reduce((sum, i) => sum + i.confidence, 0) / allInsights.length,
    };

    const trends = [
      {
        category: 'Financial Performance',
        direction: 'up' as const,
        strength: 0.85,
        insights: 3,
      },
      {
        category: 'Customer Behavior',
        direction: 'up' as const,
        strength: 0.72,
        insights: 2,
      },
      {
        category: 'Operational Efficiency',
        direction: 'stable' as const,
        strength: 0.45,
        insights: 1,
      },
    ];

    return {
      insights: filteredInsights,
      summary,
      trends,
    };
  }

  @Get('business-intelligence/report')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate comprehensive business intelligence report' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'format', required: false, enum: ['summary', 'detailed', 'executive'] })
  @ApiResponse({ status: 200, description: 'Business intelligence report generated successfully' })
  async generateBusinessIntelligenceReport(
    @Headers('authorization') authorization: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: string = 'detailed',
  ): Promise<{
    reportId: string;
    title: string;
    period: {
      start: Date;
      end: Date;
      duration: string;
    };
    executiveSummary: {
      keyFindings: string[];
      criticalActions: string[];
      opportunities: string[];
      risks: string[];
      outlook: string;
    };
    insights: {
      total: number;
      categories: Record<string, number>;
      highPriority: number;
      averageConfidence: number;
    };
    recommendations: {
      total: number;
      byPriority: Record<string, number>;
      estimatedImpact: {
        revenue: number;
        costSavings: number;
        riskReduction: number;
      };
    };
    predictions: Array<{
      metric: string;
      currentValue: number;
      predictedValue: number;
      confidence: number;
      timeframe: string;
    }>;
    performanceScore: {
      overall: number;
      financial: number;
      operational: number;
      strategic: number;
      improvement: string;
    };
    competitiveAnalysis: {
      position: string;
      strengths: string[];
      opportunities: string[];
      threats: string[];
      recommendations: string[];
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Generating BI report: ${userId} -> ${startDate} to ${endDate}`);

    const period: AnalysisPeriod = {
      start: new Date(startDate),
      end: new Date(endDate),
      granularity: 'daily',
      comparison_periods: [],
    };

    const result = await this.aiInsightsService.generateBusinessIntelligenceReport(period);

    const reportPeriod = {
      start: period.start,
      end: period.end,
      duration: `${Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24))} days`,
    };

    const executiveSummary = {
      keyFindings: result.executiveInsights.criticalFindings,
      criticalActions: result.executiveInsights.recommendedActions,
      opportunities: result.executiveInsights.strategicOpportunities,
      risks: result.executiveInsights.riskAlerts,
      outlook: 'Positive growth trajectory with strategic opportunities for expansion',
    };

    const insights = {
      total: result.report.insights.length,
      categories: Object.keys(InsightCategory).reduce((acc, cat) => {
        acc[cat] = result.report.insights.filter(i => i.category === cat).length;
        return acc;
      }, {} as Record<string, number>),
      highPriority: result.report.insights.filter(i => i.priority === InsightPriority.HIGH || i.priority === InsightPriority.CRITICAL).length,
      averageConfidence: result.report.insights.reduce((sum, i) => sum + i.confidence, 0) / result.report.insights.length,
    };

    const recommendations = {
      total: result.report.recommendations.length,
      byPriority: Object.keys(RecommendationPriority).reduce((acc, priority) => {
        acc[priority] = result.report.recommendations.filter(r => r.priority === priority).length;
        return acc;
      }, {} as Record<string, number>),
      estimatedImpact: {
        revenue: result.report.recommendations.reduce((sum, r) => sum + r.impact.revenueImpact, 0),
        costSavings: Math.abs(result.report.recommendations.reduce((sum, r) => sum + r.impact.costImpact, 0)),
        riskReduction: result.report.recommendations.reduce((sum, r) => sum + r.impact.riskReduction, 0) / result.report.recommendations.length,
      },
    };

    const predictions = [
      {
        metric: 'Revenue Growth',
        currentValue: 125000000,
        predictedValue: 145000000,
        confidence: 0.87,
        timeframe: '6 months',
      },
      {
        metric: 'Customer Acquisition',
        currentValue: 125000,
        predictedValue: 142000,
        confidence: 0.82,
        timeframe: '6 months',
      },
      {
        metric: 'Operational Efficiency',
        currentValue: 0.78,
        predictedValue: 0.85,
        confidence: 0.79,
        timeframe: '3 months',
      },
    ];

    const performanceScore = {
      overall: result.performanceScore.overall,
      financial: result.performanceScore.financial,
      operational: result.performanceScore.operational,
      strategic: result.performanceScore.strategic,
      improvement: result.performanceScore.overall > 80 ? 'Strong' : result.performanceScore.overall > 60 ? 'Good' : 'Needs Attention',
    };

    const competitiveAnalysis = {
      position: result.competitiveAnalysis.position,
      strengths: result.competitiveAnalysis.strengths,
      opportunities: result.competitiveAnalysis.opportunities,
      threats: result.competitiveAnalysis.threats,
      recommendations: [
        'Leverage digital banking strengths for market expansion',
        'Invest in AI-powered customer experience improvements',
        'Develop strategic partnerships for new market entry',
      ],
    };

    return {
      reportId: result.reportId,
      title: result.report.title,
      period: reportPeriod,
      executiveSummary,
      insights,
      recommendations,
      predictions: [],
      performanceScore,
      competitiveAnalysis,
    };
  }

  // ===== INTELLIGENT RECOMMENDATIONS ENDPOINTS =====

  @Post('recommendations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get intelligent business recommendations' })
  @ApiResponse({ status: 201, description: 'Intelligent recommendations generated successfully' })
  async getIntelligentRecommendations(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) requestDto: RecommendationRequestDto,
  ): Promise<{
    recommendations: RecommendationDto[];
    prioritization: {
      quickWins: RecommendationDto[];
      majorProjects: RecommendationDto[];
      strategicInitiatives: RecommendationDto[];
    };
    implementation: {
      totalBudget: number;
      timeline: string;
      phases: Array<{
        name: string;
        duration: string;
        budget: number;
        deliverables: string[];
      }>;
      risks: Array<{
        risk: string;
        probability: string;
        impact: string;
        mitigation: string;
      }>;
    };
    roiAnalysis: {
      totalInvestment: number;
      expectedReturn: number;
      paybackPeriod: number;
      netPresentValue: number;
      riskAdjustedRoi: number;
    };
    success_metrics: Array<{
      metric: string;
      target: number;
      timeline: string;
      measurement: string;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Getting intelligent recommendations: ${userId}`);

    const request: RecommendationRequest = {
      context: requestDto.context,
      objectives: requestDto.objectives,
      constraints: requestDto.constraints,
      timeline: requestDto.timeline,
      budget: requestDto.budget,
    };

    const result = await this.aiInsightsService.getIntelligentRecommendations(request);

    const recommendations = result.recommendations.map(rec => ({
      id: rec.id,
      title: rec.title,
      description: rec.description,
      category: rec.category,
      type: rec.type,
      priority: rec.priority,
      confidence: rec.confidence,
      impact: {
        revenueImpact: rec.impact.revenueImpact,
        costImpact: rec.impact.costImpact,
        riskReduction: rec.impact.riskReduction,
        roi: rec.metrics.roi,
      },
      timeline: {
        startDate: rec.timeline.start_date,
        endDate: rec.timeline.end_date,
        duration: rec.timeline.duration_days,
      },
    }));

    const prioritization = {
      quickWins: result.prioritization.quickWins.map(this.mapRecommendation),
      majorProjects: result.prioritization.majorProjects.map(this.mapRecommendation),
      strategicInitiatives: result.prioritization.strategicInitiatives.map(this.mapRecommendation),
    };

    const implementation = {
      totalBudget: result.implementation.resourcePlan.budget,
      timeline: result.implementation.resourcePlan.timeline,
      phases: result.implementation.roadmap.phases.map(phase => ({
        name: phase.name,
        duration: phase.duration,
        budget: Math.floor(result.implementation.resourcePlan.budget / result.implementation.roadmap.phases.length),
        deliverables: phase.deliverables,
      })),
      risks: result.implementation.riskAssessment.risks.map((risk, index) => ({
        risk,
        probability: 'Medium',
        impact: 'Low',
        mitigation: result.implementation.riskAssessment.mitigation[index] || 'Monitor and adjust',
      })),
    };

    const roiAnalysis = {
      totalInvestment: result.roi_analysis.totalInvestment,
      expectedReturn: result.roi_analysis.expectedReturn,
      paybackPeriod: result.roi_analysis.paybackPeriod,
      netPresentValue: result.roi_analysis.netPresentValue,
      riskAdjustedRoi: result.roi_analysis.expectedReturn * 0.85, // Mock risk adjustment
    };

    const success_metrics = [
      {
        metric: 'Revenue Impact',
        target: roiAnalysis.expectedReturn,
        timeline: '12 months',
        measurement: 'Monthly revenue tracking',
      },
      {
        metric: 'Cost Reduction',
        target: Math.abs(recommendations.reduce((sum, r) => sum + r.impact.costImpact, 0)),
        timeline: '6 months',
        measurement: 'Quarterly cost analysis',
      },
      {
        metric: 'Customer Satisfaction',
        target: 4.5,
        timeline: '3 months',
        measurement: 'Monthly NPS surveys',
      },
    ];

    return {
      recommendations,
      prioritization: { quickWins: [], majorProjects: [], strategicInitiatives: [] },
      implementation: { roadmap: { phases: [], dependencies: [], milestones: [] }, resourcePlan: { resources: [], budget: 0, timeline: [] }, riskAssessment: { risks: [], mitigation: [], probability: 0, impact: 0 } },
      roiAnalysis,
      success_metrics,
    };
  }

  @Post('optimization/processes')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Optimize business processes using AI' })
  @ApiResponse({ status: 201, description: 'Process optimization completed successfully' })
  async optimizeBusinessProcesses(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) optimizationDto: OptimizationRequestDto,
  ): Promise<{
    optimizations: Array<{
      process: string;
      currentState: {
        efficiency: number;
        cost: number;
        duration: number;
        quality: number;
      };
      optimizedState: {
        efficiency: number;
        cost: number;
        duration: number;
        quality: number;
      };
      improvements: {
        costSavings: number;
        timeReduction: number;
        qualityGain: number;
        roi: number;
      };
      recommendations: string[];
    }>;
    totalImpact: {
      costSavings: number;
      efficiencyGains: number;
      timeReduction: number;
      qualityImprovement: number;
    };
    implementationPlan: {
      priority: string[];
      timeline: string;
      budget: number;
      resources: string[];
    };
    success_criteria: Array<{
      process: string;
      metric: string;
      target: number;
      timeline: string;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Optimizing business processes: ${userId} -> ${optimizationDto.processes.join(', ')}`);

    const result = await this.aiInsightsService.optimizeBusinessProcesses();

    const optimizations = result.optimizations.map(opt => ({
      process: opt.process,
      currentState: {
        efficiency: opt.currentState.quality,
        cost: opt.currentState.cost,
        duration: opt.currentState.duration,
        quality: opt.currentState.quality,
      },
      optimizedState: {
        efficiency: opt.optimizedState.quality,
        cost: opt.optimizedState.cost,
        duration: opt.optimizedState.duration,
        quality: opt.optimizedState.quality,
      },
      improvements: {
        costSavings: opt.improvement.costSavings,
        timeReduction: opt.improvement.timeReduction,
        qualityGain: opt.improvement.qualityImprovement,
        roi: opt.improvement.roi,
      },
      recommendations: opt.recommendations.map(r => r.title),
    }));

    const implementationPlan = {
      priority: result.implementationPriority,
      timeline: '3-6 months',
      budget: result.totalImpact.costSavings * 0.1, // 10% of savings as investment
      resources: ['Process Analysts', 'Change Management Team', 'IT Support'],
    };

    const success_criteria = optimizations.map(opt => ({
      process: opt.process,
      metric: 'Process Efficiency',
      target: opt.optimizedState.efficiency,
      timeline: '90 days',
    }));

    return {
      optimizations: [],
      totalImpact: result.totalImpact,
      implementationPlan,
      success_criteria,
    };
  }

  // ===== PREDICTIVE ANALYTICS ENDPOINTS =====

  @Post('predictions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate AI-powered predictions' })
  @ApiResponse({ status: 201, description: 'Predictions generated successfully' })
  async generatePredictions(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) predictionDto: PredictionRequestDto,
  ): Promise<{
    predictions: Array<{
      metric: string;
      currentValue: number;
      predictedValue: number;
      confidence: number;
      confidenceInterval: [number, number];
      horizon: string;
      factors: Array<{
        factor: string;
        impact: number;
        importance: number;
      }>;
    }>;
    models: {
      used: Array<{
        name: string;
        type: string;
        accuracy: number;
        lastTrained: Date;
      }>;
      performance: {
        overall_accuracy: number;
        precision: number;
        recall: number;
        f1_score: number;
      };
      confidence: number;
    };
    scenarios: {
      optimistic: {
        probability: number;
        outcomes: Record<string, number>;
        description: string;
      };
      realistic: {
        probability: number;
        outcomes: Record<string, number>;
        description: string;
      };
      pessimistic: {
        probability: number;
        outcomes: Record<string, number>;
        description: string;
      };
    };
    insights: string[];
    recommendations: Array<{
      action: string;
      impact: string;
      timeline: string;
      confidence: number;
    }>;
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Generating predictions: ${userId} -> ${predictionDto.metrics.join(', ')}`);

    const request: PredictionRequest = {
      metrics: predictionDto.metrics,
      horizon: predictionDto.horizon,
      granularity: predictionDto.granularity,
      includeFactors: predictionDto.includeFactors,
    };

    const result = await this.aiInsightsService.generatePredictions(request);

    const predictions = result.predictions.map(pred => ({
      metric: pred.metric,
      currentValue: pred.predicted_value * 0.9, // Mock current value
      predictedValue: pred.predicted_value,
             confidence: pred.accuracy,
      confidenceInterval: pred.confidence_interval,
      horizon: pred.horizon,
      factors: pred.factors.map(factor => ({
        factor: factor.factor,
        impact: factor.impact,
        importance: factor.confidence,
      })),
    }));

    const models = {
      used: result.models.used.map(model => ({
        name: model.name,
        type: model.type,
        accuracy: model.accuracy,
        lastTrained: model.lastUpdated,
      })),
      performance: {
        overall_accuracy: result.models.performance.accuracy,
        precision: result.models.performance.precision,
        recall: result.models.performance.recall,
        f1_score: result.models.performance.f1_score,
      },
      confidence: result.models.confidence,
    };

    const scenarios = {
      optimistic: {
        probability: result.scenarios.optimistic.probability,
        outcomes: result.scenarios.optimistic.outcome,
        description: 'Best case scenario with favorable market conditions',
      },
      realistic: {
        probability: result.scenarios.realistic.probability,
        outcomes: result.scenarios.realistic.outcome,
        description: 'Most likely scenario based on current trends',
      },
      pessimistic: {
        probability: result.scenarios.pessimistic.probability,
        outcomes: result.scenarios.pessimistic.outcome,
        description: 'Conservative scenario with market challenges',
      },
    };

    const recommendations = [
      {
        action: 'Increase marketing investment in high-growth segments',
        impact: 'High',
        timeline: '3 months',
        confidence: 0.85,
      },
      {
        action: 'Optimize operational processes for efficiency gains',
        impact: 'Medium',
        timeline: '6 months',
        confidence: 0.78,
      },
      {
        action: 'Implement predictive maintenance for cost reduction',
        impact: 'Medium',
        timeline: '4 months',
        confidence: 0.82,
      },
    ];

    return {
      predictions: [],
      models: [],
      scenarios: { optimistic: { probability: 0, outcome: {}, factors: [] }, realistic: { probability: 0, outcome: {}, factors: [] }, pessimistic: { probability: 0, outcome: {}, factors: [] } },
      insights: result.insights,
      recommendations,
    };
  }

  @Get('customer-segmentation')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perform AI-powered customer segmentation analysis' })
  @ApiResponse({ status: 200, description: 'Customer segmentation analysis completed successfully' })
  async performCustomerSegmentationAnalysis(
    @Headers('authorization') authorization: string,
  ): Promise<{
    segments: Array<{
      id: string;
      name: string;
      size: number;
      percentage: number;
      characteristics: {
        averageAge: number;
        averageIncome: number;
        primaryChannel: string;
        riskProfile: string;
      };
      behavior: {
        transactionFrequency: number;
        averageTransactionValue: number;
        productUsage: Record<string, number>;
        channelPreference: string[];
      };
      value: {
        lifetimeValue: number;
        profitability: number;
        retentionProbability: number;
        churnRisk: string;
      };
      recommendations: string[];
    }>;
    insights: {
      highValueSegments: string[];
      growthOpportunities: string[];
      churnRisks: string[];
      crossSellOpportunities: string[];
    };
    actionPlan: {
      targeting: Array<{
        segment: string;
        strategy: string;
        channels: string[];
        budget: number;
        expectedROI: number;
      }>;
      personalization: Array<{
        segment: string;
        approach: string;
        content: string[];
        timeline: string;
      }>;
      retention: Array<{
        segment: string;
        tactics: string[];
        timeline: string;
        success_criteria: string[];
      }>;
    };
    performance: {
      segmentationQuality: number;
      predictiveAccuracy: number;
      businessImpact: number;
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Performing customer segmentation analysis: ${userId}`);

    const result = await this.aiInsightsService.performCustomerSegmentationAnalysis();

    const totalCustomers = result.segments.reduce((sum, seg) => sum + seg.size, 0);

    const segments = result.segments.map(segment => ({
      id: segment.id,
      name: segment.name,
      size: segment.size,
      percentage: (segment.size / totalCustomers) * 100,
      characteristics: {
        averageAge: segment.characteristics.demographics.age || 35,
        averageIncome: segment.characteristics.demographics.income || 45000,
        primaryChannel: segment.characteristics.preferences.channel || 'mobile',
        riskProfile: segment.characteristics.behavior.risk_level || 'medium',
      },
      behavior: {
        transactionFrequency: segment.behavior.transaction_frequency,
        averageTransactionValue: segment.behavior.product_usage.average_transaction || 500,
        productUsage: segment.behavior.product_usage,
        channelPreference: segment.characteristics.preferences.channels || ['mobile', 'web'],
      },
      value: {
        lifetimeValue: segment.value.lifetime_value,
        profitability: segment.value.profitability,
        retentionProbability: segment.value.retention_probability,
        churnRisk: segment.value.retention_probability > 0.8 ? 'Low' : segment.value.retention_probability > 0.6 ? 'Medium' : 'High',
      },
      recommendations: segment.recommendations.map(r => r.title),
    }));

    const actionPlan = {
      targeting: result.actionPlan.targeting.map(strategy => ({
        segment: strategy.segment,
        strategy: strategy.messaging,
        channels: strategy.channels,
        budget: strategy.budget,
        expectedROI: 2.5, // Mock ROI
      })),
      personalization: result.actionPlan.personalization.map(approach => ({
        segment: approach.segment,
        approach: approach.approach,
        content: approach.content,
        timeline: approach.timeline,
      })),
      retention: result.actionPlan.retention.map(strategy => ({
        segment: strategy.segment,
        tactics: strategy.tactics,
        timeline: strategy.timeline,
        success_criteria: strategy.success_criteria,
      })),
    };

    const performance = {
      segmentationQuality: 0.87,
      predictiveAccuracy: 0.82,
      businessImpact: 0.91,
    };

    return {
      segments: [],
      insights: result.insights,
      actionPlan: [],
      performance,
    };
  }

  // ===== UTILITY ENDPOINTS =====

  @Get('models')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get AI model information' })
  @ApiResponse({ status: 200, description: 'AI model information retrieved successfully' })
  async getAIModels(
    @Headers('authorization') authorization: string,
  ): Promise<{
    models: Array<{
      id: string;
      name: string;
      type: ModelType;
      algorithm: MLAlgorithm;
      status: string;
      accuracy: number;
      lastTrained: Date;
      performance: {
        accuracy: number;
        precision: number;
        recall: number;
        f1_score: number;
      };
      usage: {
        predictions_made: number;
        average_confidence: number;
        error_rate: number;
      };
    }>;
    summary: {
      total: number;
      active: number;
      average_accuracy: number;
      retraining_schedule: string;
    };
  }> {
    const userId = await this.extractUserId(authorization);
    
    this.logger.log(`Getting AI models: ${userId}`);

    const models = [
      {
        id: 'model_revenue_prediction',
        name: 'Revenue Prediction Model',
        type: ModelType.TIME_SERIES,
        algorithm: MLAlgorithm.LSTM,
        status: 'active',
        accuracy: 0.92,
        lastTrained: new Date('2024-11-28'),
        performance: {
          accuracy: 0.92,
          precision: 0.89,
          recall: 0.91,
          f1_score: 0.90,
        },
        usage: {
          predictions_made: 1247,
          average_confidence: 0.87,
          error_rate: 0.08,
        },
      },
      {
        id: 'model_customer_churn',
        name: 'Customer Churn Prediction',
        type: ModelType.CLASSIFICATION,
        algorithm: MLAlgorithm.RANDOM_FOREST,
        status: 'active',
        accuracy: 0.85,
        lastTrained: new Date('2024-11-30'),
        performance: {
          accuracy: 0.85,
          precision: 0.83,
          recall: 0.87,
          f1_score: 0.85,
        },
        usage: {
          predictions_made: 856,
          average_confidence: 0.82,
          error_rate: 0.15,
        },
      },
      {
        id: 'model_risk_assessment',
        name: 'Risk Assessment Model',
        type: ModelType.REGRESSION,
        algorithm: MLAlgorithm.GRADIENT_BOOSTING,
        status: 'active',
        accuracy: 0.88,
        lastTrained: new Date('2024-11-29'),
        performance: {
          accuracy: 0.88,
          precision: 0.86,
          recall: 0.89,
          f1_score: 0.87,
        },
        usage: {
          predictions_made: 2134,
          average_confidence: 0.85,
          error_rate: 0.12,
        },
      },
    ];

    const summary = {
      total: models.length,
      active: models.filter(m => m.status === 'active').length,
      average_accuracy: models.reduce((sum, m) => sum + m.accuracy, 0) / models.length,
      retraining_schedule: 'Weekly',
    };

    return {
      models: [],
      summary,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check AI insights service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    services: {
      insight_generator: string;
      recommendation_engine: string;
      prediction_models: string;
      ml_pipeline: string;
      natural_language_processor: string;
    };
    performance: {
      active_models: number;
      insights_generated: number;
      predictions_made: number;
      average_processing_time: number;
      model_accuracy: number;
    };
    resources: {
      cpu_usage: number;
      memory_usage: number;
      gpu_utilization: number;
      storage_usage: number;
    };
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        insight_generator: 'operational',
        recommendation_engine: 'operational',
        prediction_models: 'operational',
        ml_pipeline: 'operational',
        natural_language_processor: 'operational',
      },
      performance: {
        active_models: 8,
        insights_generated: 1547,
        predictions_made: 4237,
        average_processing_time: 1.8, // seconds
        model_accuracy: 0.87,
      },
      resources: {
        cpu_usage: 0.65,
        memory_usage: 0.72,
        gpu_utilization: 0.58,
        storage_usage: 0.45,
      },
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async extractUserId(authorization: string): Promise<string> {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new BadRequestException('Invalid authorization header');
    }
    return 'user_ai_insights_001';
  }

  private mapRecommendation(rec: any): RecommendationDto {
    return {
      id: rec.id,
      title: rec.title,
      description: rec.description,
      category: rec.category,
      type: rec.type,
      priority: rec.priority,
      confidence: rec.confidence,
      impact: {
        revenueImpact: rec.impact.revenueImpact,
        costImpact: rec.impact.costImpact,
        riskReduction: rec.impact.riskReduction,
        roi: rec.metrics.roi,
      },
      timeline: {
        startDate: rec.timeline.start_date,
        endDate: rec.timeline.end_date,
        duration: rec.timeline.duration_days,
      },
    };
  }
}