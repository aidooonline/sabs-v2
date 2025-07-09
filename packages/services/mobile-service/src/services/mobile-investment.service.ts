import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';

// ===== INVESTMENT ENTITIES =====

export interface InvestmentPortfolio {
  id: string;
  customerId: string;
  name: string;
  type: PortfolioType;
  totalValue: number;
  totalInvested: number;
  totalReturns: number;
  returnPercentage: number;
  riskLevel: RiskLevel;
  holdings: InvestmentHolding[];
  performance: PerformanceMetric[];
  lastUpdated: Date;
  createdAt: Date;
}

export interface InvestmentHolding {
  id: string;
  portfolioId: string;
  instrumentId: string;
  instrumentType: InstrumentType;
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  dividends: number;
  lastUpdated: Date;
}

export interface InvestmentInstrument {
  id: string;
  symbol: string;
  name: string;
  type: InstrumentType;
  sector: string;
  currentPrice: number;
  previousClose: number;
  changeAmount: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  dividendYield?: number;
  peRatio?: number;
  riskRating: RiskLevel;
  minInvestment: number;
  isActive: boolean;
  description: string;
}

export interface SavingsGoal {
  id: string;
  customerId: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  autoSave: boolean;
  autoSaveDay: number;
  category: SavingsCategory;
  priority: Priority;
  progress: number;
  projectedCompletion?: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestmentTransaction {
  id: string;
  customerId: string;
  portfolioId: string;
  instrumentId: string;
  type: TransactionType;
  symbol: string;
  quantity: number;
  price: number;
  totalAmount: number;
  fees: number;
  netAmount: number;
  executedAt: Date;
  status: TransactionStatus;
  orderId?: string;
  createdAt: Date;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number;
  timestamp: Date;
}

// ===== ENUMS =====

export enum PortfolioType {
  GROWTH = 'growth',
  INCOME = 'income',
  BALANCED = 'balanced',
  CONSERVATIVE = 'conservative',
  AGGRESSIVE = 'aggressive',
  CUSTOM = 'custom',
}

export enum InstrumentType {
  STOCK = 'stock',
  BOND = 'bond',
  MUTUAL_FUND = 'mutual_fund',
  ETF = 'etf',
  TREASURY_BILL = 'treasury_bill',
  FIXED_DEPOSIT = 'fixed_deposit',
  SAVINGS_ACCOUNT = 'savings_account',
}

export enum RiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum SavingsCategory {
  EMERGENCY_FUND = 'emergency_fund',
  VACATION = 'vacation',
  HOME_PURCHASE = 'home_purchase',
  EDUCATION = 'education',
  RETIREMENT = 'retirement',
  WEDDING = 'wedding',
  CAR_PURCHASE = 'car_purchase',
  BUSINESS = 'business',
  OTHER = 'other',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TransactionType {
  BUY = 'buy',
  SELL = 'sell',
  DIVIDEND = 'dividend',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
}

export enum TransactionStatus {
  PENDING = 'pending',
  EXECUTED = 'executed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// ===== REQUEST INTERFACES =====

export interface CreatePortfolioRequest {
  name: string;
  type: PortfolioType;
  riskLevel: RiskLevel;
  initialDeposit?: number;
}

export interface InvestmentOrderRequest {
  portfolioId: string;
  instrumentId: string;
  type: TransactionType;
  quantity?: number;
  amount?: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
}

export interface CreateSavingsGoalRequest {
  name: string;
  description: string;
  targetAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  autoSave: boolean;
  autoSaveDay?: number;
  category: SavingsCategory;
  priority: Priority;
}

export interface PerformanceMetric {
  date: Date;
  value: number;
  returns: number;
  returnPercent: number;
}

@Injectable()
export class MobileInvestmentService {
  private readonly logger = new Logger(MobileInvestmentService.name);

  // In-memory storage
  private portfolios: Map<string, InvestmentPortfolio> = new Map();
  private instruments: Map<string, InvestmentInstrument> = new Map();
  private savingsGoals: Map<string, SavingsGoal[]> = new Map();
  private transactions: Map<string, InvestmentTransaction[]> = new Map();
  private marketData: Map<string, MarketData> = new Map();

  private readonly investmentConfig = {
    minInvestmentAmount: 100,
    maxInvestmentAmount: 1000000,
    tradingFee: 0.5, // 0.5%
    maxPortfolios: 10,
    maxHoldings: 50,
  };

