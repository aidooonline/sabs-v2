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
  MobileEducationService,
  EducationContent,
  LearningPath,
  UserProgress,
  FinancialInsight,
  BudgetPlan,
  FinancialWellness,
  ContentType,
  ContentCategory,
  DifficultyLevel,
  ProgressType,
  ProgressStatus,
  InsightType,
  BudgetType,
  BudgetPeriod,
  BudgetStatus,
  Priority,
  CreateBudgetRequest,
  TrackProgressRequest,
  FinancialGoalRequest,
} from '../services/mobile-education.service';

// ===== REQUEST DTOs =====

export class TrackProgressDto {
  contentId?: string;
  pathId?: string;
  type: ProgressType;
  progress: number;
  timeSpent: number;
  completed?: boolean;
  score?: number;
  notes?: string;
}

export class CreateBudgetDto {
  name: string;
  type: BudgetType;
  period: BudgetPeriod;
  totalIncome: number;
  categories: Array<{
    name: string;
    type: 'income' | 'expense';
    budgetAmount: number;
    color: string;
    isEssential: boolean;
  }>;
}

export class FinancialGoalDto {
  title: string;
  description: string;
  targetScore: number;
  deadline: string;
  category: string;
}

export class ContentFiltersDto {
  type?: ContentType;
  category?: ContentCategory;
  difficulty?: DifficultyLevel;
  search?: string;
  limit?: number;
  offset?: number;
}

// ===== RESPONSE DTOs =====

export class ProgressTrackingResponseDto {
  progressId: string;
  overallProgress: number;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    points: number;
  }>;
  points: number;
  message: string;
}

export class BudgetCreationResponseDto {
  budgetId: string;
  totalBudget: number;
  categoriesCount: number;
  recommendations: string[];
  message: string;
}

export class EducationOverviewDto {
  content: EducationContent[];
  categories: ContentCategory[];
  featured: EducationContent[];
  trending: EducationContent[];
  personalized: EducationContent[];
  stats: {
    totalContent: number;
    totalViews: number;
    averageRating: number;
    completionRate: number;
  };
}

export class LearningPathsDto {
  paths: Array<LearningPath & {
    enrollmentStatus: 'not_enrolled' | 'enrolled' | 'completed';
    userProgress: number;
  }>;
  categories: ContentCategory[];
  recommended: LearningPath[];
  achievements: Array<{
    name: string;
    description: string;
    requirement: string;
    progress: number;
  }>;
}

export class PersonalInsightsDto {
  insights: Array<FinancialInsight & {
    daysRemaining: number;
    actionTaken: boolean;
  }>;
  summary: {
    totalInsights: number;
    opportunities: number;
    warnings: number;
    achievements: number;
  };
  trendAnalysis: {
    spending: string;
    saving: string;
    income: string;
  };
  smartTips: string[];
}

export class FinancialWellnessDto {
  wellness: FinancialWellness;
  comparison: {
    previousScore: number;
    improvement: number;
    ranking: string;
    percentile: number;
  };
  actionPlan: Array<{
    action: string;
    impact: number;
    timeframe: string;
    difficulty: string;
  }>;
}

export class BudgetAnalysisDto {
  budget: BudgetPlan;
  analytics: {
    spendingTrends: Array<{ date: Date; amount: number; category: string }>;
    categoryPerformance: Array<{ 
      category: string; 
      budgeted: number; 
      spent: number; 
      variance: number; 
      status: 'under' | 'on_track' | 'over';
    }>;
    projections: {
      monthEnd: number;
      yearEnd: number;
      savingsPotential: number;
    };
  };
  recommendations: string[];
  alerts: Array<{
    type: string;
    message: string;
    severity: string;
    action: string;
  }>;
}

@ApiTags('Mobile Financial Education')
@Controller('mobile-education')
export class MobileEducationController {
  private readonly logger = new Logger(MobileEducationController.name);

  constructor(private readonly educationService: MobileEducationService) {}

  // ===== EDUCATION CONTENT ENDPOINTS =====

