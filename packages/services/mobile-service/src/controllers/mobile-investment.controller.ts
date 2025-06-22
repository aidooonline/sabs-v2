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
  MobileInvestmentService,
  InvestmentPortfolio,
  InvestmentInstrument,
  SavingsGoal,
  InvestmentTransaction,
  MarketData,
  PortfolioType,
  InstrumentType,
  RiskLevel,
  SavingsCategory,
  Priority,
  TransactionType,
  TransactionStatus,
  CreatePortfolioRequest,
  InvestmentOrderRequest,
  CreateSavingsGoalRequest,
} from '../services/mobile-investment.service';

// ===== REQUEST DTOs =====

export class CreatePortfolioDto {
  name: string;
  type: PortfolioType;
  riskLevel: RiskLevel;
  initialDeposit?: number;
}

export class InvestmentOrderDto {
  portfolioId: string;
  instrumentId: string;
  type: TransactionType;
  quantity?: number;
  amount?: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
}

export class CreateSavingsGoalDto {
  name: string;
  description: string;
  targetAmount: number;
  targetDate: string;
  monthlyContribution: number;
  autoSave: boolean;
  autoSaveDay?: number;
  category: SavingsCategory;
  priority: Priority;
}

export class ContributionDto {
  goalId: string;
  amount: number;
  fromAccountId: string;
}

export class InvestmentFiltersDto {
  type?: InstrumentType;
  sector?: string;
  riskLevel?: RiskLevel;
  minPrice?: number;
  maxPrice?: number;
}

// ===== RESPONSE DTOs =====

export class PortfolioResponseDto {
  portfolioId: string;
  name: string;
  type: PortfolioType;
  riskLevel: RiskLevel;
  totalValue: number;
  totalReturns: number;
  returnPercentage: number;
  message: string;
}

export class InvestmentOrderResponseDto {
  orderId: string;
  transactionId: string;
  status: TransactionStatus;
  estimatedValue: number;
  fees: number;
  executionPrice: number;
  message: string;
}

export class SavingsGoalResponseDto {
  goalId: string;
  name: string;
  targetAmount: number;
  monthlyRequired: number;
  projectedCompletion: Date;
  autoSaveSetup: boolean;
  message: string;
}

export class PortfolioSummaryDto {
  portfolios: InvestmentPortfolio[];
  summary: {
    totalValue: number;
    totalInvested: number;
    totalReturns: number;
    returnPercentage: number;
    topPerformer?: string;
  };
  allocation: {
    byType: Array<{ type: string; percentage: number; value: number }>;
    bySector: Array<{ sector: string; percentage: number; value: number }>;
    byRisk: Array<{ risk: string; percentage: number; value: number }>;
  };
}

export class MarketOverviewDto {
  marketData: MarketData[];
  indices: {
    gse: { value: number; change: number; changePercent: number };
    topGainers: MarketData[];
    topLosers: MarketData[];
  };
  marketStatus: {
    isOpen: boolean;
    nextOpen?: Date;
    timezone: string;
  };
}

export class PerformanceAnalyticsDto {
  portfolio: InvestmentPortfolio;
  performance: Array<{
    date: Date;
    value: number;
    returns: number;
    returnPercent: number;
  }>;
  analytics: {
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    diversificationScore: number;
  };
  recommendations: string[];
  insights: {
    bestPerformingAsset?: string;
    worstPerformingAsset?: string;
    suggestedActions: string[];
  };
}

@ApiTags('Mobile Investments')
@Controller('mobile-investments')
export class MobileInvestmentController {
  private readonly logger = new Logger(MobileInvestmentController.name);

  constructor(private readonly investmentService: MobileInvestmentService) {}

  // ===== PORTFOLIO MANAGEMENT ENDPOINTS =====

