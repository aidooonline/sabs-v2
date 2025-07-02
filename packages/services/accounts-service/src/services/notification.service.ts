import { getErrorMessage, getErrorStack, getErrorStatus, UserRole, ReportType, LibraryCapability } from '@sabs/common';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';
import { Transaction, TransactionStatus, TransactionType } from '../entities/transaction.entity';
import { Customer } from '../entities/customer.entity';
import { Account } from '../entities/account.entity';



// Notification Entity (would be a separate entity file in production)
export interface NotificationRecord {
  id: string;
  companyId: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipientId: string;
  recipientType: string;
  subject: string;
  content: string;
  templateId?: string;
  templateData?: Record<string, any>;
  priority: NotificationPriority;
  status: NotificationStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  TRANSACTION_CREATED = 'transaction_created',
  TRANSACTION_APPROVED = 'transaction_approved',
  TRANSACTION_REJECTED = 'transaction_rejected',
  TRANSACTION_COMPLETED = 'transaction_completed',
  TRANSACTION_FAILED = 'transaction_failed',
  TRANSACTION_REVERSED = 'transaction_reversed',
  ACCOUNT_CREATED = 'account_created',
  ACCOUNT_SUSPENDED = 'account_suspended',
  ACCOUNT_REACTIVATED = 'account_reactivated',
  BALANCE_LOW = 'balance_low',
  BALANCE_THRESHOLD = 'balance_threshold',
  SECURITY_ALERT = 'security_alert',
  COMPLIANCE_ALERT = 'compliance_alert',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  PROMOTIONAL = 'promotional',
  REMINDER = 'reminder',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  LOGIN_ALERT = 'login_alert',
}

export enum NotificationChannel {
  SMS = 'sms',
  EMAIL = 'email',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook',
  WHATSAPP = 'whatsapp',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  channel: NotificationChannel;
  language: string;
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  customerId: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  transactionAlerts: boolean;
  securityAlerts: boolean;
  promotionalMessages: boolean;
  reminderMessages: boolean;
  preferredLanguage: string;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
    timezone: string;
  };
  frequencies: {
    transactionAlerts: 'immediate' | 'hourly' | 'daily';
    balanceAlerts: 'immediate' | 'daily' | 'weekly';
    securityAlerts: 'immediate';
    promotional: 'never' | 'weekly' | 'monthly';
  };
}

export interface SendNotificationRequest {
  type: NotificationType;
  channel: NotificationChannel | NotificationChannel[];
  recipientId: string;
  recipientType: string;
  templateId?: string;
  subject?: string;
  content?: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  scheduleAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationDeliveryReport {
  notificationId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failureReason?: string;
  providerResponse?: any;
  cost?: number;
  metadata?: Record<string, any>;
}

export interface BulkNotificationRequest {
  type: NotificationType;
  channel: NotificationChannel | NotificationChannel[];
  recipients: Array<{
    id: string;
    type: string;
    data?: Record<string, any>;
  }>;
  templateId?: string;
  subject?: string;
  content?: string;
  globalData?: Record<string, any>;
  priority?: NotificationPriority;
  scheduleAt?: Date;
  batchSize?: number;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  // In-memory storage for notifications (would use a database table in production)
  private notifications: Map<string, NotificationRecord> = new Map();
  
  // Notification templates storage
  private templates: Map<string, NotificationTemplate> = new Map();
  
  // User preferences storage
  private preferences: Map<string, NotificationPreferences> = new Map();