  @Get('content')
  @ApiOperation({ summary: 'Get financial education content' })
  @ApiQuery({ name: 'type', required: false, enum: ContentType })
  @ApiQuery({ name: 'category', required: false, enum: ContentCategory })
  @ApiQuery({ name: 'difficulty', required: false, enum: DifficultyLevel })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Education content retrieved', type: EducationOverviewDto })
  async getEducationContent(
    @Query() filters: ContentFiltersDto,
  ): Promise<EducationOverviewDto> {
    const result = await this.educationService.getEducationContent(filters);
    
    // Calculate statistics
    const stats = {
      totalContent: result.content.length,
      totalViews: result.content.reduce((sum, c) => sum + c.views, 0),
      averageRating: result.content.reduce((sum, c) => sum + c.rating, 0) / result.content.length,
      completionRate: result.content.reduce((sum, c) => sum + (c.completions / c.views), 0) / result.content.length * 100,
    };

    return {
      ...result,
      stats,
    };
  }

  @Get('content/:contentId')
  @ApiOperation({ summary: 'Get specific content details' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiResponse({ status: 200, description: 'Content details retrieved' })
  async getContentDetails(
    @Param('contentId') contentId: string,
    @Headers('authorization') authorization?: string,
  ): Promise<{
    content: EducationContent;
    relatedContent: EducationContent[];
    userProgress?: UserProgress;
    quiz?: {
      id: string;
      questions: number;
      passingScore: number;
      attempts: number;
      bestScore?: number;
    };
    comments: Array<{
      author: string;
      rating: number;
      comment: string;
      date: Date;
      helpful: number;
    }>;
  }> {
    // Mock implementation
    return {
      content: {
        id: contentId,
        title: 'Budgeting Basics: Your First Step to Financial Freedom',
        type: ContentType.ARTICLE,
        category: ContentCategory.BUDGETING,
        difficulty: DifficultyLevel.BEGINNER,
        description: 'Learn the fundamentals of creating and maintaining a personal budget',
        content: 'Complete comprehensive guide to budgeting with practical examples...',
        readTime: 8,
        thumbnailUrl: '/images/budget-basics.jpg',
        tags: ['budgeting', 'finance', 'beginners', 'money management'],
        author: 'Sarah Finance Expert',
        publishedAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-11-01'),
        isActive: true,
        views: 15420,
        rating: 4.7,
        completions: 8945,
      },
      relatedContent: [
        {
          id: 'budget_advanced_001',
          title: 'Advanced Budgeting Strategies',
          type: ContentType.VIDEO,
          category: ContentCategory.BUDGETING,
          difficulty: DifficultyLevel.INTERMEDIATE,
          description: 'Take your budgeting skills to the next level',
          content: '',
          readTime: 0,
          videoDuration: 15,
          thumbnailUrl: '/images/advanced-budget.jpg',
          tags: ['budgeting', 'advanced'],
          author: 'Sarah Finance Expert',
          publishedAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          views: 8930,
          rating: 4.6,
          completions: 5240,
        },
      ],
      userProgress: authorization ? {
        id: 'progress_001',
        customerId: 'cust_demo_001',
        contentId,
        type: ProgressType.CONTENT,
        status: ProgressStatus.IN_PROGRESS,
        progress: 65,
        timeSpent: 5,
        lastAccessed: new Date(),
        achievements: [],
        notes: 'Great explanations!',
      } : undefined,
      quiz: {
        id: 'quiz_budget_001',
        questions: 10,
        passingScore: 70,
        attempts: 2,
        bestScore: 85,
      },
      comments: [
        {
          author: 'John D.',
          rating: 5,
          comment: 'Excellent content! Really helped me understand budgeting basics.',
          date: new Date('2024-11-20'),
          helpful: 24,
        },
        {
          author: 'Mary K.',
          rating: 4,
          comment: 'Good practical examples. Would love more interactive elements.',
          date: new Date('2024-11-18'),
          helpful: 18,
        },
      ],
    };
  }

  @Get('learning-paths')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get learning paths' })
  @ApiQuery({ name: 'category', required: false, enum: ContentCategory })
  @ApiResponse({ status: 200, description: 'Learning paths retrieved', type: LearningPathsDto })
  async getLearningPaths(
    @Headers('authorization') authorization: string,
    @Query('category') category?: ContentCategory,
  ): Promise<LearningPathsDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const result = await this.educationService.getLearningPaths(category);
    
    // Enhance paths with user progress
    const enhancedPaths = result.paths.map(path => ({
      ...path,
      enrollmentStatus: 'not_enrolled' as const,
      userProgress: Math.floor(Math.random() * 100), // Mock progress
    }));

    const achievements = [
      {
        name: 'Learning Enthusiast',
        description: 'Complete 3 learning paths',
        requirement: '3 paths completed',
        progress: 33,
      },
      {
        name: 'Financial Scholar',
        description: 'Achieve 90% average on all quizzes',
        requirement: '90% quiz average',
        progress: 87,
      },
    ];

    return {
      paths: enhancedPaths,
      categories: result.categories,
      recommended: result.recommended,
      achievements,
    };
  }

  @Post('progress')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track learning progress' })
  @ApiResponse({ status: 201, description: 'Progress tracked successfully', type: ProgressTrackingResponseDto })
  async trackProgress(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) progressDto: TrackProgressDto,
  ): Promise<ProgressTrackingResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Tracking progress: ${customerId} -> ${progressDto.type}`);

    const request: TrackProgressRequest = {
      contentId: progressDto.contentId,
      pathId: progressDto.pathId,
      type: progressDto.type,
      progress: progressDto.progress,
      timeSpent: progressDto.timeSpent,
      completed: progressDto.completed,
      score: progressDto.score,
      notes: progressDto.notes,
    };

    const result = await this.educationService.trackLearningProgress(customerId, request);

    return {
      ...result,
      message: result.achievements.length > 0 
        ? `Congratulations! You earned ${result.achievements.length} achievement(s)!`
        : 'Progress updated successfully',
    };
  }

  @Get('progress')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user learning progress' })
  @ApiResponse({ status: 200, description: 'Learning progress retrieved' })
  async getUserProgress(
    @Headers('authorization') authorization: string,
  ): Promise<{
    overallProgress: number;
    totalPoints: number;
    completedContent: number;
    activePaths: number;
    recentActivity: Array<{
      contentTitle: string;
      type: string;
      progress: number;
      lastAccessed: Date;
    }>;
    achievements: Array<{
      name: string;
      description: string;
      icon: string;
      earnedAt: Date;
      points: number;
    }>;
    streaks: {
      currentStreak: number;
      longestStreak: number;
      lastActivity: Date;
    };
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock implementation
    return {
      overallProgress: 68,
      totalPoints: 1250,
      completedContent: 12,
      activePaths: 2,
      recentActivity: [
        {
          contentTitle: 'Budgeting Basics',
          type: 'article',
          progress: 100,
          lastAccessed: new Date('2024-11-28'),
        },
        {
          contentTitle: 'Emergency Fund Guide',
          type: 'video',
          progress: 75,
          lastAccessed: new Date('2024-11-27'),
        },
      ],
      achievements: [
        {
          name: 'First Steps',
          description: 'Completed your first financial course',
          icon: '🎯',
          earnedAt: new Date('2024-11-20'),
          points: 100,
        },
        {
          name: 'Quiz Master',
          description: 'Scored 90% or higher on 5 quizzes',
          icon: '🧠',
          earnedAt: new Date('2024-11-25'),
          points: 150,
        },
      ],
      streaks: {
        currentStreak: 7,
        longestStreak: 14,
        lastActivity: new Date(),
      },
    };
  }

  // ===== FINANCIAL INSIGHTS ENDPOINTS =====

  @Get('insights')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personalized financial insights' })
  @ApiResponse({ status: 200, description: 'Financial insights retrieved', type: PersonalInsightsDto })
  async getPersonalInsights(
    @Headers('authorization') authorization: string,
  ): Promise<PersonalInsightsDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const result = await this.educationService.generatePersonalInsights(customerId);
    
    // Enhance insights with additional data
    const enhancedInsights = result.insights.map(insight => {
      const daysRemaining = Math.ceil((insight.validUntil.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      return {
        ...insight,
        daysRemaining,
        actionTaken: Math.random() > 0.7, // Mock action status
      };
    });

    const smartTips = [
      'You could save GHS 150/month by reducing dining out expenses',
      'Setting up automatic transfers can boost your savings by 25%',
      'Your spending patterns show you\'re great at sticking to budgets',
      'Consider increasing your emergency fund to 6 months of expenses',
    ];

    return {
      insights: enhancedInsights,
      summary: result.summary,
      trendAnalysis: {
        spending: result.trendAnalysis.spending,
        saving: result.trendAnalysis.saving,
        income: result.trendAnalysis.income,
      },
      smartTips,
    };
  }

  @Get('recommendations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personalized recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved' })
  async getPersonalizedRecommendations(
    @Headers('authorization') authorization: string,
  ): Promise<{
    recommendations: Array<{
      type: string;
      title: string;
      description: string;
      priority: Priority;
      contentIds: string[];
      estimatedTime: number;
      potentialSavings?: number;
      completionBenefit: string;
    }>;
    learningGoals: Array<{
      goal: string;
      progress: number;
      target: number;
      deadline: Date;
    }>;
    nextSteps: Array<{
      step: string;
      description: string;
      difficulty: 'easy' | 'medium' | 'hard';
      timeRequired: number;
    }>;
    motivationalQuote: {
      quote: string;
      author: string;
      category: string;
    };
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    const result = await this.educationService.getPersonalizedRecommendations(customerId);
    
    const enhancedRecommendations = result.recommendations.map(rec => ({
      ...rec,
      completionBenefit: rec.potentialSavings 
        ? `Save up to GHS ${rec.potentialSavings} annually`
        : 'Improve your financial knowledge and confidence',
    }));

    const learningGoals = result.learningGoals.map((goal, index) => ({
      goal,
      progress: 40 + index * 15,
      target: 100,
      deadline: new Date(Date.now() + (30 + index * 15) * 24 * 60 * 60 * 1000),
    }));

    const nextSteps = result.nextSteps.map((step, index) => ({
      step,
      description: `Take action on ${step.toLowerCase()}`,
      difficulty: ['easy', 'medium', 'hard'][index % 3] as 'easy' | 'medium' | 'hard',
      timeRequired: 15 + index * 10,
    }));

    return {
      recommendations: enhancedRecommendations,
      learningGoals,
      nextSteps,
      motivationalQuote: {
        quote: 'The best time to plant a tree was 20 years ago. The second best time is now.',
        author: 'Chinese Proverb',
        category: 'Investing',
      },
    };
  }

  // ===== BUDGETING TOOLS ENDPOINTS =====

  @Post('budgets')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({ status: 201, description: 'Budget created successfully', type: BudgetCreationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid budget data' })
  async createBudget(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) budgetDto: CreateBudgetDto,
  ): Promise<BudgetCreationResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Creating budget: ${customerId} -> ${budgetDto.name}`);

    // Validate total percentages for percentage-based budgets
    if (budgetDto.type === BudgetType.PERCENTAGE) {
      const totalPercentage = budgetDto.categories.reduce(
        (sum, cat) => sum + (cat.budgetAmount / budgetDto.totalIncome) * 100, 0
      );
      if (totalPercentage > 105) { // Allow 5% buffer
        throw new BadRequestException('Total budget percentages exceed 105% of income');
      }
    }

    const request: CreateBudgetRequest = {
      name: budgetDto.name,
      type: budgetDto.type,
      period: budgetDto.period,
      totalIncome: budgetDto.totalIncome,
      categories: budgetDto.categories.map(cat => ({
        name: cat.name,
        type: cat.type,
        budgetAmount: cat.budgetAmount,
        percentage: (cat.budgetAmount / budgetDto.totalIncome) * 100,
        color: cat.color,
        isEssential: cat.isEssential,
      })),
    };

    const result = await this.educationService.createBudget(customerId, request);

    return {
      ...result,
      message: 'Budget created successfully! Start tracking your expenses to see how you\'re doing.',
    };
  }

  @Get('budgets')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user budgets' })
  @ApiResponse({ status: 200, description: 'Budgets retrieved' })
  async getUserBudgets(
    @Headers('authorization') authorization: string,
  ): Promise<{
    budgets: Array<BudgetPlan & {
      daysRemaining: number;
      overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
      savingsRate: number;
    }>;
    summary: {
      totalBudgets: number;
      activeBudgets: number;
      totalMonthlyIncome: number;
      totalMonthlyBudget: number;
      averageSavingsRate: number;
    };
    quickActions: Array<{
      action: string;
      description: string;
      icon: string;
      priority: Priority;
    }>;
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock budgets data
    const budgets = [
      {
        id: 'budget_001',
        customerId,
        name: 'Monthly Budget - December 2024',
        type: BudgetType.PERCENTAGE,
        period: BudgetPeriod.MONTHLY,
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-31'),
        totalIncome: 4500,
        totalBudget: 4200,
        totalSpent: 2100,
        categories: [],
                 status: BudgetStatus.ACTIVE,
        alerts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        daysRemaining: 3,
        overallHealth: 'good' as const,
        savingsRate: 6.7,
      },
    ];

    return {
      budgets,
      summary: {
        totalBudgets: 1,
        activeBudgets: 1,
        totalMonthlyIncome: 4500,
        totalMonthlyBudget: 4200,
        averageSavingsRate: 6.7,
      },
      quickActions: [
        {
          action: 'Add Expense',
          description: 'Log a new expense to track spending',
          icon: '➕',
          priority: Priority.HIGH,
        },
        {
          action: 'Review Categories',
          description: 'Adjust budget categories for next month',
          icon: '📊',
          priority: Priority.MEDIUM,
        },
        {
          action: 'Set Goals',
          description: 'Create savings and spending goals',
          icon: '🎯',
          priority: Priority.MEDIUM,
        },
      ],
    };
  }

  @Get('budgets/:budgetId/analysis')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed budget analysis' })
  @ApiParam({ name: 'budgetId', description: 'Budget ID' })
  @ApiResponse({ status: 200, description: 'Budget analysis retrieved', type: BudgetAnalysisDto })
  async getBudgetAnalysis(
    @Headers('authorization') authorization: string,
    @Param('budgetId') budgetId: string,
  ): Promise<BudgetAnalysisDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const result = await this.educationService.getBudgetAnalysis(customerId, budgetId);
    
    const alerts = [
      {
        type: 'overspend',
        message: 'Dining out category is 15% over budget',
        severity: 'warning',
        action: 'Consider cooking more meals at home',
      },
      {
        type: 'target_reached',
        message: 'Congratulations! You\'ve reached your savings target',
        severity: 'info',
        action: 'Consider increasing your savings goal',
      },
    ];

    return {
      ...result,
      alerts,
    };
  }

  // ===== FINANCIAL WELLNESS ENDPOINTS =====

  @Get('wellness')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get financial wellness score' })
  @ApiResponse({ status: 200, description: 'Financial wellness retrieved', type: FinancialWellnessDto })
  async getFinancialWellness(
    @Headers('authorization') authorization: string,
  ): Promise<FinancialWellnessDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const wellness = await this.educationService.calculateFinancialWellness(customerId);
    
    const comparison = {
      previousScore: 720, // Mock previous score
      improvement: wellness.overallScore - 720,
      ranking: 'Top 25%',
      percentile: 75,
    };

    const actionPlan = [
      {
        action: 'Increase Emergency Fund',
        impact: 15,
        timeframe: '3 months',
        difficulty: 'Medium',
      },
      {
        action: 'Optimize Investment Portfolio',
        impact: 25,
        timeframe: '6 months',
        difficulty: 'Hard',
      },
      {
        action: 'Improve Credit Score',
        impact: 10,
        timeframe: '12 months',
        difficulty: 'Medium',
      },
    ];

    return {
      wellness,
      comparison,
      actionPlan,
    };
  }

  @Post('wellness/goals')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set financial wellness goal' })
  @ApiResponse({ status: 201, description: 'Wellness goal set successfully' })
  async setWellnessGoal(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) goalDto: FinancialGoalDto,
  ): Promise<{
    goalId: string;
    currentScore: number;
    targetScore: number;
    timeframe: number;
    milestones: Array<{
      score: number;
      description: string;
      estimatedDate: Date;
    }>;
    message: string;
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Setting wellness goal: ${customerId} -> ${goalDto.title}`);

    const goalId = `goal_${Date.now()}`;
    const currentScore = 735; // Mock current score
    const timeframeDays = Math.ceil((new Date(goalDto.deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

    const milestones = [
      {
        score: currentScore + (goalDto.targetScore - currentScore) * 0.25,
        description: 'First quarter milestone',
        estimatedDate: new Date(Date.now() + timeframeDays * 0.25 * 24 * 60 * 60 * 1000),
      },
      {
        score: currentScore + (goalDto.targetScore - currentScore) * 0.5,
        description: 'Halfway milestone',
        estimatedDate: new Date(Date.now() + timeframeDays * 0.5 * 24 * 60 * 60 * 1000),
      },
      {
        score: currentScore + (goalDto.targetScore - currentScore) * 0.75,
        description: 'Three-quarter milestone',
        estimatedDate: new Date(Date.now() + timeframeDays * 0.75 * 24 * 60 * 60 * 1000),
      },
    ];

    return {
      goalId,
      currentScore,
      targetScore: goalDto.targetScore,
      timeframe: timeframeDays,
      milestones,
      message: 'Financial wellness goal set! We\'ll track your progress and provide recommendations.',
    };
  }

  // ===== CALCULATORS ENDPOINTS =====

  @Get('calculators')
  @ApiOperation({ summary: 'Get financial calculators' })
  @ApiResponse({ status: 200, description: 'Calculators retrieved' })
  async getFinancialCalculators(): Promise<{
    calculators: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      inputs: Array<{
        name: string;
        type: string;
        label: string;
        required: boolean;
        min?: number;
        max?: number;
      }>;
      outputs: string[];
      popularity: number;
      difficulty: string;
    }>;
    categories: string[];
    featured: string[];
  }> {
    const result = await this.educationService.getFinancialCalculators();
    
    const enhancedCalculators = result.calculators.map(calc => ({
      ...calc,
      popularity: Math.floor(Math.random() * 100) + 50,
      difficulty: calc.category === 'Budgeting' ? 'Easy' : calc.category === 'Loans' ? 'Medium' : 'Hard',
    }));

    return {
      calculators: enhancedCalculators,
      categories: result.categories,
      featured: ['budget_calculator', 'savings_calculator'],
    };
  }

  @Post('calculators/:calculatorId/calculate')
  @ApiOperation({ summary: 'Perform calculation' })
  @ApiParam({ name: 'calculatorId', description: 'Calculator ID' })
  @ApiResponse({ status: 200, description: 'Calculation completed' })
  async performCalculation(
    @Param('calculatorId') calculatorId: string,
    @Body() inputs: Record<string, number>,
  ): Promise<{
    results: Record<string, any>;
    visualization: Array<{
      type: 'chart' | 'table' | 'progress';
      data: any;
      title: string;
    }>;
    recommendations: string[];
    saveToProfile?: boolean;
  }> {
    this.logger.log(`Calculation: ${calculatorId} with inputs ${JSON.stringify(inputs)}`);

    // Mock calculation results based on calculator type
    if (calculatorId === 'budget_calculator') {
      const totalExpenses = (inputs.rent || 0) + (inputs.utilities || 0) + (inputs.food || 0) + (inputs.transport || 0);
      const remainingIncome = inputs.income - totalExpenses;
      const savingsRate = (remainingIncome / inputs.income) * 100;

      return {
        results: {
          'Total Expenses': totalExpenses,
          'Remaining Income': remainingIncome,
          'Savings Potential': remainingIncome,
          'Savings Rate': `${savingsRate.toFixed(1)}%`,
        },
        visualization: [
          {
            type: 'chart',
            data: {
              labels: ['Rent', 'Utilities', 'Food', 'Transport', 'Savings'],
              values: [inputs.rent || 0, inputs.utilities || 0, inputs.food || 0, inputs.transport || 0, remainingIncome],
            },
            title: 'Budget Breakdown',
          },
        ],
        recommendations: [
          savingsRate < 10 ? 'Try to save at least 10% of your income' : 'Great savings rate!',
          'Consider automating your savings',
          'Review your budget monthly',
        ],
      };
    }

    return {
      results: { message: 'Calculation completed' },
      visualization: [],
      recommendations: [],
    };
  }

  // ===== GAMIFICATION ENDPOINTS =====

  @Get('achievements')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user achievements and leaderboard' })
  @ApiResponse({ status: 200, description: 'Achievements retrieved' })
  async getAchievements(
    @Headers('authorization') authorization: string,
  ): Promise<{
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      category: string;
      earnedAt?: Date;
      progress?: number;
      requirement: string;
      points: number;
      rarity: 'common' | 'rare' | 'epic' | 'legendary';
    }>;
    stats: {
      totalPoints: number;
      totalAchievements: number;
      rank: number;
      level: string;
      nextLevelPoints: number;
    };
    leaderboard: Array<{
      rank: number;
      name: string;
      points: number;
      achievements: number;
    }>;
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    return {
      achievements: [
        {
          id: 'first_budget',
          name: 'Budget Builder',
          description: 'Created your first budget',
          icon: '💰',
          category: 'Budgeting',
          earnedAt: new Date('2024-11-20'),
          requirement: 'Create 1 budget',
          points: 100,
          rarity: 'common',
        },
        {
          id: 'quiz_master',
          name: 'Quiz Master',
          description: 'Scored 90%+ on 5 quizzes',
          icon: '🧠',
          category: 'Learning',
          earnedAt: new Date('2024-11-25'),
          requirement: 'Score 90%+ on 5 quizzes',
          points: 250,
          rarity: 'rare',
        },
        {
          id: 'wellness_expert',
          name: 'Wellness Expert',
          description: 'Achieve 800+ wellness score',
          icon: '🏆',
          category: 'Wellness',
          progress: 92,
          requirement: 'Reach 800 wellness score',
          points: 500,
          rarity: 'epic',
        },
      ],
      stats: {
        totalPoints: 1450,
        totalAchievements: 8,
        rank: 15,
        level: 'Expert',
        nextLevelPoints: 550,
      },
      leaderboard: [
        { rank: 1, name: 'Financial Guru', points: 3250, achievements: 24 },
        { rank: 2, name: 'Budget Master', points: 2890, achievements: 21 },
        { rank: 3, name: 'Savings Pro', points: 2645, achievements: 19 },
      ],
    };
  }

  // ===== UTILITY ENDPOINTS =====

  @Get('enums')
  @ApiOperation({ summary: 'Get education-related enums' })
  @ApiResponse({ status: 200, description: 'Enums retrieved' })
  async getEducationEnums(): Promise<{
    contentTypes: ContentType[];
    contentCategories: ContentCategory[];
    difficultyLevels: DifficultyLevel[];
    progressTypes: ProgressType[];
    progressStatuses: ProgressStatus[];
    budgetTypes: BudgetType[];
    budgetPeriods: BudgetPeriod[];
    priorities: Priority[];
  }> {
    return {
      contentTypes: Object.values(ContentType),
      contentCategories: Object.values(ContentCategory),
      difficultyLevels: Object.values(DifficultyLevel),
      progressTypes: Object.values(ProgressType),
      progressStatuses: Object.values(ProgressStatus),
      budgetTypes: Object.values(BudgetType),
      budgetPeriods: Object.values(BudgetPeriod),
      priorities: Object.values(Priority),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check education service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    services: {
      contentDelivery: string;
      progressTracking: string;
      insightsEngine: string;
      budgetingTools: string;
      wellnessCalculation: string;
    };
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        contentDelivery: 'operational',
        progressTracking: 'operational',
        insightsEngine: 'operational',
        budgetingTools: 'operational',
        wellnessCalculation: 'operational',
      },
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async extractCustomerId(authorization: string): Promise<string> {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new BadRequestException('Invalid authorization header');
    }
    return 'cust_demo_001';
  }
}