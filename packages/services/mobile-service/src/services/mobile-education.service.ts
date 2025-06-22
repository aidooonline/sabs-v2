import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';

// ===== EDUCATION ENTITIES =====

export interface EducationContent {
  id: string;
  title: string;
  type: ContentType;
  category: ContentCategory;
  difficulty: DifficultyLevel;
  description: string;
  content: string;
  readTime: number;
  videoUrl?: string;
  videoDuration?: number;
  thumbnailUrl: string;
  tags: string[];
  author: string;
  publishedAt: Date;
  updatedAt: Date;
  isActive: boolean;
  views: number;
  rating: number;
  completions: number;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  category: ContentCategory;
  difficulty: DifficultyLevel;
  estimatedDuration: number;
  modules: LearningModule[];
  prerequisites: string[];
  outcomes: string[];
  certificate: boolean;
  isActive: boolean;
  enrollments: number;
  completionRate: number;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  order: number;
  contentIds: string[];
  quiz?: Quiz;
  estimatedTime: number;
  isRequired: boolean;
}

export interface UserProgress {
  id: string;
  customerId: string;
  contentId?: string;
  pathId?: string;
  type: ProgressType;
  status: ProgressStatus;
  progress: number;
  timeSpent: number;
  lastAccessed: Date;
  completedAt?: Date;
  score?: number;
  achievements: Achievement[];
  notes: string;
}

export interface FinancialInsight {
  id: string;
  customerId: string;
  type: InsightType;
  category: InsightCategory;
  title: string;
  description: string;
  value: number;
  change: number;
  changePercent: number;
  trend: TrendDirection;
  priority: Priority;
  actionable: boolean;
  recommendations: string[];
  validUntil: Date;
  createdAt: Date;
}

export interface BudgetPlan {
  id: string;
  customerId: string;
  name: string;
  type: BudgetType;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  totalIncome: number;
  totalBudget: number;
  totalSpent: number;
  categories: BudgetCategory[];
  status: BudgetStatus;
  alerts: BudgetAlert[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialWellness {
  id: string;
  customerId: string;
  overallScore: number;
  lastCalculated: Date;
  metrics: WellnessMetric[];
  recommendations: WellnessRecommendation[];
  historicalScores: HistoricalScore[];
  goals: WellnessGoal[];
  achievements: Achievement[];
  nextMilestone: string;
}

// ===== ENUMS =====

export enum ContentType {
  ARTICLE = 'article',
  VIDEO = 'video',
  COURSE = 'course',
  QUIZ = 'quiz',
  CALCULATOR = 'calculator',
  INFOGRAPHIC = 'infographic',
  PODCAST = 'podcast',
}

export enum ContentCategory {
  BUDGETING = 'budgeting',
  SAVING = 'saving',
  INVESTING = 'investing',
  DEBT_MANAGEMENT = 'debt_management',
  INSURANCE = 'insurance',
  RETIREMENT = 'retirement',
  BANKING = 'banking',
  CREDIT = 'credit',
  ENTREPRENEURSHIP = 'entrepreneurship',
  PERSONAL_FINANCE = 'personal_finance',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum ProgressType {
  CONTENT = 'content',
  PATH = 'path',
  QUIZ = 'quiz',
  GOAL = 'goal',
}

export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PAUSED = 'paused',
}

export enum InsightType {
  SPENDING = 'spending',
  SAVING = 'saving',
  INCOME = 'income',
  BUDGET = 'budget',
  INVESTMENT = 'investment',
  DEBT = 'debt',
  GOAL = 'goal',
  TREND = 'trend',
}

export enum InsightCategory {
  OPPORTUNITY = 'opportunity',
  WARNING = 'warning',
  ACHIEVEMENT = 'achievement',
  RECOMMENDATION = 'recommendation',
  MILESTONE = 'milestone',
}

export enum TrendDirection {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable',
  VOLATILE = 'volatile',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum BudgetType {
  ZERO_BASED = 'zero_based',
  PERCENTAGE = 'percentage',
  ENVELOPE = 'envelope',
  FLEXIBLE = 'flexible',
}

export enum BudgetPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
}

export enum BudgetStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  EXCEEDED = 'exceeded',
}

// ===== SUPPORTING INTERFACES =====

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'text';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  category: string;
  points: number;
}