  // Default template configurations
  private readonly defaultTemplates: Record<string, Partial<NotificationTemplate>> = {
    transaction_completed_sms: {
      name: 'Transaction Completed SMS',
      type: NotificationType.TRANSACTION_COMPLETED,
      channel: NotificationChannel.SMS,
      language: 'en',
      subject: 'Transaction Completed',
      content: 'Your {{transactionType}} of GHS {{amount}} has been completed. Reference: {{transactionNumber}}. Balance: GHS {{balance}}.',
      variables: ['transactionType', 'amount', 'transactionNumber', 'balance'],
      isActive: true,
    },
    transaction_completed_email: {
      name: 'Transaction Completed Email',
      type: NotificationType.TRANSACTION_COMPLETED,
      channel: NotificationChannel.EMAIL,
      language: 'en',
      subject: 'Transaction Completed - {{transactionNumber}}',
      content: `
        <h2>Transaction Completed Successfully</h2>
        <p>Dear {{customerName}},</p>
        <p>Your {{transactionType}} transaction has been completed successfully.</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 10px 0;">
          <strong>Transaction Details:</strong><br>
          Reference: {{transactionNumber}}<br>
          Type: {{transactionType}}<br>
          Amount: GHS {{amount}}<br>
          Date: {{completedDate}}<br>
          Account Balance: GHS {{balance}}
        </div>
        <p>Thank you for using our services.</p>
      `,
      variables: ['customerName', 'transactionType', 'transactionNumber', 'amount', 'completedDate', 'balance'],
      isActive: true,
    },
    account_created_welcome: {
      name: 'Welcome New Account',
      type: NotificationType.WELCOME,
      channel: NotificationChannel.SMS,
      language: 'en',
      subject: 'Welcome to SABS',
      content: 'Welcome {{customerName}}! Your account {{accountNumber}} has been created successfully. Start transacting today!',
      variables: ['customerName', 'accountNumber'],
      isActive: true,
    },
    balance_low_alert: {
      name: 'Low Balance Alert',
      type: NotificationType.BALANCE_LOW,
      channel: NotificationChannel.SMS,
      language: 'en',
      subject: 'Low Balance Alert',
      content: 'Alert: Your account balance is low. Current balance: GHS {{balance}}. Please deposit funds to continue transactions.',
      variables: ['balance'],
      isActive: true,
    },
    security_alert: {
      name: 'Security Alert',
      type: NotificationType.SECURITY_ALERT,
      channel: NotificationChannel.SMS,
      language: 'en',
      subject: 'Security Alert',
      content: 'Security Alert: {{alertMessage}}. If this was not you, please contact support immediately.',
      variables: ['alertMessage'],
      isActive: true,
    },
  };

  // Delivery rate limits and costs
  private readonly channelLimits = {
    sms: { rateLimit: 100, costPerMessage: 0.05 }, // 100 SMS per minute, $0.05 each
    email: { rateLimit: 1000, costPerMessage: 0.001 }, // 1000 emails per minute, $0.001 each
    push: { rateLimit: 5000, costPerMessage: 0.0001 }, // 5000 push notifications per minute
    in_app: { rateLimit: 10000, costPerMessage: 0 }, // Unlimited in-app notifications
    webhook: { rateLimit: 500, costPerMessage: 0 }, // 500 webhooks per minute
    whatsapp: { rateLimit: 50, costPerMessage: 0.02 }, // 50 WhatsApp messages per minute
  };

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,

    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,

    @InjectRepository(Account)
    private accountRepository: Repository<Account>,

    private eventEmitter: EventEmitter2,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {
    this.initializeDefaultTemplates();
    this.initializeDefaultPreferences();
  }

  // ===== EVENT LISTENERS =====

  @OnEvent('transaction.completed')
  async handleTransactionCompleted(event: any): Promise<void> {
    this.logger.log(`Handling transaction completed event: ${event.transactionId}`);

    const transaction = await this.transactionRepository.findOne({
      where: { id: event.transactionId },
      relations: ["customer", 'account'],
    });

    if (!transaction) {
      this.logger.error(`Transaction not found: ${event.transactionId}`);
      return;
    }

    // Send completion notification
    await this.sendTransactionNotification(transaction, NotificationType.TRANSACTION_COMPLETED);
  }

  @OnEvent('transaction.failed')
  async handleTransactionFailed(event: any): Promise<void> {
    this.logger.log(`Handling transaction failed event: ${event.transactionId}`);

    const transaction = await this.transactionRepository.findOne({
      where: { id: event.transactionId },
      relations: ["customer", 'account'],
    });

    if (!transaction) {
      this.logger.error(`Transaction not found: ${event.transactionId}`);
      return;
    }

    // Send failure notification
    await this.sendTransactionNotification(transaction, NotificationType.TRANSACTION_FAILED);
  }