  constructor(
    private eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.initializeInvestmentInstruments();
    this.initializeMarketData();
  }

  // ===== PORTFOLIO MANAGEMENT =====

  async createPortfolio(customerId: string, request: CreatePortfolioRequest): Promise<{
    portfolioId: string;
    name: string;
    type: PortfolioType;
    riskLevel: RiskLevel;
  }> {
    this.logger.log(`Creating portfolio for customer ${customerId}: ${request.name}`);

    const customerPortfolios = Array.from(this.portfolios.values()).filter(
      p => p.customerId === customerId
    );
    if (customerPortfolios.length >= this.investmentConfig.maxPortfolios) {
      throw new BadRequestException(`Maximum ${this.investmentConfig.maxPortfolios} portfolios allowed`);
    }

    const portfolioId = `portfolio_${nanoid(12)}`;
    
    const portfolio: InvestmentPortfolio = {
      id: portfolioId,
      customerId,
      name: request.name,
      type: request.type,
      totalValue: request.initialDeposit || 0,
      totalInvested: request.initialDeposit || 0,
      totalReturns: 0,
      returnPercentage: 0,
      riskLevel: request.riskLevel,
      holdings: [],
      performance: [],
      lastUpdated: new Date(),
      createdAt: new Date(),
    };

    this.portfolios.set(portfolioId, portfolio);

    this.eventEmitter.emit('investment.portfolio_created', {
      portfolioId,
      customerId,
      name: request.name,
      type: request.type,
    });

    return {
      portfolioId,
      name: request.name,
      type: request.type,
      riskLevel: request.riskLevel,
    };
  }

  async getCustomerPortfolios(customerId: string): Promise<{
    portfolios: InvestmentPortfolio[];
    summary: {
      totalValue: number;
      totalInvested: number;
      totalReturns: number;
      returnPercentage: number;
      topPerformer?: string;
    };
  }> {
    const portfolios = Array.from(this.portfolios.values()).filter(
      p => p.customerId === customerId
    );

    const totalValue = portfolios.reduce((sum, p) => sum + p.totalValue, 0);
    const totalInvested = portfolios.reduce((sum, p) => sum + p.totalInvested, 0);
    const totalReturns = totalValue - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

    const topPerformer = portfolios.length > 0 
      ? portfolios.reduce((best, current) => 
          current.returnPercentage > best.returnPercentage ? current : best
        ).name
      : undefined;

    return {
      portfolios,
      summary: {
        totalValue: Math.round(totalValue * 100) / 100,
        totalInvested: Math.round(totalInvested * 100) / 100,
        totalReturns: Math.round(totalReturns * 100) / 100,
        returnPercentage: Math.round(returnPercentage * 100) / 100,
        topPerformer,
      },
    };
  }

  // ===== INVESTMENT INSTRUMENTS =====

  async getInvestmentInstruments(filters?: {
    type?: InstrumentType;
    sector?: string;
    riskLevel?: RiskLevel;
  }): Promise<{
    instruments: InvestmentInstrument[];
    categories: string[];
    sectors: string[];
  }> {
    let instruments = Array.from(this.instruments.values()).filter(i => i.isActive);

    if (filters?.type) {
      instruments = instruments.filter(i => i.type === filters.type);
    }
    if (filters?.sector) {
      instruments = instruments.filter(i => i.sector === filters.sector);
    }
    if (filters?.riskLevel) {
      instruments = instruments.filter(i => i.riskRating === filters.riskLevel);
    }

    const categories = [...new Set(instruments.map(i => i.type))];
    const sectors = [...new Set(instruments.map(i => i.sector))];

    return {
      instruments: instruments.slice(0, 50), // Limit results
      categories,
      sectors,
    };
  }

  async getMarketData(symbols?: string[]): Promise<{
    marketData: MarketData[];
    indices: {
      gse: { value: number; change: number; changePercent: number };
      topGainers: MarketData[];
      topLosers: MarketData[];
    };
  }> {
    let data = Array.from(this.marketData.values());
    
    if (symbols && symbols.length > 0) {
      data = data.filter(d => symbols.includes(d.symbol));
    }

    // Sort by change for top gainers/losers
    const topGainers = [...data].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
    const topLosers = [...data].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

    return {
      marketData: data,
      indices: {
        gse: { value: 2850.45, change: 12.34, changePercent: 0.43 },
        topGainers,
        topLosers,
      },
    };
  }