  @Post('portfolios')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create investment portfolio' })
  @ApiResponse({ status: 201, description: 'Portfolio created successfully', type: PortfolioResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid portfolio data' })
  async createPortfolio(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) portfolioDto: CreatePortfolioDto,
  ): Promise<PortfolioResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Creating portfolio: ${customerId} -> ${portfolioDto.name}`);

    const request: CreatePortfolioRequest = {
      name: portfolioDto.name,
      type: portfolioDto.type,
      riskLevel: portfolioDto.riskLevel,
      initialDeposit: portfolioDto.initialDeposit,
    };

    const result = await this.investmentService.createPortfolio(customerId, request);

    return {
      ...result,
      totalValue: portfolioDto.initialDeposit || 0,
      totalReturns: 0,
      returnPercentage: 0,
      message: 'Portfolio created successfully',
    };
  }

  @Get('portfolios')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer portfolios' })
  @ApiResponse({ status: 200, description: 'Portfolios retrieved', type: PortfolioSummaryDto })
  async getPortfolios(
    @Headers('authorization') authorization: string,
  ): Promise<PortfolioSummaryDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const result = await this.investmentService.getCustomerPortfolios(customerId);
    
    // Calculate allocations
    const totalValue = result.summary.totalValue;
    const allocation = {
      byType: this.calculateAllocationByType(result.portfolios, totalValue),
      bySector: this.calculateAllocationBySector(result.portfolios, totalValue),
      byRisk: this.calculateAllocationByRisk(result.portfolios, totalValue),
    };

    return {
      ...result,
      allocation,
    };
  }

  @Get('portfolios/:portfolioId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get portfolio details' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio details retrieved' })
  async getPortfolioDetails(
    @Headers('authorization') authorization: string,
    @Param('portfolioId') portfolioId: string,
  ): Promise<{
    portfolio: InvestmentPortfolio;
    holdings: Array<{
      symbol: string;
      name: string;
      quantity: number;
      currentValue: number;
      gainLoss: number;
      gainLossPercent: number;
      allocation: number;
    }>;
    performance: {
      today: number;
      week: number;
      month: number;
      year: number;
    };
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock implementation - would get from service
    const portfolio = {
      id: portfolioId,
      customerId,
      name: 'Growth Portfolio',
      type: PortfolioType.GROWTH,
      totalValue: 25000,
      totalInvested: 22000,
      totalReturns: 3000,
      returnPercentage: 13.64,
      riskLevel: RiskLevel.MODERATE,
      holdings: [],
      performance: [],
      lastUpdated: new Date(),
      createdAt: new Date(),
    } as InvestmentPortfolio;

    const holdings = [
      {
        symbol: 'GCB',
        name: 'GCB Bank Limited',
        quantity: 1000,
        currentValue: 4850,
        gainLoss: 250,
        gainLossPercent: 5.43,
        allocation: 19.4,
      },
      {
        symbol: 'MTN',
        name: 'MTN Ghana',
        quantity: 2000,
        currentValue: 2300,
        gainLoss: -150,
        gainLossPercent: -6.12,
        allocation: 9.2,
      },
    ];

    return {
      portfolio,
      holdings,
      performance: {
        today: 1.24,
        week: 3.45,
        month: 8.76,
        year: 13.64,
      },
    };
  }

  @Get('portfolios/:portfolioId/performance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get portfolio performance analytics' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'year'] })
  @ApiResponse({ status: 200, description: 'Performance analytics retrieved', type: PerformanceAnalyticsDto })
  async getPortfolioPerformance(
    @Headers('authorization') authorization: string,
    @Param('portfolioId') portfolioId: string,
    @Query('period') period: 'day' | 'week' | 'month' | 'year' = 'month',
  ): Promise<PerformanceAnalyticsDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    const result = await this.investmentService.getPortfolioPerformance(customerId, portfolioId, period);
    
    return {
      ...result,
      insights: {
        bestPerformingAsset: 'GCB Bank Limited (+5.43%)',
        worstPerformingAsset: 'MTN Ghana (-6.12%)',
        suggestedActions: [
          'Consider rebalancing your portfolio',
          'MTN Ghana shows potential for recovery',
          'Banking sector is performing well',
        ],
      },
    };
  }

  // ===== INVESTMENT INSTRUMENTS ENDPOINTS =====

  @Get('instruments')
  @ApiOperation({ summary: 'Get investment instruments' })
  @ApiQuery({ name: 'type', required: false, enum: InstrumentType })
  @ApiQuery({ name: 'sector', required: false, type: String })
  @ApiQuery({ name: 'riskLevel', required: false, enum: RiskLevel })
  @ApiResponse({ status: 200, description: 'Investment instruments retrieved' })
  async getInvestmentInstruments(
    @Query() filters: InvestmentFiltersDto,
  ): Promise<{
    instruments: Array<{
      id: string;
      symbol: string;
      name: string;
      type: InstrumentType;
      currentPrice: number;
      changePercent: number;
      sector: string;
      riskRating: RiskLevel;
      minInvestment: number;
      recommendation?: 'buy' | 'hold' | 'sell';
    }>;
    categories: string[];
    sectors: string[];
    featured: Array<{
      title: string;
      instruments: string[];
      description: string;
    }>;
  }> {
    const result = await this.investmentService.getInvestmentInstruments(filters);
    
    const enhancedInstruments = result.instruments.map(instrument => ({
      ...instrument,
      recommendation: this.generateRecommendation(instrument) as 'buy' | 'hold' | 'sell',
    }));

    return {
      instruments: enhancedInstruments,
      categories: result.categories,
      sectors: result.sectors,
      featured: [
        {
          title: 'Top Performers',
          instruments: ['GCB', 'CAL'],
          description: 'Best performing stocks this month',
        },
        {
          title: 'High Dividend',
          instruments: ['GCB', 'BOPP'],
          description: 'Stocks with attractive dividend yields',
        },
        {
          title: 'Government Bonds',
          instruments: ['GOG5Y', 'GOG10Y'],
          description: 'Safe government-backed investments',
        },
      ],
    };
  }

  @Get('instruments/:instrumentId')
  @ApiOperation({ summary: 'Get instrument details' })
  @ApiParam({ name: 'instrumentId', description: 'Instrument ID' })
  @ApiResponse({ status: 200, description: 'Instrument details retrieved' })
  async getInstrumentDetails(
    @Param('instrumentId') instrumentId: string,
  ): Promise<{
    instrument: InvestmentInstrument;
    marketData: MarketData;
    analysis: {
      technicalRating: string;
      priceTarget: number;
      analyst_consensus: string;
      keyMetrics: Record<string, number>;
    };
    news: Array<{
      title: string;
      summary: string;
      date: Date;
      sentiment: 'positive' | 'neutral' | 'negative';
    }>;
  }> {
    // Mock implementation
    return {
      instrument: {
        id: instrumentId,
        symbol: 'GCB',
        name: 'GCB Bank Limited',
        type: InstrumentType.STOCK,
        sector: 'Banking',
        currentPrice: 4.85,
        previousClose: 4.80,
        changeAmount: 0.05,
        changePercent: 1.04,
        volume: 125000,
        marketCap: 2500000000,
        dividendYield: 8.5,
        peRatio: 12.5,
        riskRating: RiskLevel.MODERATE,
        minInvestment: 100,
        isActive: true,
        description: 'Leading commercial bank in Ghana',
      },
      marketData: {
        symbol: 'GCB',
        price: 4.85,
        change: 0.05,
        changePercent: 1.04,
        volume: 125000,
        high: 4.90,
        low: 4.75,
        open: 4.78,
        previousClose: 4.80,
        marketCap: 2500000000,
        timestamp: new Date(),
      },
      analysis: {
        technicalRating: 'Buy',
        priceTarget: 5.20,
        analyst_consensus: 'Strong Buy',
        keyMetrics: {
          'P/E Ratio': 12.5,
          'Dividend Yield': 8.5,
          'ROE': 18.2,
          'Debt to Equity': 0.65,
        },
      },
      news: [
        {
          title: 'GCB Bank Reports Strong Q3 Results',
          summary: 'Bank shows 15% growth in net profits with improved asset quality',
          date: new Date(),
          sentiment: 'positive',
        },
      ],
    };
  }

  // ===== INVESTMENT TRANSACTIONS ENDPOINTS =====

  @Post('orders')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Place investment order' })
  @ApiResponse({ status: 201, description: 'Order placed successfully', type: InvestmentOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid order request' })
  async placeInvestmentOrder(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) orderDto: InvestmentOrderDto,
  ): Promise<InvestmentOrderResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Investment order: ${customerId} -> ${orderDto.type} ${orderDto.instrumentId}`);