  @OnEvent('transaction.approved')
  async handleTransactionApproved(event: any): Promise<void> {
    this.logger.log(`Handling transaction approved event: ${event.transactionId}`);

    const transaction = await this.transactionRepository.findOne({
      where: { id: event.transactionId },
      relations: ["customer", 'account'],
    });

    if (transaction) {
      await this.sendTransactionNotification(transaction, NotificationType.TRANSACTION_APPROVED);
    }
  }

  @OnEvent('transaction.rejected')
  async handleTransactionRejected(event: any): Promise<void> {
    this.logger.log(`Handling transaction rejected event: ${event.transactionId}`);

    const transaction = await this.transactionRepository.findOne({
      where: { id: event.transactionId },
      relations: ["customer", 'account'],
    });

    if (transaction) {
      await this.sendTransactionNotification(transaction, NotificationType.TRANSACTION_REJECTED);
    }
  }

  @OnEvent('account.created')
  async handleAccountCreated(event: any): Promise<void> {
    this.logger.log(`Handling account created event: ${event.accountId}`);

    const account = await this.accountRepository.findOne({
      where: { id: event.accountId },
      relations: ["customer"],
    });

    if (account) {
      await this.sendWelcomeNotification(account);
    }
  }

  @OnEvent('balance.low')
  async handleLowBalance(event: any): Promise<void> {
    this.logger.log(`Handling low balance event: ${event.accountId}`);

    const account = await this.accountRepository.findOne({
      where: { id: event.accountId },
      relations: ["customer"],
    });

    if (account) {
      await this.sendBalanceAlert(account, event.balance, event.threshold);
    }
  }

  // ===== CORE NOTIFICATION METHODS =====

  async sendNotification(request: SendNotificationRequest): Promise<string> {
    this.logger.log(`Sending notification: ${request.type} to ${request.recipientId}`);

    // Get recipient preferences
    const preferences = await this.getNotificationPreferences(request.recipientId);

    // Check if notification type is allowed
    if (!this.isNotificationAllowed(request.type, request.channel, preferences)) {
      this.logger.log(`Notification not allowed by user preferences: ${request.type}`);
      return null;
    }

    // Create notification record
    const notification = await this.createNotificationRecord(request);

    // Handle single or multiple channels
    const channels = Array.isArray(request.channel) ? request.channel : [request.channel];

    // Send to each channel
    for (const channel of channels) {
      await this.sendToChannel(notification, channel);
    }

    return notification.id;
  }

  async sendBulkNotification(request: BulkNotificationRequest): Promise<{
    batchId: string;
    totalRecipients: number;
    scheduledCount: number;
    failedCount: number;
    notificationIds: string[];
  }> {
    this.logger.log(`Sending bulk notification: ${request.type} to ${Object.values(request.recipients).length} recipients`);

    const batchId = `batch_${nanoid(8)}`;
    const batchSize = request.batchSize || 100;
    const notificationIds: string[] = [];
    let scheduledCount = 0;
    let failedCount = 0;

    // Process recipients in batches
    for (let i = 0; i < Object.values(request.recipients).length; i += batchSize) {
      const batch = request.recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const notificationRequest: SendNotificationRequest = {
            type: request.type,
            channel: request.channel,
            recipientId: recipient.id,
            recipientType: recipient.type,
            templateId: request.templateId,
            subject: request.subject,
            content: request.content,
            data: { ...request.globalData, ...recipient.data },
            priority: request.priority,
            scheduleAt: request.scheduleAt,
            metadata: { batchId, ...request.globalData },
          };

          const notificationId = await this.sendNotification(notificationRequest);
          if (notificationId) {
            notificationIds.push(notificationId);
            scheduledCount++;
          }
        } catch (error) {
          if (error instanceof Error) {
          this.logger.error(`Failed to send notification to ${recipient.id}: ${getErrorMessage(error)}`);
        } else {
          this.logger.error(`Failed to send notification to ${recipient.id}: ${JSON.stringify(error)}`);
        }
          failedCount++;
        }
      });