  // ===== INVESTMENT TRANSACTIONS =====

  async placeInvestmentOrder(customerId: string, request: InvestmentOrderRequest): Promise<{
    orderId: string;
    transactionId: string;
    status: TransactionStatus;
    estimatedValue: number;
    fees: number;
  }> {
    this.logger.log(`Investment order: ${customerId} -> ${request.type} ${request.instrumentId}`);

    const portfolio = this.portfolios.get(request.portfolioId);
    if (!portfolio || portfolio.customerId !== customerId) {
      throw new NotFoundException('Portfolio not found');
    }

    const instrument = this.instruments.get(request.instrumentId);
    if (!instrument) {
      throw new NotFoundException('Investment instrument not found');
    }

    const marketData = this.marketData.get(instrument.symbol);
    if (!marketData) {
      throw new BadRequestException('Market data not available');
    }

    // Calculate transaction details
    const price = request.orderType === 'limit' ? (request.limitPrice || marketData.price) : marketData.price;
    const quantity = request.quantity || Math.floor((request.amount || 0) / price);
    const totalAmount = quantity * price;
    const fees = totalAmount * (this.investmentConfig.tradingFee / 100);
    const netAmount = request.type === TransactionType.BUY ? totalAmount + fees : totalAmount - fees;

    // Validate transaction
    if (totalAmount < this.investmentConfig.minInvestmentAmount) {
      throw new BadRequestException(`Minimum investment amount is GHS ${this.investmentConfig.minInvestmentAmount}`);
    }

    if (request.type === TransactionType.BUY && netAmount > portfolio.totalValue) {
      throw new BadRequestException('Insufficient portfolio balance');
    }

    // Create transaction
    const transactionId = `txn_${nanoid(12)}`;
    const orderId = `order_${nanoid(8)}`;

    const transaction: InvestmentTransaction = {
      id: transactionId,
      customerId,
      portfolioId: request.portfolioId,
      instrumentId: request.instrumentId,
      type: request.type,
      symbol: instrument.symbol,
      quantity,
      price,
      totalAmount,
      fees,
      netAmount,
      executedAt: new Date(),
      status: TransactionStatus.EXECUTED,
      orderId,
      createdAt: new Date(),
    };

    // Update portfolio
    await this.updatePortfolioHoldings(portfolio, transaction, instrument);

    // Store transaction
    const customerTransactions = this.transactions.get(customerId) || [];
    customerTransactions.push(transaction);
    this.transactions.set(customerId, customerTransactions);

    this.eventEmitter.emit('investment.order_executed', {
      orderId,
      transactionId,
      customerId,
      symbol: instrument.symbol,
      type: request.type,
      quantity,
      amount: totalAmount,
    });

    return {
      orderId,
      transactionId,
      status: TransactionStatus.EXECUTED,
      estimatedValue: totalAmount,
      fees,
    };
  }

  // ===== SAVINGS GOALS =====