export interface BudgetCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  color: string;
  isEssential: boolean;
}

export interface BudgetAlert {
  id: string;
  type: 'overspend' | 'target_reached' | 'low_balance';
  message: string;
  severity: 'info' | 'warning' | 'error';
  triggeredAt: Date;
  acknowledged: boolean;
}

export interface WellnessMetric {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  category: string;
  description: string;
  improvement: string;
}

export interface WellnessRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  estimatedImpact: number;
  actionSteps: string[];
  contentIds: string[];
}

export interface HistoricalScore {
  date: Date;
  score: number;
  category: string;
}

export interface WellnessGoal {
  id: string;
  title: string;
  description: string;
  targetScore: number;
  currentScore: number;
  deadline: Date;
  progress: number;
  isActive: boolean;
}

// ===== REQUEST INTERFACES =====

export interface CreateBudgetRequest {
  name: string;
  type: BudgetType;
  period: BudgetPeriod;
  totalIncome: number;
  categories: Omit<BudgetCategory, 'id' | 'spentAmount'>[];
}

export interface TrackProgressRequest {
  contentId?: string;
  pathId?: string;
  type: ProgressType;
  progress: number;
  timeSpent: number;
  completed?: boolean;
  score?: number;
  notes?: string;
}

export interface FinancialGoalRequest {
  title: string;
  description: string;
  targetScore: number;
  deadline: Date;
  category: string;
}

@Injectable()
export class MobileEducationService {
  private readonly logger = new Logger(MobileEducationService.name);

  // In-memory storage
  private educationContent: Map<string, EducationContent> = new Map();
  private learningPaths: Map<string, LearningPath> = new Map();
  private userProgress: Map<string, UserProgress[]> = new Map();
  private financialInsights: Map<string, FinancialInsight[]> = new Map();
  private budgetPlans: Map<string, BudgetPlan[]> = new Map();
  private financialWellness: Map<string, FinancialWellness> = new Map();

  private readonly educationConfig = {
    maxProgressTracking: 100,
    insightRetentionDays: 30,
    wellnessUpdateFrequency: 7, // days
    maxBudgetCategories: 20,
    gamificationEnabled: true,
    pointsPerCompletion: 100,
  };

  constructor(
    private eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.initializeEducationContent();
    this.initializeLearningPaths();
  }

  // ===== EDUCATION CONTENT =====

