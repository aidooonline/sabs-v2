'use client';

interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
  priority: number;
  enabled: boolean;
  config: Record<string, any>;
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  channels: NotificationChannel[];
  variables: string[];
  category: 'workflow' | 'system' | 'alert' | 'reminder';
}

interface NotificationRecipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  pushToken?: string;
  preferences: NotificationPreferences;
  timezone: string;
  language: string;
}

interface NotificationPreferences {
  channels: {
    email: { enabled: boolean; priority: string[] };
    sms: { enabled: boolean; priority: string[] };
    push: { enabled: boolean; priority: string[] };
    in_app: { enabled: boolean; priority: string[] };
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  frequency: {
    immediate: string[];
    digest: string[];
    weekly: string[];
  };
}

interface NotificationRequest {
  templateId: string;
  recipients: string[];
  variables: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  channels?: string[];
  scheduledAt?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

interface NotificationDelivery {
  id: string;
  notificationId: string;
  recipientId: string;
  channel: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt?: string;
  deliveredAt?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

interface DeliveryReport {
  notificationId: string;
  totalRecipients: number;
  deliveries: NotificationDelivery[];
  summary: {
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
    bounced: number;
  };
  channelBreakdown: Record<string, number>;
}

class NotificationService {
  private apiBase: string;
  private templates: Map<string, NotificationTemplate> = new Map();
  private recipients: Map<string, NotificationRecipient> = new Map();
  private deliveries: Map<string, NotificationDelivery[]> = new Map();
  private rateLimits: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(apiBase: string = '/api/notifications') {
    this.apiBase = apiBase;
    this.initializeService();
  }

  private async initializeService() {
    // Load templates and recipient preferences
    await Promise.all([
      this.loadTemplates(),
      this.loadRecipients(),
      this.initializeChannels()
    ]);
  }

  private async loadTemplates() {
    try {
      const response = await fetch(`${this.apiBase}/templates`);
      const templates = await response.json();
      
      templates.forEach((template: NotificationTemplate) => {
        this.templates.set(template.id, template);
      });
    } catch (error) {
      console.error('Failed to load notification templates:', error);
    }
  }

  private async loadRecipients() {
    try {
      const response = await fetch(`${this.apiBase}/recipients`);
      const recipients = await response.json();
      
      recipients.forEach((recipient: NotificationRecipient) => {
        this.recipients.set(recipient.id, recipient);
      });
    } catch (error) {
      console.error('Failed to load notification recipients:', error);
    }
  }

  private async initializeChannels() {
    // Initialize push notification service worker
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Push service worker registered:', registration);
      } catch (error) {
        console.error('Push service worker registration failed:', error);
      }
    }
  }