      await Promise.all(batchPromises);

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < Object.values(request.recipients).length) {
        await this.delay(1000); // 1 second delay between batches
      }
    }

    this.logger.log(`Bulk notification completed: ${scheduledCount} scheduled, ${failedCount} failed`);

    return {
      batchId,
      totalRecipients: Object.values(request.recipients).length,
      scheduledCount,
      failedCount,
      notificationIds,
    };
  }

  async getNotificationStatus(notificationId: string): Promise<NotificationRecord | null> {
    return this.notifications.get(notificationId) || null;
  }

  async getNotificationHistory(
    recipientId: string,
    filters?: {
      type?: NotificationType;
      channel?: NotificationChannel;
      status?: NotificationStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<NotificationRecord[]> {
    const allNotifications = Array.from(this.notifications.values());
    
    let filtered = allNotifications.filter(n => n.recipientId === recipientId);

    if (filters) {
      if (filters.type) {
        filtered = filtered.filter(n => n.type === filters.type);
      }
      if (filters.channel) {
        filtered = filtered.filter(n => n.channel === filters.channel);
      }
      if (filters.status) {
        filtered = filtered.filter(n => n.status === filters.status);
      }
      if (filters.startDate) {
        filtered = filtered.filter(n => n.createdAt >= filters.startDate);
      }
      if (filters.endDate) {
        filtered = filtered.filter(n => n.createdAt <= filters.endDate);
      }
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply limit
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  // ===== TEMPLATE MANAGEMENT =====

  async createTemplate(template: Partial<NotificationTemplate>): Promise<string> {
    const templateId = `tpl_${nanoid(8)}`;
    
    const newTemplate: NotificationTemplate = {
      id: templateId,
      name: template.name,
      type: template.type,
      channel: template.channel,
      language: template.language || 'en',
      subject: template.subject,
      content: template.content,
      variables: template.variables || [],
      isActive: template.isActive !== false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(templateId, newTemplate);
    this.logger.log(`Created notification template: ${templateId}`);

    return templateId;
  }

  async updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new BadRequestException('Template not found');
    }

    const updatedTemplate: NotificationTemplate = {
      ...template,
      ...updates,
      id: templateId, // Ensure ID doesn't change
      version: template.version + 1,
      updatedAt: new Date(),
    };

    this.templates.set(templateId, updatedTemplate);
    this.logger.log(`Updated notification template: ${templateId}`);
  }

  async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async getTemplates(filters?: {
    type?: NotificationType;
    channel?: NotificationChannel;
    language?: string;
    active?: boolean;
  }): Promise<NotificationTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (filters) {
      if (filters.type) {
        templates = templates.filter(t => t.type === filters.type);
      }
      if (filters.channel) {
        templates = templates.filter(t => t.channel === filters.channel);
      }
      if (filters.language) {
        templates = templates.filter(t => t.language === filters.language);
      }
      if (filters.active !== undefined) {
        templates = templates.filter(t => t.isActive === filters.active);
      }
    }

    return templates.sort((a, b) => a.name.localeCompare(b.name));
  }

  // ===== PREFERENCE MANAGEMENT =====

  async updateNotificationPreferences(
    customerId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const existing = this.preferences.get(customerId) || this.getDefaultPreferences(customerId);
    
    const updated: NotificationPreferences = {
      ...existing,
      ...preferences,
      customerId,
    };

    this.preferences.set(customerId, updated);
    this.logger.log(`Updated notification preferences for customer: ${customerId}`);
  }

  async getNotificationPreferences(customerId: string): Promise<NotificationPreferences> {
    return this.preferences.get(customerId) || this.getDefaultPreferences(customerId);
  }

  // ===== ANALYTICS AND REPORTING =====

  async getNotificationAnalytics(
    companyId: string,
    timeRange: { startDate: Date; endDate: Date }
  ): Promise<{
    summary: {
      totalSent: number;
      totalDelivered: number;
      totalFailed: number;
      deliveryRate: number;
      averageDeliveryTime: number;
    };
    byChannel: Record<NotificationChannel, {
      sent: number;
      delivered: number;
      failed: number;
      cost: number;
    }>;
    byType: Record<NotificationType, {
      sent: number;
      delivered: number;
      failed: number;
    }>;
    trends: Array<{
      date: string;
      sent: number;
      delivered: number;
      failed: number;
    }>;
    topFailureReasons: Array<{
      reason: string;
      count: number;
      percentage: number;
    }>;
  }> {
    // This would typically query from a database
    // For demo purposes, return mock analytics
    return {
      summary: {
        totalSent: 1250,
        totalDelivered: 1198,
        totalFailed: 52,
        deliveryRate: 95.8,
        averageDeliveryTime: 2.3, // seconds
      },
      byChannel: {
        [NotificationChannel.SMS]: { sent: 850, delivered: 832, failed: 18, cost: 42.50 },
        [NotificationChannel.EMAIL]: { sent: 300, delivered: 285, failed: 15, cost: 0.30 },
        [NotificationChannel.PUSH]: { sent: 100, delivered: 81, failed: 19, cost: 0.01 },
        [NotificationChannel.IN_APP]: { sent: 0, delivered: 0, failed: 0, cost: 0 },
        [NotificationChannel.WEBHOOK]: { sent: 0, delivered: 0, failed: 0, cost: 0 },
        [NotificationChannel.WHATSAPP]: { sent: 0, delivered: 0, failed: 0, cost: 0 },
      },
      byType: {
        [NotificationType.TRANSACTION_COMPLETED]: { sent: 650, delivered: 635, failed: 15 },
        [NotificationType.TRANSACTION_APPROVED]: { sent: 200, delivered: 195, failed: 5 },
        [NotificationType.BALANCE_LOW]: { sent: 150, delivered: 142, failed: 8 },
        [NotificationType.SECURITY_ALERT]: { sent: 100, delivered: 98, failed: 2 },
        [NotificationType.WELCOME]: { sent: 80, delivered: 78, failed: 2 },
        // ... other types with zero values
      } as any,
      trends: [
        { date: '2024-01-01', sent: 125, delivered: 120, failed: 5 },
        { date: '2024-01-02', sent: 135, delivered: 128, failed: 7 },
        // ... more trend data
      ],
      topFailureReasons: [
        { reason: 'Invalid phone number', count: 25, percentage: 48.1 },
        { reason: 'Network timeout', count: 15, percentage: 28.8 },
        { reason: 'Rate limit exceeded', count: 8, percentage: 15.4 },
        { reason: 'Other', count: 4, percentage: 7.7 },
      ],
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async sendTransactionNotification(
    transaction: Transaction, 
    type: NotificationType
  ): Promise<void> {
    if (!transactionEntity.customer) {
      this.logger.error(`Customer not found for transaction: ${transaction.id}`);
      return;
    }

    const data = {
      customerName: transactionEntity.customer.fullName,
      transactionType: transaction.type.toUpperCase(),
      transactionNumber: transaction.transactionNumber,
      amount: transaction.amount.toFixed(2),
      balance: transaction.accountBalanceAfter?.toFixed(2) || '0.00',
      completedDate: transaction.completedAt?.toLocaleDateString() || new Date().toLocaleDateString(),
      agentName: transaction.agentName,
      receiptNumber: transaction.receiptNumber,
    };

    // Send SMS and Email notifications
    await this.sendNotification({
      type,
      channel: [NotificationChannel.SMS, NotificationChannel.EMAIL],
      recipientId: transaction.customerId,
      recipientType: UserRole.CUSTOMER,
      data,
      priority: NotificationPriority.NORMAL,
    });
  }

  private async sendWelcomeNotification(account: Account): Promise<void> {
    const data = {
      customerName: account.customer.fullName,
      accountNumber: account.accountNumber,
      accountType: account.accountType.toUpperCase(),
    };

    await this.sendNotification({
      type: NotificationType.WELCOME,
      channel: NotificationChannel.SMS,
      recipientId: account.customerId,
      recipientType: UserRole.CUSTOMER,
      data,
      priority: NotificationPriority.NORMAL,
    });
  }

  private async sendBalanceAlert(account: Account, balance: number, threshold: number): Promise<void> {
    const data = {
      customerName: account.customer.fullName,
      accountNumber: account.accountNumber,
      balance: balance.toFixed(2),
      threshold: threshold.toFixed(2),
    };

    await this.sendNotification({
      type: NotificationType.BALANCE_LOW,
      channel: NotificationChannel.SMS,
      recipientId: account.customerId,
      recipientType: UserRole.CUSTOMER,
      data,
      priority: NotificationPriority.HIGH,
    });
  }

  private async createNotificationRecord(request: SendNotificationRequest): Promise<NotificationRecord> {
    const notificationId = `ntf_${nanoid(8)}`;
    
    // Get template if specified
    let subject = request.subject;
    let content = request.content;
    let templateId = request.templateId;

    if (request.templateId) {
      const template = await this.getTemplate(request.templateId);
      if (template) {
        subject = template.subject;
        content = template.content;
      }
    } else {
      // Try to find default template
      const channels = Array.isArray(request.channel) ? request.channel : [request.channel];
      for (const channel of channels) {
        const defaultTemplateKey = `${request.type}_${channel}`;
        const defaultTemplate = this.templates.get(defaultTemplateKey);
        if (defaultTemplate) {
          subject = defaultTemplate.subject;
          content = defaultTemplate.content;
          templateId = defaultTemplate.id;
          break;
        }
      }
    }

    // Replace template variables
    if (request.data) {
      subject = this.replaceTemplateVariables(subject, request.data);
      content = this.replaceTemplateVariables(content, request.data);
    }

    const notification: NotificationRecord = {
      id: notificationId,
      companyId: 'default', // Would get from request context
      type: request.type,
      channel: Array.isArray(request.channel) ? request.channel[0] : request.channel,
      recipientId: request.recipientId,
      recipientType: request.recipientType,
      subject: subject || '',
      content: content || '',
      templateId,
      templateData: request.data,
      priority: request.priority || NotificationPriority.NORMAL,
      status: request.scheduleAt ? NotificationStatus.SCHEDULED : NotificationStatus.PENDING,
      scheduledAt: request.scheduleAt,
      retryCount: 0,
      maxRetries: 3,
      metadata: request.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notifications.set(notificationId, notification);
    return notification;
  }

  private async sendToChannel(notification: NotificationRecord, channel: NotificationChannel): Promise<void> {
    this.logger.log(`Sending notification ${notification.id} via ${channel}`);

    try {
      notification.status = NotificationStatus.SENDING;
      notification.updatedAt = new Date();

      // Simulate sending to external service
      await this.delay(100); // Simulate network delay

      // Mock success/failure based on random chance (95% success rate)
      const success = Math.random() > 0.05;

      if (success) {
        notification.status = NotificationStatus.SENT;
        notification.sentAt = new Date();
        
        // Simulate delivery confirmation after a delay
        setTimeout(() => {
          notification.status = NotificationStatus.DELIVERED;
          notification.deliveredAt = new Date();
          this.notifications.set(notification.id, notification);
        }, 1000);

      } else {
        notification.status = NotificationStatus.FAILED;
        notification.failedAt = new Date();
        notification.failureReason = 'Mock delivery failure';
      }

      this.notifications.set(notification.id, notification);

    } catch (error) {
      notification.status = NotificationStatus.FAILED;
      notification.failedAt = new Date();
              notification.failureReason = error instanceof Error ? getErrorMessage(error) : JSON.stringify(error);
      this.notifications.set(notification.id, notification);
      
              if (error instanceof Error) {
          this.logger.error(`Failed to send notification ${notification.id}: ${getErrorMessage(error)}`);
        } else {
          this.logger.error(`Failed to send notification ${notification.id}: ${JSON.stringify(error)}`);
        }
    }
  }

  private isNotificationAllowed(
    type: NotificationType, 
    channel: NotificationChannel | NotificationChannel[], 
    preferences: NotificationPreferences
  ): boolean {
    const channels = Array.isArray(channel) ? channel : [channel];

    // Check if any channel is enabled
    for (const ch of channels) {
      switch (ch) {
        case NotificationChannel.SMS:
          if (!preferences.smsEnabled) continue;
          break;
        case NotificationChannel.EMAIL:
          if (!preferences.emailEnabled) continue;
          break;
        case NotificationChannel.PUSH:
          if (!preferences.pushEnabled) continue;
          break;
        case NotificationChannel.IN_APP:
          if (!preferences.inAppEnabled) continue;
          break;
      }

      // Check notification type preferences
      switch (type) {
        case NotificationType.TRANSACTION_COMPLETED:
        case NotificationType.TRANSACTION_APPROVED:
        case NotificationType.TRANSACTION_REJECTED:
        case NotificationType.TRANSACTION_FAILED:
          if (!preferences.transactionAlerts) continue;
          break;
        case NotificationType.SECURITY_ALERT:
          if (!preferences.securityAlerts) continue;
          break;
        case NotificationType.PROMOTIONAL:
          if (!preferences.promotionalMessages) continue;
          break;
        case NotificationType.REMINDER:
          if (!preferences.reminderMessages) continue;
          break;
      }

      // Check quiet hours
      if (preferences.quietHours.enabled && this.isInQuietHours(preferences.quietHours)) {
        // Allow critical notifications during quiet hours
        if (type !== NotificationType.SECURITY_ALERT) {
          continue;
        }
      }

      return true; // At least one channel is allowed
    }

    return false; // No channels allowed
  }

  private isInQuietHours(quietHours: NotificationPreferences['quietHours']): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Simple time comparison (doesn't handle timezone conversion properly)
    return currentTime >= quietHours.startTime && currentTime <= quietHours.endTime;
  }

  private replaceTemplateVariables(template: string, data: Record<string, any>): string {
    let result = template;
    
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    });

    return result;
  }

  private getDefaultPreferences(customerId: string): NotificationPreferences {
    return {
      customerId,
      smsEnabled: true,
      emailEnabled: false,
      pushEnabled: true,
      inAppEnabled: true,
      transactionAlerts: true,
      securityAlerts: true,
      promotionalMessages: false,
      reminderMessages: true,
      preferredLanguage: 'en',
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00',
        timezone: 'GMT',
      },
      frequencies: {
        transactionAlerts: 'immediate',
        balanceAlerts: 'immediate',
        securityAlerts: 'immediate',
        promotional: 'never',
      },
    };
  }

  private initializeDefaultTemplates(): void {
    Object.entries(this.defaultTemplates).forEach(([key, template]) => {
      const templateId = `tpl_${key}`;
      this.templates.set(templateId, {
        id: templateId,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...template,
      } as NotificationTemplate);
    });

    this.logger.log(`Initialized ${Object.keys(this.defaultTemplates).length} default templates`);
  }

  private initializeDefaultPreferences(): void {
    // Initialize with some sample customer preferences
    this.logger.log('Initialized default notification preferences');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===== PUBLIC UTILITY METHODS =====

  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.status = NotificationStatus.READ;
      notification.readAt = new Date();
      notification.updatedAt = new Date();
      this.notifications.set(notificationId, notification);
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification && notification.status === NotificationStatus.SCHEDULED) {
      notification.status = NotificationStatus.CANCELLED;
      notification.updatedAt = new Date();
      this.notifications.set(notificationId, notification);
    }
  }

  async retryFailedNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification && 
        notification.status === NotificationStatus.FAILED && 
        notification.retryCount < notification.maxRetries) {
      
      notification.retryCount++;
      notification.status = NotificationStatus.PENDING;
      notification.updatedAt = new Date();
      this.notifications.set(notificationId, notification);

      // Send notification again
      await this.sendToChannel(notification, notification.channel);
    }
  }

  async getDeliveryReport(notificationId: string): Promise<NotificationDeliveryReport | null> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return null;
    }

    return {
      notificationId: notification.id,
      channel: notification.channel,
      status: notification.status,
      sentAt: notification.sentAt,
      deliveredAt: notification.deliveredAt,
      readAt: notification.readAt,
      failureReason: notification.failureReason,
      providerResponse: null, // Would contain actual provider response
      cost: this.calculateNotificationCost(notification.channel),
      metadata: notification.metadata,
    };
  }

  private calculateNotificationCost(channel: NotificationChannel): number {
    return this.channelLimits[channel]?.costPerMessage || 0;
  }
}