  async createSavingsGoal(customerId: string, request: CreateSavingsGoalRequest): Promise<{
    goalId: string;
    name: string;
    targetAmount: number;
    monthlyRequired: number;
    projectedCompletion: Date;
  }> {
    this.logger.log(`Creating savings goal for customer ${customerId}: ${request.name}`);

    const goalId = `goal_${nanoid(12)}`;
    
    // Calculate projected completion
    const monthsToTarget = Math.ceil(
      (new Date(request.targetDate).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)
    );
    const monthlyRequired = Math.ceil(request.targetAmount / monthsToTarget);

    const savingsGoal: SavingsGoal = {
      id: goalId,
      customerId,
      name: request.name,
      description: request.description,
      targetAmount: request.targetAmount,
      currentAmount: 0,
      targetDate: new Date(request.targetDate),
      monthlyContribution: request.monthlyContribution,
      autoSave: request.autoSave,
      autoSaveDay: request.autoSaveDay || 1,
      category: request.category,
      priority: request.priority,
      progress: 0,
      projectedCompletion: new Date(Date.now() + (request.targetAmount / request.monthlyContribution) * 30 * 24 * 60 * 60 * 1000),
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const customerGoals = this.savingsGoals.get(customerId) || [];
    customerGoals.push(savingsGoal);
    this.savingsGoals.set(customerId, customerGoals);

    this.eventEmitter.emit('savings.goal_created', {
      goalId,
      customerId,
      name: request.name,
      targetAmount: request.targetAmount,
    });

    return {
      goalId,
      name: request.name,
      targetAmount: request.targetAmount,
      monthlyRequired,
      projectedCompletion: savingsGoal.projectedCompletion!,
    };
  }

  async getSavingsGoals(customerId: string): Promise<{
    goals: SavingsGoal[];
    summary: {
      totalGoals: number;
      activeGoals: number;
      completedGoals: number;
      totalTargetAmount: number;
      totalCurrentAmount: number;
      overallProgress: number;
    };
  }> {
    const goals = this.savingsGoals.get(customerId) || [];
    
    const activeGoals = goals.filter(g => !g.isCompleted);
    const completedGoals = goals.filter(g => g.isCompleted);
    const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    return {
      goals,
      summary: {
        totalGoals: goals.length,
        activeGoals: activeGoals.length,
        completedGoals: completedGoals.length,
        totalTargetAmount,
        totalCurrentAmount,
        overallProgress: Math.round(overallProgress * 100) / 100,
      },
    };
  }

  async contributeMToSavingsGoal(customerId: string, goalId: string, amount: number): Promise<{
    success: boolean;
    newAmount: number;
    progress: number;
    isCompleted: boolean;
  }> {
    const goals = this.savingsGoals.get(customerId) || [];
    const goalIndex = goals.findIndex(g => g.id === goalId);
    
    if (goalIndex === -1) {
      throw new NotFoundException('Savings goal not found');
    }

    const goal = goals[goalIndex];
    goal.currentAmount += amount;
    goal.progress = (goal.currentAmount / goal.targetAmount) * 100;
    goal.isCompleted = goal.currentAmount >= goal.targetAmount;
    goal.updatedAt = new Date();

    goals[goalIndex] = goal;
    this.savingsGoals.set(customerId, goals);

    this.eventEmitter.emit('savings.contribution_made', {
      goalId,
      customerId,
      amount,
      newTotal: goal.currentAmount,
      isCompleted: goal.isCompleted,
    });

    return {
      success: true,
      newAmount: goal.currentAmount,
      progress: Math.round(goal.progress * 100) / 100,
      isCompleted: goal.isCompleted,
    };
  }

  // ===== PORTFOLIO PERFORMANCE =====

  async getPortfolioPerformance(customerId: string, portfolioId: string, period: 'day' | 'week' | 'month' | 'year'): Promise<{
    portfolio: InvestmentPortfolio;
    performance: PerformanceMetric[];
    analytics: {
      volatility: number;
      sharpeRatio: number;
      maxDrawdown: number;
      diversificationScore: number;
    };
    recommendations: string[];
  }> {
    const portfolio = this.portfolios.get(portfolioId);
    
    if (!portfolio || portfolio.customerId !== customerId) {
      throw new NotFoundException('Portfolio not found');
    }

    // Generate mock performance data
    const performance = this.generatePerformanceData(portfolio, period);
    
    // Calculate analytics
    const analytics = {
      volatility: 15.5,
      sharpeRatio: 1.2,
      maxDrawdown: -8.5,
      diversificationScore: 75,
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(portfolio);

    return {
      portfolio,
      performance,
      analytics,
      recommendations,
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async updatePortfolioHoldings(
    portfolio: InvestmentPortfolio,
    transaction: InvestmentTransaction,
    instrument: InvestmentInstrument
  ): Promise<void> {
    const existingHolding = portfolio.holdings.find(h => h.instrumentId === transaction.instrumentId);

    if (transaction.type === TransactionType.BUY) {
      if (existingHolding) {
        // Update existing holding
        const totalCost = existingHolding.totalCost + transaction.netAmount;
        const totalQuantity = existingHolding.quantity + transaction.quantity;
        existingHolding.quantity = totalQuantity;
        existingHolding.averagePrice = totalCost / totalQuantity;
        existingHolding.totalCost = totalCost;
        existingHolding.marketValue = totalQuantity * instrument.currentPrice;
        existingHolding.unrealizedGain = existingHolding.marketValue - totalCost;
        existingHolding.unrealizedGainPercent = (existingHolding.unrealizedGain / totalCost) * 100;
      } else {
        // Create new holding
        const holding: InvestmentHolding = {
          id: `holding_${nanoid(8)}`,
          portfolioId: portfolio.id,
          instrumentId: transaction.instrumentId,
          instrumentType: instrument.type,
          symbol: instrument.symbol,
          name: instrument.name,
          quantity: transaction.quantity,
          averagePrice: transaction.price,
          currentPrice: instrument.currentPrice,
          marketValue: transaction.quantity * instrument.currentPrice,
          totalCost: transaction.netAmount,
          unrealizedGain: (transaction.quantity * instrument.currentPrice) - transaction.netAmount,
          unrealizedGainPercent: ((transaction.quantity * instrument.currentPrice) - transaction.netAmount) / transaction.netAmount * 100,
          dividends: 0,
          lastUpdated: new Date(),
        };
        portfolio.holdings.push(holding);
      }
      portfolio.totalInvested += transaction.netAmount;
    } else if (transaction.type === TransactionType.SELL && existingHolding) {
      // Handle sell transaction
      existingHolding.quantity -= transaction.quantity;
      if (existingHolding.quantity <= 0) {
        portfolio.holdings = portfolio.holdings.filter(h => h.id !== existingHolding.id);
      }
    }

    // Update portfolio totals
    portfolio.totalValue = portfolio.holdings.reduce((sum, h) => sum + h.marketValue, 0);
    portfolio.totalReturns = portfolio.totalValue - portfolio.totalInvested;
    portfolio.returnPercentage = portfolio.totalInvested > 0 ? (portfolio.totalReturns / portfolio.totalInvested) * 100 : 0;
    portfolio.lastUpdated = new Date();

    this.portfolios.set(portfolio.id, portfolio);
  }

  private generatePerformanceData(portfolio: InvestmentPortfolio, period: string): PerformanceMetric[] {
    const days = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const metrics: PerformanceMetric[] = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const value = portfolio.totalValue * (0.95 + Math.random() * 0.1); // Mock fluctuation
      metrics.push({
        date,
        value: Math.round(value * 100) / 100,
        returns: Math.round((value - portfolio.totalInvested) * 100) / 100,
        returnPercent: Math.round(((value - portfolio.totalInvested) / portfolio.totalInvested) * 10000) / 100,
      });
    }
    
    return metrics;
  }

  private generateRecommendations(portfolio: InvestmentPortfolio): string[] {
    const recommendations = [];
    
    if (portfolio.holdings.length < 5) {
      recommendations.push('Consider diversifying your portfolio with more holdings');
    }
    
    if (portfolio.returnPercentage < 0) {
      recommendations.push('Review underperforming assets and consider rebalancing');
    }
    
    recommendations.push('Regular contributions can help optimize your long-term returns');
    
    return recommendations;
  }

  private initializeInvestmentInstruments(): void {
    const instruments: InvestmentInstrument[] = [
      {
        id: 'stock_gcb',
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
      {
        id: 'bond_govt_5y',
        symbol: 'GOG5Y',
        name: 'Government of Ghana 5-Year Bond',
        type: InstrumentType.BOND,
        sector: 'Government',
        currentPrice: 102.50,
        previousClose: 102.25,
        changeAmount: 0.25,
        changePercent: 0.24,
        volume: 50000,
        dividendYield: 18.5,
        riskRating: RiskLevel.LOW,
        minInvestment: 1000,
        isActive: true,
        description: 'Government bond with 18.5% annual yield',
      },
    ];

    instruments.forEach(instrument => {
      this.instruments.set(instrument.id, instrument);
    });

    this.logger.log('Investment instruments initialized');
  }

  private initializeMarketData(): void {
    const marketData: MarketData[] = [
      {
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
      {
        symbol: 'MTN',
        price: 1.15,
        change: -0.02,
        changePercent: -1.71,
        volume: 89000,
        high: 1.18,
        low: 1.14,
        open: 1.17,
        previousClose: 1.17,
        marketCap: 4750000000,
        timestamp: new Date(),
      },
    ];

    marketData.forEach(data => {
      this.marketData.set(data.symbol, data);
    });

    this.logger.log('Market data initialized');
  }
}