    const request: InvestmentOrderRequest = {
      portfolioId: orderDto.portfolioId,
      instrumentId: orderDto.instrumentId,
      type: orderDto.type,
      quantity: orderDto.quantity,
      amount: orderDto.amount,
      orderType: orderDto.orderType,
      limitPrice: orderDto.limitPrice,
    };

    const result = await this.investmentService.placeInvestmentOrder(customerId, request);

    return {
      ...result,
      executionPrice: orderDto.limitPrice || 4.85, // Mock execution price
      message: 'Investment order executed successfully',
    };
  }

  @Get('transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get investment transactions' })
  @ApiQuery({ name: 'portfolioId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Transactions retrieved' })
  async getInvestmentTransactions(
    @Headers('authorization') authorization: string,
    @Query('portfolioId') portfolioId?: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ): Promise<{
    transactions: InvestmentTransaction[];
    summary: {
      totalTransactions: number;
      totalBought: number;
      totalSold: number;
      totalFees: number;
    };
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock transactions
    const transactions: InvestmentTransaction[] = [
      {
        id: 'txn_001',
        customerId,
        portfolioId: portfolioId || 'portfolio_001',
        instrumentId: 'stock_gcb',
        type: TransactionType.BUY,
        symbol: 'GCB',
        quantity: 100,
        price: 4.80,
        totalAmount: 480,
        fees: 2.40,
        netAmount: 482.40,
        executedAt: new Date(),
        status: TransactionStatus.EXECUTED,
        orderId: 'order_001',
        createdAt: new Date(),
      },
    ];

    return {
      transactions: transactions.slice(offset, offset + limit),
      summary: {
        totalTransactions: transactions.length,
        totalBought: 15000,
        totalSold: 8000,
        totalFees: 125.50,
      },
      pagination: {
        limit,
        offset,
        total: transactions.length,
      },
    };
  }

  // ===== MARKET DATA ENDPOINTS =====

  @Get('market')
  @ApiOperation({ summary: 'Get market overview' })
  @ApiQuery({ name: 'symbols', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Market data retrieved', type: MarketOverviewDto })
  async getMarketOverview(
    @Query('symbols') symbols?: string,
  ): Promise<MarketOverviewDto> {
    const symbolArray = symbols ? symbols.split(',') : undefined;
    const result = await this.investmentService.getMarketData(symbolArray);
    
    return {
      ...result,
      marketStatus: {
        isOpen: this.isMarketOpen(),
        nextOpen: this.getNextMarketOpen(),
        timezone: 'GMT',
      },
    };
  }

  @Get('market/watchlist')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer watchlist' })
  @ApiResponse({ status: 200, description: 'Watchlist retrieved' })
  async getWatchlist(
    @Headers('authorization') authorization: string,
  ): Promise<{
    watchlist: Array<{
      symbol: string;
      name: string;
      currentPrice: number;
      changePercent: number;
      alertPrice?: number;
      alertType?: 'above' | 'below';
    }>;
    alerts: Array<{
      symbol: string;
      message: string;
      triggered: boolean;
      createdAt: Date;
    }>;
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    // Mock watchlist
    return {
      watchlist: [
        {
          symbol: 'GCB',
          name: 'GCB Bank Limited',
          currentPrice: 4.85,
          changePercent: 1.04,
          alertPrice: 5.00,
          alertType: 'above',
        },
        {
          symbol: 'MTN',
          name: 'MTN Ghana',
          currentPrice: 1.15,
          changePercent: -1.71,
          alertPrice: 1.20,
          alertType: 'above',
        },
      ],
      alerts: [
        {
          symbol: 'GCB',
          message: 'GCB reached your target price of GHS 4.85',
          triggered: true,
          createdAt: new Date(),
        },
      ],
    };
  }

  // ===== SAVINGS GOALS ENDPOINTS =====

  @Post('savings-goals')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create savings goal' })
  @ApiResponse({ status: 201, description: 'Savings goal created', type: SavingsGoalResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid savings goal data' })
  async createSavingsGoal(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) goalDto: CreateSavingsGoalDto,
  ): Promise<SavingsGoalResponseDto> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Creating savings goal: ${customerId} -> ${goalDto.name}`);

    const request: CreateSavingsGoalRequest = {
      name: goalDto.name,
      description: goalDto.description,
      targetAmount: goalDto.targetAmount,
      targetDate: new Date(goalDto.targetDate),
      monthlyContribution: goalDto.monthlyContribution,
      autoSave: goalDto.autoSave,
      autoSaveDay: goalDto.autoSaveDay,
      category: goalDto.category,
      priority: goalDto.priority,
    };

    const result = await this.investmentService.createSavingsGoal(customerId, request);

    return {
      ...result,
      autoSaveSetup: goalDto.autoSave,
      message: 'Savings goal created successfully',
    };
  }

  @Get('savings-goals')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get savings goals' })
  @ApiResponse({ status: 200, description: 'Savings goals retrieved' })
  async getSavingsGoals(
    @Headers('authorization') authorization: string,
  ): Promise<{
    goals: Array<SavingsGoal & {
      daysToTarget: number;
      onTrack: boolean;
      monthlyShortfall?: number;
    }>;
    summary: {
      totalGoals: number;
      activeGoals: number;
      completedGoals: number;
      totalTargetAmount: number;
      totalCurrentAmount: number;
      overallProgress: number;
    };
    insights: {
      mostUrgent?: string;
      bestPerforming?: string;
      recommendations: string[];
    };
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    const result = await this.investmentService.getSavingsGoals(customerId);
    
    // Enhance goals with additional calculations
    const enhancedGoals = result.goals.map(goal => {
      const daysToTarget = Math.ceil((goal.targetDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      const monthsToTarget = Math.max(1, Math.ceil(daysToTarget / 30));
      const requiredMonthly = (goal.targetAmount - goal.currentAmount) / monthsToTarget;
      const onTrack = goal.monthlyContribution >= requiredMonthly;
      
      return {
        ...goal,
        daysToTarget,
        onTrack,
        monthlyShortfall: onTrack ? undefined : requiredMonthly - goal.monthlyContribution,
      };
    });

    return {
      goals: enhancedGoals,
      summary: result.summary,
      insights: {
        mostUrgent: enhancedGoals.find(g => g.priority === Priority.URGENT)?.name,
        bestPerforming: enhancedGoals.reduce((best, current) => 
          current.progress > (best?.progress || 0) ? current : best
        )?.name,
        recommendations: [
          'Consider increasing contributions to off-track goals',
          'Emergency fund should be 3-6 months of expenses',
          'Automate savings to stay consistent',
        ],
      },
    };
  }

  @Post('savings-goals/:goalId/contribute')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Contribute to savings goal' })
  @ApiParam({ name: 'goalId', description: 'Savings goal ID' })
  @ApiResponse({ status: 201, description: 'Contribution processed successfully' })
  async contributeToSavingsGoal(
    @Headers('authorization') authorization: string,
    @Param('goalId') goalId: string,
    @Body(ValidationPipe) contributionDto: ContributionDto,
  ): Promise<{
    success: boolean;
    newAmount: number;
    progress: number;
    isCompleted: boolean;
    milestone?: string;
    message: string;
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    this.logger.log(`Savings contribution: ${customerId} -> Goal ${goalId}, Amount: GHS ${contributionDto.amount}`);

    const result = await this.investmentService.contributeMToSavingsGoal(customerId, goalId, contributionDto.amount);
    
    // Generate milestone message
    let milestone: string | undefined;
    if (result.progress >= 25 && result.progress < 50) {
      milestone = 'Quarter way there! 🎯';
    } else if (result.progress >= 50 && result.progress < 75) {
      milestone = 'Halfway milestone reached! 🚀';
    } else if (result.progress >= 75 && result.progress < 100) {
      milestone = 'Almost there! Final stretch! 💪';
    } else if (result.isCompleted) {
      milestone = 'Goal completed! Congratulations! 🎉';
    }

    return {
      ...result,
      milestone,
      message: result.isCompleted 
        ? 'Congratulations! Savings goal completed!' 
        : 'Contribution processed successfully',
    };
  }

  // ===== INVESTMENT INSIGHTS ENDPOINTS =====

  @Get('insights/recommendations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personalized investment recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved' })
  async getPersonalizedRecommendations(
    @Headers('authorization') authorization: string,
  ): Promise<{
    recommendations: Array<{
      type: 'buy' | 'sell' | 'rebalance' | 'diversify';
      title: string;
      description: string;
      instruments?: string[];
      priority: 'high' | 'medium' | 'low';
      reasoning: string;
    }>;
    marketOutlook: {
      sentiment: 'bullish' | 'bearish' | 'neutral';
      keyFactors: string[];
      timeHorizon: string;
    };
    riskAssessment: {
      currentRisk: RiskLevel;
      recommendedRisk: RiskLevel;
      riskFactors: string[];
    };
  }> {
    const customerId = await this.extractCustomerId(authorization);
    
    return {
      recommendations: [
        {
          type: 'diversify',
          title: 'Diversify Your Portfolio',
          description: 'Add bonds and international exposure to reduce risk',
          instruments: ['GOG5Y', 'EGH'],
          priority: 'medium',
          reasoning: 'Your portfolio is heavily concentrated in banking stocks',
        },
        {
          type: 'buy',
          title: 'Consider Growth Stocks',
          description: 'Technology and telecom sectors showing strong growth',
          instruments: ['MTN'],
          priority: 'high',
          reasoning: 'Strong earnings growth and favorable market conditions',
        },
      ],
      marketOutlook: {
        sentiment: 'bullish',
        keyFactors: [
          'Strong GDP growth projections',
          'Stable currency performance',
          'Improved corporate earnings',
        ],
        timeHorizon: '6-12 months',
      },
      riskAssessment: {
        currentRisk: RiskLevel.MODERATE,
        recommendedRisk: RiskLevel.MODERATE,
        riskFactors: ['Sector concentration', 'Currency exposure'],
      },
    };
  }

  @Get('insights/education')
  @ApiOperation({ summary: 'Get investment education content' })
  @ApiResponse({ status: 200, description: 'Education content retrieved' })
  async getEducationContent(): Promise<{
    articles: Array<{
      id: string;
      title: string;
      category: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      readTime: number;
      summary: string;
    }>;
    videos: Array<{
      id: string;
      title: string;
      duration: number;
      thumbnail: string;
      category: string;
    }>;
    calculators: Array<{
      name: string;
      description: string;
      url: string;
    }>;
  }> {
    return {
      articles: [
        {
          id: 'art_001',
          title: 'Getting Started with Stock Market Investing',
          category: 'Basics',
          difficulty: 'beginner',
          readTime: 5,
          summary: 'Learn the fundamentals of stock market investing in Ghana',
        },
        {
          id: 'art_002',
          title: 'Understanding Government Bonds',
          category: 'Fixed Income',
          difficulty: 'intermediate',
          readTime: 8,
          summary: 'Deep dive into Ghana government bonds and their benefits',
        },
      ],
      videos: [
        {
          id: 'vid_001',
          title: 'Portfolio Diversification Explained',
          duration: 300,
          thumbnail: '/videos/diversification.jpg',
          category: 'Strategy',
        },
      ],
      calculators: [
        {
          name: 'Investment Return Calculator',
          description: 'Calculate potential returns on your investments',
          url: '/calculators/returns',
        },
        {
          name: 'Risk Assessment Tool',
          description: 'Assess your risk tolerance and investment profile',
          url: '/calculators/risk',
        },
      ],
    };
  }

  // ===== UTILITY ENDPOINTS =====

  @Get('enums')
  @ApiOperation({ summary: 'Get investment-related enums' })
  @ApiResponse({ status: 200, description: 'Enums retrieved' })
  async getInvestmentEnums(): Promise<{
    portfolioTypes: PortfolioType[];
    instrumentTypes: InstrumentType[];
    riskLevels: RiskLevel[];
    savingsCategories: SavingsCategory[];
    priorities: Priority[];
    transactionTypes: TransactionType[];
    transactionStatuses: TransactionStatus[];
  }> {
    return {
      portfolioTypes: Object.values(PortfolioType),
      instrumentTypes: Object.values(InstrumentType),
      riskLevels: Object.values(RiskLevel),
      savingsCategories: Object.values(SavingsCategory),
      priorities: Object.values(Priority),
      transactionTypes: Object.values(TransactionType),
      transactionStatuses: Object.values(TransactionStatus),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check investment service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    services: {
      portfolioManagement: string;
      marketData: string;
      transactionProcessing: string;
      savingsGoals: string;
    };
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        portfolioManagement: 'operational',
        marketData: 'operational',
        transactionProcessing: 'operational',
        savingsGoals: 'operational',
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

  private calculateAllocationByType(portfolios: InvestmentPortfolio[], totalValue: number) {
    const allocation = new Map<string, number>();
    
    portfolios.forEach(portfolio => {
      portfolio.holdings.forEach(holding => {
        const current = allocation.get(holding.instrumentType) || 0;
        allocation.set(holding.instrumentType, current + holding.marketValue);
      });
    });

    return Array.from(allocation.entries()).map(([type, value]) => ({
      type,
      value: Math.round(value * 100) / 100,
      percentage: totalValue > 0 ? Math.round((value / totalValue) * 10000) / 100 : 0,
    }));
  }

  private calculateAllocationBySector(portfolios: InvestmentPortfolio[], totalValue: number) {
    // Mock implementation
    return [
      { sector: 'Banking', value: 12000, percentage: 48 },
      { sector: 'Telecom', value: 8000, percentage: 32 },
      { sector: 'Government', value: 5000, percentage: 20 },
    ];
  }

  private calculateAllocationByRisk(portfolios: InvestmentPortfolio[], totalValue: number) {
    return [
      { risk: 'Low', value: 5000, percentage: 20 },
      { risk: 'Moderate', value: 15000, percentage: 60 },
      { risk: 'High', value: 5000, percentage: 20 },
    ];
  }

  private generateRecommendation(instrument: InvestmentInstrument): string {
    if (instrument.changePercent > 2) return 'buy';
    if (instrument.changePercent < -2) return 'sell';
    return 'hold';
  }

  private isMarketOpen(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Ghana Stock Exchange: Monday-Friday, 10:00-15:00 GMT
    return day >= 1 && day <= 5 && hour >= 10 && hour < 15;
  }

  private getNextMarketOpen(): Date {
    const now = new Date();
    const nextOpen = new Date(now);
    
    // Set to 10:00 AM
    nextOpen.setHours(10, 0, 0, 0);
    
    // If market is closed today, move to next weekday
    if (now.getHours() >= 15 || now.getDay() === 0 || now.getDay() === 6) {
      nextOpen.setDate(nextOpen.getDate() + 1);
      
      // Skip weekends
      while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
        nextOpen.setDate(nextOpen.getDate() + 1);
      }
    }
    
    return nextOpen;
  }
}