  // Send notification
  async sendNotification(request: NotificationRequest): Promise<string> {
    const notificationId = this.generateId();
    
    try {
      // Validate request
      this.validateNotificationRequest(request);
      
      // Get template
      const template = this.templates.get(request.templateId);
      if (!template) {
        throw new Error(`Template ${request.templateId} not found`);
      }

      // Process recipients
      const recipients = request.recipients
        .map(id => this.recipients.get(id))
        .filter(Boolean) as NotificationRecipient[];

      if (recipients.length === 0) {
        throw new Error('No valid recipients found');
      }

      // Render content for each recipient
      const deliveries: NotificationDelivery[] = [];
      
      for (const recipient of recipients) {
        const channels = this.selectChannels(template, recipient, request);
        
        for (const channel of channels) {
          if (this.shouldDeliverNow(recipient, request.priority, channel.type)) {
            const delivery = await this.deliverToChannel(
              notificationId,
              template,
              recipient,
              channel,
              request
            );
            deliveries.push(delivery);
          }
        }
      }

      // Store deliveries
      this.deliveries.set(notificationId, deliveries);

      // Schedule retries for failed deliveries
      this.scheduleRetries(notificationId);

      return notificationId;

    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  // Select appropriate channels for delivery
  private selectChannels(
    template: NotificationTemplate,
    recipient: NotificationRecipient,
    request: NotificationRequest
  ): NotificationChannel[] {
    const availableChannels = template.channels.filter(channel => channel.enabled);
    const userPreferences = recipient.preferences;
    
    // Filter by user preferences
    const eligibleChannels = availableChannels.filter(channel => {
      const pref = userPreferences.channels[channel.type as keyof typeof userPreferences.channels];
      return pref?.enabled && pref.priority.includes(request.priority);
    });

    // Sort by priority
    eligibleChannels.sort((a, b) => a.priority - b.priority);

    // Apply channel override from request
    if (request.channels && request.channels.length > 0) {
      return eligibleChannels.filter(channel => 
        request.channels!.includes(channel.type)
      );
    }

    return eligibleChannels;
  }

  // Check if notification should be delivered now
  private shouldDeliverNow(
    recipient: NotificationRecipient,
    priority: string,
    channel: string
  ): boolean {
    // Critical notifications always go through
    if (priority === 'critical') {
      return true;
    }

    // Check quiet hours
    const { quietHours } = recipient.preferences;
    if (quietHours.enabled && channel !== 'in_app') {
      const now = new Date();
      const userTime = new Date(now.toLocaleString('en-US', { timeZone: recipient.timezone }));
      const hour = userTime.getHours();
      const start = parseInt(quietHours.start.split(':')[0]);
      const end = parseInt(quietHours.end.split(':')[0]);
      
      if ((start <= end && hour >= start && hour < end) ||
          (start > end && (hour >= start || hour < end))) {
        return false;
      }
    }

    // Check rate limits
    const rateLimitKey = `${recipient.id}:${channel}`;
    const rateLimit = this.rateLimits.get(rateLimitKey);
    
    if (rateLimit && rateLimit.count > this.getChannelRateLimit(channel)) {
      if (Date.now() < rateLimit.resetAt) {
        return false;
      } else {
        // Reset rate limit
        this.rateLimits.delete(rateLimitKey);
      }
    }

    return true;
  }

  // Get rate limit for channel
  private getChannelRateLimit(channel: string): number {
    const limits = {
      email: 10,     // 10 per hour
      sms: 5,        // 5 per hour  
      push: 20,      // 20 per hour
      in_app: 100    // 100 per hour
    };
    
    return limits[channel as keyof typeof limits] || 10;
  }

  // Deliver notification to specific channel
  private async deliverToChannel(
    notificationId: string,
    template: NotificationTemplate,
    recipient: NotificationRecipient,
    channel: NotificationChannel,
    request: NotificationRequest
  ): Promise<NotificationDelivery> {
    const deliveryId = this.generateId();
    
    const delivery: NotificationDelivery = {
      id: deliveryId,
      notificationId,
      recipientId: recipient.id,
      channel: channel.type,
      status: 'pending',
      retryCount: 0,
      maxRetries: this.getMaxRetries(channel.type)
    };

    try {
      // Render content
      const content = this.renderTemplate(template, recipient, request.variables);
      
      // Update rate limit
      this.updateRateLimit(recipient.id, channel.type);

      // Deliver based on channel type
      switch (channel.type) {
        case 'email':
          await this.sendEmail(recipient, content, channel.config);
          break;
        case 'sms':
          await this.sendSMS(recipient, content, channel.config);
          break;
        case 'push':
          await this.sendPushNotification(recipient, content, channel.config);
          break;
        case 'in_app':
          await this.sendInAppNotification(recipient, content, channel.config);
          break;
        case 'webhook':
          await this.sendWebhook(recipient, content, channel.config);
          break;
        default:
          throw new Error(`Unsupported channel type: ${channel.type}`);
      }

      delivery.status = 'sent';
      delivery.sentAt = new Date().toISOString();

    } catch (error) {
      delivery.status = 'failed';
      delivery.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return delivery;
  }

  // Send email notification
  private async sendEmail(
    recipient: NotificationRecipient,
    content: RenderedContent,
    config: any
  ): Promise<void> {
    if (!recipient.email) {
      throw new Error('Recipient email not available');
    }

    const emailData = {
      to: recipient.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
      from: config.from || 'noreply@sabsv2.com',
      replyTo: config.replyTo
    };

    const response = await fetch(`${this.apiBase}/send/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`Email delivery failed: ${response.statusText}`);
    }
  }

  // Send SMS notification
  private async sendSMS(
    recipient: NotificationRecipient,
    content: RenderedContent,
    config: any
  ): Promise<void> {
    if (!recipient.phone) {
      throw new Error('Recipient phone number not available');
    }

    const smsData = {
      to: recipient.phone,
      message: content.text,
      from: config.from || 'SabsV2'
    };

    const response = await fetch(`${this.apiBase}/send/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smsData)
    });

    if (!response.ok) {
      throw new Error(`SMS delivery failed: ${response.statusText}`);
    }
  }

  // Send push notification
  private async sendPushNotification(
    recipient: NotificationRecipient,
    content: RenderedContent,
    config: any
  ): Promise<void> {
    if (!recipient.pushToken) {
      throw new Error('Recipient push token not available');
    }

    const pushData = {
      to: recipient.pushToken,
      title: content.subject,
      body: content.text,
      icon: config.icon || '/icons/notification-icon.png',
      badge: config.badge || '/icons/badge-icon.png',
      data: content.metadata
    };

    const response = await fetch(`${this.apiBase}/send/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pushData)
    });

    if (!response.ok) {
      throw new Error(`Push notification delivery failed: ${response.statusText}`);
    }
  }

  // Send in-app notification
  private async sendInAppNotification(
    recipient: NotificationRecipient,
    content: RenderedContent,
    config: any
  ): Promise<void> {
    const inAppData = {
      recipientId: recipient.id,
      title: content.subject,
      message: content.text,
      type: config.type || 'info',
      priority: config.priority || 'medium',
      metadata: content.metadata
    };

    const response = await fetch(`${this.apiBase}/send/in-app`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inAppData)
    });

    if (!response.ok) {
      throw new Error(`In-app notification delivery failed: ${response.statusText}`);
    }
  }

  // Send webhook notification
  private async sendWebhook(
    recipient: NotificationRecipient,
    content: RenderedContent,
    config: any
  ): Promise<void> {
    if (!config.url) {
      throw new Error('Webhook URL not configured');
    }

    const webhookData = {
      recipient: recipient.id,
      subject: content.subject,
      message: content.text,
      timestamp: new Date().toISOString(),
      metadata: content.metadata
    };

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.authorization || '',
        'X-Webhook-Secret': config.secret || ''
      },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.statusText}`);
    }
  }