  async getEducationContent(filters?: {
    type?: ContentType;
    category?: ContentCategory;
    difficulty?: DifficultyLevel;
    search?: string;
  }): Promise<{
    content: EducationContent[];
    categories: ContentCategory[];
    featured: EducationContent[];
    trending: EducationContent[];
    personalized: EducationContent[];
  }> {
    let content = Array.from(this.educationContent.values()).filter(c => c.isActive);

    // Apply filters
    if (filters?.type) {
      content = content.filter(c => c.type === filters.type);
    }
    if (filters?.category) {
      content = content.filter(c => c.category === filters.category);
    }
    if (filters?.difficulty) {
      content = content.filter(c => c.difficulty === filters.difficulty);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      content = content.filter(c => 
        c.title.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search) ||
        c.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    // Sort by relevance and popularity
    content.sort((a, b) => (b.rating * b.views) - (a.rating * a.views));

    const categories = Object.values(ContentCategory);
    const featured = content.filter(c => c.rating >= 4.5).slice(0, 5);
    const trending = content.sort((a, b) => b.views - a.views).slice(0, 5);
    const personalized = content.filter(c => 
      c.category === ContentCategory.PERSONAL_FINANCE || 
      c.category === ContentCategory.BUDGETING
    ).slice(0, 5);

    return {
      content: content.slice(0, 50),
      categories,
      featured,
      trending,
      personalized,
    };
  }

  async getLearningPaths(category?: ContentCategory): Promise<{
    paths: LearningPath[];
    categories: ContentCategory[];
    recommended: LearningPath[];
  }> {
    let paths = Array.from(this.learningPaths.values()).filter(p => p.isActive);

    if (category) {
      paths = paths.filter(p => p.category === category);
    }

    // Sort by completion rate and enrollments
    paths.sort((a, b) => (b.completionRate * b.enrollments) - (a.completionRate * a.enrollments));

    const categories = [...new Set(paths.map(p => p.category))];
    const recommended = paths.filter(p => p.completionRate >= 0.8).slice(0, 3);

    return {
      paths,
      categories,
      recommended,
    };
  }

  async trackLearningProgress(customerId: string, request: TrackProgressRequest): Promise<{
    progressId: string;
    overallProgress: number;
    achievements: Achievement[];
    points: number;
  }> {
    this.logger.log(`Tracking progress: ${customerId} -> ${request.type} ${request.contentId || request.pathId}`);

    const progressId = `progress_${nanoid(12)}`;
    
    const progress: UserProgress = {
      id: progressId,
      customerId,
      contentId: request.contentId,
      pathId: request.pathId,
      type: request.type,
      status: request.completed ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS,
      progress: request.progress,
      timeSpent: request.timeSpent,
      lastAccessed: new Date(),
      completedAt: request.completed ? new Date() : undefined,
      score: request.score,
      achievements: [],
      notes: request.notes || '',
    };

    // Calculate achievements
    const achievements = this.calculateAchievements(customerId, progress);
    progress.achievements = achievements;

    // Store progress
    const customerProgress = this.userProgress.get(customerId) || [];
    customerProgress.push(progress);
    this.userProgress.set(customerId, customerProgress);

    // Calculate overall progress
    const overallProgress = this.calculateOverallProgress(customerProgress);

    // Calculate points
    const points = this.calculatePoints(progress, achievements);

    this.eventEmitter.emit('education.progress_tracked', {
      customerId,
      progressId,
      type: request.type,
      completed: request.completed,
      achievements: achievements.length,
      points,
    });

    return {
      progressId,
      overallProgress,
      achievements,
      points,
    };
  }

  // ===== FINANCIAL INSIGHTS =====

  async generatePersonalInsights(customerId: string): Promise<{
    insights: FinancialInsight[];
    summary: {
      totalInsights: number;
      opportunities: number;
      warnings: number;
      achievements: number;
    };
    trendAnalysis: {
      spending: TrendDirection;
      saving: TrendDirection;
      income: TrendDirection;
    };
  }> {
    this.logger.log(`Generating financial insights for customer ${customerId}`);

    // Generate insights based on customer data
    const insights = this.generateInsights(customerId);
    
    // Store insights
    this.financialInsights.set(customerId, insights);

    const summary = {
      totalInsights: insights.length,
      opportunities: insights.filter(i => i.category === InsightCategory.OPPORTUNITY).length,
      warnings: insights.filter(i => i.category === InsightCategory.WARNING).length,
      achievements: insights.filter(i => i.category === InsightCategory.ACHIEVEMENT).length,
    };

    const trendAnalysis = {
      spending: TrendDirection.UP,
      saving: TrendDirection.STABLE,
      income: TrendDirection.UP,
    };

    return {
      insights,
      summary,
      trendAnalysis,
    };
  }

  async getPersonalizedRecommendations(customerId: string): Promise<{
    recommendations: Array<{
      type: string;
      title: string;
      description: string;
      priority: Priority;
      contentIds: string[];
      estimatedTime: number;
      potentialSavings?: number;
    }>;
    learningGoals: string[];
    nextSteps: string[];
  }> {
    const insights = this.financialInsights.get(customerId) || [];
    const progress = this.userProgress.get(customerId) || [];

    const recommendations = [
      {
        type: 'budgeting',
        title: 'Create Your First Budget',
        description: 'Start managing your money with a simple monthly budget',
        priority: Priority.HIGH,
        contentIds: ['budget_basics_001', 'budget_calculator_001'],
        estimatedTime: 30,
        potentialSavings: 500,
      },
      {
        type: 'emergency_fund',
        title: 'Build Emergency Fund',
        description: 'Secure your financial future with 3-6 months of expenses',
        priority: Priority.MEDIUM,
        contentIds: ['emergency_fund_guide_001', 'savings_calculator_001'],
        estimatedTime: 45,
        potentialSavings: 2000,
      },
      {
        type: 'investment',
        title: 'Start Investing',
        description: 'Learn the basics of investing and grow your wealth',
        priority: Priority.MEDIUM,
        contentIds: ['investing_basics_001', 'investment_calculator_001'],
        estimatedTime: 60,
      },
    ];

    const learningGoals = [
      'Complete Budgeting Basics course',
      'Achieve 750+ Financial Wellness Score',
      'Master Emergency Fund planning',
      'Learn Investment fundamentals',
    ];

    const nextSteps = [
      'Set up your monthly budget',
      'Track expenses for one week',
      'Open a savings account',
      'Complete financial health assessment',
    ];

    return {
      recommendations,
      learningGoals,
      nextSteps,
    };
  }

  // ===== BUDGETING TOOLS =====

  async createBudget(customerId: string, request: CreateBudgetRequest): Promise<{
    budgetId: string;
    totalBudget: number;
    categoriesCount: number;
    recommendations: string[];
  }> {
    this.logger.log(`Creating budget: ${customerId} -> ${request.name}`);

    const budgetId = `budget_${nanoid(12)}`;

    // Validate budget categories
    const totalBudget = request.categories.reduce((sum, cat) => sum + cat.budgetAmount, 0);
    
    if (totalBudget > request.totalIncome * 1.1) {
      throw new BadRequestException('Budget exceeds income by more than 10%');
    }

    const categories: BudgetCategory[] = request.categories.map(cat => ({
      id: nanoid(8),
      ...cat,
      spentAmount: 0,
      percentage: (cat.budgetAmount / totalBudget) * 100,
    }));

    const budget: BudgetPlan = {
      id: budgetId,
      customerId,
      name: request.name,
      type: request.type,
      period: request.period,
      startDate: new Date(),
      endDate: this.calculateBudgetEndDate(request.period),
      totalIncome: request.totalIncome,
      totalBudget,
      totalSpent: 0,
      categories,
      status: BudgetStatus.ACTIVE,
      alerts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const customerBudgets = this.budgetPlans.get(customerId) || [];
    customerBudgets.push(budget);
    this.budgetPlans.set(customerId, customerBudgets);

    // Generate recommendations
    const recommendations = this.generateBudgetRecommendations(budget);

    this.eventEmitter.emit('education.budget_created', {
      budgetId,
      customerId,
      name: request.name,
      totalBudget,
      categoriesCount: categories.length,
    });

    return {
      budgetId,
      totalBudget,
      categoriesCount: categories.length,
      recommendations,
    };
  }

  async getBudgetAnalysis(customerId: string, budgetId: string): Promise<{
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
  }> {
    const budgets = this.budgetPlans.get(customerId) || [];
    const budget = budgets.find(b => b.id === budgetId);

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    // Generate mock analytics
    const spendingTrends = this.generateSpendingTrends(budget);
    const categoryPerformance = budget.categories.map(cat => ({
      category: cat.name,
      budgeted: cat.budgetAmount,
      spent: cat.spentAmount,
      variance: ((cat.spentAmount - cat.budgetAmount) / cat.budgetAmount) * 100,
      status: cat.spentAmount <= cat.budgetAmount * 0.9 ? 'under' as const : 
               cat.spentAmount <= cat.budgetAmount * 1.1 ? 'on_track' as const : 'over' as const,
    }));

    const projections = {
      monthEnd: budget.totalSpent * 1.5, // Mock projection
      yearEnd: budget.totalSpent * 12,
      savingsPotential: budget.totalIncome - budget.totalBudget,
    };

    const recommendations = this.generateBudgetRecommendations(budget);

    return {
      budget,
      analytics: {
        spendingTrends,
        categoryPerformance,
        projections,
      },
      recommendations,
    };
  }

  // ===== FINANCIAL WELLNESS =====

  async calculateFinancialWellness(customerId: string): Promise<FinancialWellness> {
    this.logger.log(`Calculating financial wellness for customer ${customerId}`);

    const metrics = this.calculateWellnessMetrics(customerId);
    const overallScore = this.calculateOverallWellnessScore(metrics);
    const recommendations = this.generateWellnessRecommendations(metrics);
    const goals = this.generateWellnessGoals(customerId, metrics);
    const achievements = this.calculateWellnessAchievements(customerId, overallScore);

    const wellness: FinancialWellness = {
      id: `wellness_${nanoid(12)}`,
      customerId,
      overallScore,
      lastCalculated: new Date(),
      metrics,
      recommendations,
      historicalScores: this.getHistoricalScores(customerId, overallScore),
      goals,
      achievements,
      nextMilestone: this.getNextMilestone(overallScore),
    };

    this.financialWellness.set(customerId, wellness);

    this.eventEmitter.emit('education.wellness_calculated', {
      customerId,
      wellnessId: wellness.id,
      overallScore,
      previousScore: 0, // Would get from history
      improvement: overallScore - 0,
    });

    return wellness;
  }

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
    }>;
    categories: string[];
  }> {
    const calculators = [
      {
        id: 'budget_calculator',
        name: 'Budget Planner',
        description: 'Plan your monthly budget with income and expense tracking',
        category: 'Budgeting',
        inputs: [
          { name: 'income', type: 'number', label: 'Monthly Income', required: true, min: 0 },
          { name: 'rent', type: 'number', label: 'Rent/Mortgage', required: true, min: 0 },
          { name: 'utilities', type: 'number', label: 'Utilities', required: false, min: 0 },
          { name: 'food', type: 'number', label: 'Food & Groceries', required: false, min: 0 },
          { name: 'transport', type: 'number', label: 'Transportation', required: false, min: 0 },
        ],
        outputs: ['Total Expenses', 'Remaining Income', 'Savings Potential', 'Budget Recommendations'],
      },
      {
        id: 'loan_calculator',
        name: 'Loan Calculator',
        description: 'Calculate loan payments and total interest',
        category: 'Loans',
        inputs: [
          { name: 'amount', type: 'number', label: 'Loan Amount', required: true, min: 1000, max: 1000000 },
          { name: 'rate', type: 'number', label: 'Interest Rate (%)', required: true, min: 1, max: 50 },
          { name: 'term', type: 'number', label: 'Loan Term (months)', required: true, min: 6, max: 360 },
        ],
        outputs: ['Monthly Payment', 'Total Interest', 'Total Amount', 'Amortization Schedule'],
      },
      {
        id: 'savings_calculator',
        name: 'Savings Goal Calculator',
        description: 'Calculate how much to save to reach your goals',
        category: 'Savings',
        inputs: [
          { name: 'goal', type: 'number', label: 'Savings Goal', required: true, min: 100 },
          { name: 'current', type: 'number', label: 'Current Savings', required: false, min: 0 },
          { name: 'monthly', type: 'number', label: 'Monthly Contribution', required: true, min: 10 },
          { name: 'rate', type: 'number', label: 'Interest Rate (%)', required: false, min: 0, max: 20 },
        ],
        outputs: ['Time to Goal', 'Total Interest Earned', 'Final Amount', 'Monthly Required'],
      },
    ];

    const categories = [...new Set(calculators.map(c => c.category))];

    return {
      calculators,
      categories,
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private calculateAchievements(customerId: string, progress: UserProgress): Achievement[] {
    const achievements: Achievement[] = [];

    if (progress.status === ProgressStatus.COMPLETED) {
      achievements.push({
        id: nanoid(8),
        name: 'Course Completion',
        description: 'Completed a financial education course',
        icon: '🎓',
        earnedAt: new Date(),
        category: 'Education',
        points: this.educationConfig.pointsPerCompletion,
      });
    }

    if (progress.score && progress.score >= 90) {
      achievements.push({
        id: nanoid(8),
        name: 'High Achiever',
        description: 'Scored 90% or higher on a quiz',
        icon: '🌟',
        earnedAt: new Date(),
        category: 'Performance',
        points: 50,
      });
    }

    return achievements;
  }

  private calculateOverallProgress(progressList: UserProgress[]): number {
    if (progressList.length === 0) return 0;
    
    const totalProgress = progressList.reduce((sum, p) => sum + p.progress, 0);
    return Math.round((totalProgress / progressList.length) * 100) / 100;
  }

  private calculatePoints(progress: UserProgress, achievements: Achievement[]): number {
    let points = 0;
    
    if (progress.status === ProgressStatus.COMPLETED) {
      points += this.educationConfig.pointsPerCompletion;
    }
    
    points += achievements.reduce((sum, a) => sum + a.points, 0);
    
    return points;
  }

  private generateInsights(customerId: string): FinancialInsight[] {
    const insights: FinancialInsight[] = [
      {
        id: `insight_${nanoid(8)}`,
        customerId,
        type: InsightType.SPENDING,
        category: InsightCategory.OPPORTUNITY,
        title: 'Reduce Dining Out Expenses',
        description: 'You spent 25% more on dining out this month compared to last month',
        value: 450,
        change: 90,
        changePercent: 25,
        trend: TrendDirection.UP,
        priority: Priority.MEDIUM,
        actionable: true,
        recommendations: [
          'Set a monthly dining out budget of GHS 300',
          'Try cooking at home 3 more days per week',
          'Use grocery apps to find deals and save money',
        ],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
      {
        id: `insight_${nanoid(8)}`,
        customerId,
        type: InsightType.SAVING,
        category: InsightCategory.ACHIEVEMENT,
        title: 'Savings Goal Progress',
        description: 'You\'re on track to reach your emergency fund goal by March 2025',
        value: 5000,
        change: 500,
        changePercent: 11,
        trend: TrendDirection.UP,
        priority: Priority.LOW,
        actionable: false,
        recommendations: [
          'Continue your current savings rate',
          'Consider increasing contributions by 10%',
          'Explore high-yield savings accounts',
        ],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
    ];

    return insights;
  }

  private calculateBudgetEndDate(period: BudgetPeriod): Date {
    const now = new Date();
    switch (period) {
      case BudgetPeriod.WEEKLY:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case BudgetPeriod.MONTHLY:
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case BudgetPeriod.QUARTERLY:
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      case BudgetPeriod.ANNUALLY:
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      default:
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }
  }

  private generateBudgetRecommendations(budget: BudgetPlan): string[] {
    const recommendations: string[] = [];
    
    const savingsRate = ((budget.totalIncome - budget.totalBudget) / budget.totalIncome) * 100;
    
    if (savingsRate < 10) {
      recommendations.push('Try to save at least 10% of your income');
    }
    if (savingsRate < 20) {
      recommendations.push('Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings');
    }
    
    const housingCost = budget.categories.find(c => c.name.toLowerCase().includes('rent') || c.name.toLowerCase().includes('housing'));
    if (housingCost && (housingCost.budgetAmount / budget.totalIncome) > 0.3) {
      recommendations.push('Housing costs should ideally be under 30% of income');
    }
    
    recommendations.push('Track your spending daily for better budget control');
    recommendations.push('Review and adjust your budget monthly');
    
    return recommendations;
  }

  private generateSpendingTrends(budget: BudgetPlan): Array<{ date: Date; amount: number; category: string }> {
    const trends: Array<{ date: Date; amount: number; category: string }> = [];
    
    // Generate mock spending data for the last 30 days
    for (let i = 30; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      budget.categories.forEach(category => {
        const dailySpend = (category.spentAmount / 30) * (0.8 + Math.random() * 0.4);
        trends.push({
          date,
          amount: Math.round(dailySpend * 100) / 100,
          category: category.name,
        });
      });
    }
    
    return trends;
  }

  private calculateWellnessMetrics(customerId: string): WellnessMetric[] {
    return [
      {
        name: 'Emergency Fund',
        score: 75,
        maxScore: 100,
        weight: 25,
        category: 'Savings',
        description: 'You have 4.5 months of expenses saved',
        improvement: 'Build up to 6 months for optimal security',
      },
      {
        name: 'Debt Management',
        score: 85,
        maxScore: 100,
        weight: 20,
        category: 'Debt',
        description: 'Good debt-to-income ratio at 25%',
        improvement: 'Continue paying down high-interest debt',
      },
      {
        name: 'Budget Control',
        score: 90,
        maxScore: 100,
        weight: 20,
        category: 'Budgeting',
        description: 'Excellent spending discipline',
        improvement: 'Maintain current budgeting habits',
      },
      {
        name: 'Investment Planning',
        score: 60,
        maxScore: 100,
        weight: 20,
        category: 'Investing',
        description: 'Basic investment portfolio started',
        improvement: 'Increase investment contributions by 5%',
      },
      {
        name: 'Financial Knowledge',
        score: 70,
        maxScore: 100,
        weight: 15,
        category: 'Education',
        description: 'Good understanding of basic concepts',
        improvement: 'Complete advanced investing course',
      },
    ];
  }

  private calculateOverallWellnessScore(metrics: WellnessMetric[]): number {
    const weightedScore = metrics.reduce((sum, metric) => {
      return sum + (metric.score * metric.weight / 100);
    }, 0);
    
    return Math.round(weightedScore);
  }

  private generateWellnessRecommendations(metrics: WellnessMetric[]): WellnessRecommendation[] {
    const lowScoreMetrics = metrics.filter(m => m.score < 70);
    
    return lowScoreMetrics.map(metric => ({
      id: nanoid(8),
      title: `Improve ${metric.name}`,
      description: metric.improvement,
      category: metric.category,
      priority: metric.score < 50 ? Priority.HIGH : Priority.MEDIUM,
      estimatedImpact: Math.round((70 - metric.score) * metric.weight / 100),
      actionSteps: [
        'Complete related educational content',
        'Set specific improvement goals',
        'Track progress weekly',
      ],
      contentIds: [], // Would populate with relevant content
    }));
  }

  private generateWellnessGoals(customerId: string, metrics: WellnessMetric[]): WellnessGoal[] {
    return [
      {
        id: nanoid(8),
        title: 'Reach 800 Wellness Score',
        description: 'Improve overall financial wellness to excellent level',
        targetScore: 800,
        currentScore: this.calculateOverallWellnessScore(metrics),
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        progress: 0,
        isActive: true,
      },
    ];
  }

  private calculateWellnessAchievements(customerId: string, score: number): Achievement[] {
    const achievements: Achievement[] = [];
    
    if (score >= 700) {
      achievements.push({
        id: nanoid(8),
        name: 'Financial Wellness Champion',
        description: 'Achieved 700+ wellness score',
        icon: '🏆',
        earnedAt: new Date(),
        category: 'Wellness',
        points: 200,
      });
    }
    
    return achievements;
  }

  private getHistoricalScores(customerId: string, currentScore: number): HistoricalScore[] {
    // Mock historical data
    const scores: HistoricalScore[] = [];
    for (let i = 30; i >= 0; i--) {
      scores.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        score: currentScore + (Math.random() - 0.5) * 20,
        category: 'Overall',
      });
    }
    return scores;
  }

  private getNextMilestone(score: number): string {
    if (score < 600) return 'Reach 600 - Good Financial Health';
    if (score < 700) return 'Reach 700 - Strong Financial Position';
    if (score < 800) return 'Reach 800 - Excellent Financial Wellness';
    return 'Maintain Excellence';
  }

  private initializeEducationContent(): void {
    const content: EducationContent[] = [
      {
        id: 'budget_basics_001',
        title: 'Budgeting Basics: Your First Step to Financial Freedom',
        type: ContentType.ARTICLE,
        category: ContentCategory.BUDGETING,
        difficulty: DifficultyLevel.BEGINNER,
        description: 'Learn the fundamentals of creating and maintaining a personal budget',
        content: 'Complete guide to budgeting...',
        readTime: 8,
        thumbnailUrl: '/images/budget-basics.jpg',
        tags: ['budgeting', 'finance', 'beginners'],
        author: 'Sarah Finance Expert',
        publishedAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        views: 15420,
        rating: 4.7,
        completions: 8945,
      },
      {
        id: 'emergency_fund_guide_001',
        title: 'Building Your Emergency Fund: A Complete Guide',
        type: ContentType.VIDEO,
        category: ContentCategory.SAVING,
        difficulty: DifficultyLevel.BEGINNER,
        description: 'Step-by-step guide to building a robust emergency fund',
        content: 'Video content...',
        readTime: 0,
        videoUrl: '/videos/emergency-fund-guide.mp4',
        videoDuration: 12,
        thumbnailUrl: '/images/emergency-fund.jpg',
        tags: ['emergency fund', 'savings', 'financial security'],
        author: 'John Savings Guru',
        publishedAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        views: 22105,
        rating: 4.9,
        completions: 11230,
      },
      {
        id: 'investing_basics_001',
        title: 'Investment Fundamentals for Beginners',
        type: ContentType.COURSE,
        category: ContentCategory.INVESTING,
        difficulty: DifficultyLevel.INTERMEDIATE,
        description: 'Comprehensive course on investment basics and strategies',
        content: 'Course modules...',
        readTime: 120,
        thumbnailUrl: '/images/investing-basics.jpg',
        tags: ['investing', 'stocks', 'bonds', 'portfolio'],
        author: 'Maria Investment Pro',
        publishedAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        views: 18750,
        rating: 4.6,
        completions: 7820,
      },
    ];

    content.forEach(item => {
      this.educationContent.set(item.id, item);
    });

    this.logger.log('Education content initialized');
  }

  private initializeLearningPaths(): void {
    const paths: LearningPath[] = [
      {
        id: 'financial_literacy_path',
        name: 'Complete Financial Literacy',
        description: 'Master all aspects of personal finance from budgeting to investing',
        category: ContentCategory.PERSONAL_FINANCE,
        difficulty: DifficultyLevel.BEGINNER,
        estimatedDuration: 240,
        modules: [
          {
            id: 'module_1',
            title: 'Budgeting Fundamentals',
            description: 'Learn to create and manage budgets',
            order: 1,
            contentIds: ['budget_basics_001'],
            estimatedTime: 60,
            isRequired: true,
          },
          {
            id: 'module_2',
            title: 'Saving Strategies',
            description: 'Build emergency funds and savings habits',
            order: 2,
            contentIds: ['emergency_fund_guide_001'],
            estimatedTime: 45,
            isRequired: true,
          },
          {
            id: 'module_3',
            title: 'Investment Basics',
            description: 'Introduction to investing and wealth building',
            order: 3,
            contentIds: ['investing_basics_001'],
            estimatedTime: 90,
            isRequired: false,
          },
        ],
        prerequisites: [],
        outcomes: [
          'Create effective budgets',
          'Build emergency funds',
          'Understand investment basics',
          'Develop financial discipline',
        ],
        certificate: true,
        isActive: true,
        enrollments: 5420,
        completionRate: 0.78,
      },
    ];

    paths.forEach(path => {
      this.learningPaths.set(path.id, path);
    });

    this.logger.log('Learning paths initialized');
  }
}