  // Render template content
  private renderTemplate(
    template: NotificationTemplate,
    recipient: NotificationRecipient,
    variables: Record<string, any>
  ): RenderedContent {
    const context = {
      ...variables,
      recipient: {
        name: recipient.name,
        id: recipient.id
      },
      timestamp: new Date().toISOString()
    };

    // Simple template rendering (in production, use a proper template engine)
    let subject = template.subject;
    let content = template.content;

    Object.entries(context).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(placeholder, String(value));
      content = content.replace(placeholder, String(value));
    });

    return {
      subject,
      text: this.stripHtml(content),
      html: content,
      metadata: variables
    };
  }

  // Strip HTML tags for text content
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  // Update rate limit counter
  private updateRateLimit(recipientId: string, channel: string): void {
    const key = `${recipientId}:${channel}`;
    const now = Date.now();
    const resetAt = now + (60 * 60 * 1000); // 1 hour
    
    const current = this.rateLimits.get(key);
    if (current && now < current.resetAt) {
      current.count++;
    } else {
      this.rateLimits.set(key, { count: 1, resetAt });
    }
  }

  // Get max retries for channel
  private getMaxRetries(channel: string): number {
    const retries = {
      email: 3,
      sms: 2,
      push: 2,
      in_app: 1,
      webhook: 3
    };
    
    return retries[channel as keyof typeof retries] || 1;
  }

  // Schedule retries for failed deliveries
  private scheduleRetries(notificationId: string): void {
    const deliveries = this.deliveries.get(notificationId) || [];
    
    deliveries
      .filter(d => d.status === 'failed' && d.retryCount < d.maxRetries)
      .forEach(delivery => {
        const delay = Math.pow(2, delivery.retryCount) * 1000; // Exponential backoff
        
        setTimeout(() => {
          this.retryDelivery(delivery);
        }, delay);
      });
  }

  // Retry failed delivery
  private async retryDelivery(delivery: NotificationDelivery): Promise<void> {
    delivery.retryCount++;
    delivery.status = 'pending';
    
    // Retry logic would go here
    // This is a simplified version
  }

  // Get delivery report
  async getDeliveryReport(notificationId: string): Promise<DeliveryReport> {
    const deliveries = this.deliveries.get(notificationId) || [];
    
    const summary = deliveries.reduce(
      (acc, delivery) => {
        acc[delivery.status]++;
        return acc;
      },
      { sent: 0, delivered: 0, failed: 0, pending: 0, bounced: 0 }
    );

    const channelBreakdown = deliveries.reduce(
      (acc, delivery) => {
        acc[delivery.channel] = (acc[delivery.channel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      notificationId,
      totalRecipients: new Set(deliveries.map(d => d.recipientId)).size,
      deliveries,
      summary,
      channelBreakdown
    };
  }

  // Validate notification request
  private validateNotificationRequest(request: NotificationRequest): void {
    if (!request.templateId) {
      throw new Error('Template ID is required');
    }
    
    if (!request.recipients || request.recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }
    
    if (!['low', 'medium', 'high', 'critical'].includes(request.priority)) {
      throw new Error('Invalid priority level');
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

interface RenderedContent {
  subject: string;
  text: string;
  html: string;
  metadata: Record<string, any>;
}

// Singleton instance
export const notificationService = new NotificationService();

// Convenience functions
export const sendWorkflowNotification = async (
  workflowId: string,
  event: string,
  recipients: string[],
  variables: Record<string, any> = {}
) => {
  return notificationService.sendNotification({
    templateId: `workflow_${event}`,
    recipients,
    variables: { ...variables, workflowId },
    priority: 'medium'
  });
};

export const sendUrgentAlert = async (
  message: string,
  recipients: string[],
  metadata: Record<string, any> = {}
) => {
  return notificationService.sendNotification({
    templateId: 'urgent_alert',
    recipients,
    variables: { message },
    priority: 'critical',
    metadata
  });
};

export const sendSLAWarning = async (
  workflowId: string,
  timeRemaining: number,
  recipients: string[]
) => {
  return notificationService.sendNotification({
    templateId: 'sla_warning',
    recipients,
    variables: { workflowId, timeRemaining },
    priority: 'high'
  });
};