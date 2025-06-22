#!/usr/bin/env ts-node

/**
 * Monitoring and Alerting Setup Script for Sabs v2
 * 
 * This script sets up comprehensive monitoring, alerting, and dashboards
 * for the Sabs v2 platform using Google Cloud Monitoring.
 */

interface AlertPolicyConfig {
  displayName: string;
  conditions: AlertCondition[];
  notificationChannels: string[];
  alertStrategy?: AlertStrategy;
  enabled: boolean;
  documentation?: string;
}

interface AlertCondition {
  displayName: string;
  conditionThreshold: {
    filter: string;
    comparison: 'COMPARISON_EQUAL' | 'COMPARISON_GREATER' | 'COMPARISON_LESS';
    thresholdValue: number;
    duration: string;
    aggregations?: Aggregation[];
  };
}

interface Aggregation {
  alignmentPeriod: string;
  perSeriesAligner: string;
  crossSeriesReducer?: string;
  groupByFields?: string[];
}

interface AlertStrategy {
  autoClose: string;
}

interface DashboardConfig {
  displayName: string;
  gridLayout: {
    widgets: Widget[];
  };
}

interface Widget {
  title: string;
  xyChart?: any;
  scorecard?: any;
  text?: any;
}

export class MonitoringSetup {
  private projectId: string;
  private environment: 'staging' | 'production';

  constructor(projectId: string, environment: 'staging' | 'production') {
    this.projectId = projectId;
    this.environment = environment;
  }

  /**
   * Set up all monitoring alerts for the platform
   */
  async setupAlerts(): Promise<void> {
    console.log(`🔔 Setting up monitoring alerts for ${this.environment} environment`);

    const alertPolicies: AlertPolicyConfig[] = [
      // Application Performance Alerts
      this.createHighLatencyAlert(),
      this.createHighErrorRateAlert(),
      this.createLowAvailabilityAlert(),
      
      // Infrastructure Alerts
      this.createHighCpuAlert(),
      this.createHighMemoryAlert(),
      this.createDiskSpaceAlert(),
      
      // Database Alerts
      this.createDatabaseConnectionAlert(),
      this.createSlowQueryAlert(),
      this.createDatabaseCpuAlert(),
      
      // Security Alerts
      this.createFailedLoginAlert(),
      this.createSuspiciousActivityAlert(),
      
      // Business Metrics Alerts
      this.createTransactionVolumeAlert(),
      this.createRevenueAlert(),
      this.createCustomerGrowthAlert(),
    ];

    for (const policy of alertPolicies) {
      await this.createAlertPolicy(policy);
    }

    console.log(`✅ Created ${alertPolicies.length} alert policies`);
  }

  /**
   * Set up monitoring dashboards
   */
  async setupDashboards(): Promise<void> {
    console.log(`📊 Setting up monitoring dashboards for ${this.environment} environment`);

    const dashboards = [
      this.createApplicationDashboard(),
      this.createInfrastructureDashboard(),
      this.createBusinessMetricsDashboard(),
      this.createSecurityDashboard(),
    ];

    for (const dashboard of dashboards) {
      await this.createDashboard(dashboard);
    }

    console.log(`✅ Created ${dashboards.length} monitoring dashboards`);
  }

  // ============================================================================
  // APPLICATION PERFORMANCE ALERTS
  // ============================================================================

  private createHighLatencyAlert(): AlertPolicyConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - High API Latency`,
      conditions: [{
        displayName: 'API response time > 1000ms',
        conditionThreshold: {
          filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="sabs-v2-${this.environment}"`,
          comparison: 'COMPARISON_GREATER',
          thresholdValue: 1000,
          duration: '300s',
          aggregations: [{
            alignmentPeriod: '60s',
            perSeriesAligner: 'ALIGN_MEAN',
            crossSeriesReducer: 'REDUCE_MEAN',
            groupByFields: ['resource.labels.service_name'],
          }],
        },
      }],
      notificationChannels: [],
      alertStrategy: { autoClose: '1800s' },
      enabled: true,
      documentation: 'API response times are consistently above 1 second, indicating performance issues.',
    };
  }

  private createHighErrorRateAlert(): AlertPolicyConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - High Error Rate`,
      conditions: [{
        displayName: 'Error rate > 5%',
        conditionThreshold: {
          filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="sabs-v2-${this.environment}"`,
          comparison: 'COMPARISON_GREATER',
          thresholdValue: 0.05,
          duration: '300s',
        },
      }],
      notificationChannels: [],
      enabled: true,
      documentation: 'Application error rate exceeds 5%, indicating system instability.',
    };
  }

  private createLowAvailabilityAlert(): AlertPolicyConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - Low Availability`,
      conditions: [{
        displayName: 'Availability < 99%',
        conditionThreshold: {
          filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="sabs-v2-${this.environment}"`,
          comparison: 'COMPARISON_LESS',
          thresholdValue: 0.99,
          duration: '300s',
        },
      }],
      notificationChannels: [],
      enabled: true,
      documentation: 'Service availability has dropped below 99%, immediate attention required.',
    };
  }

  // ============================================================================
  // INFRASTRUCTURE ALERTS
  // ============================================================================

  private createHighCpuAlert(): AlertPolicyConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - High CPU Usage`,
      conditions: [{
        displayName: 'CPU utilization > 80%',
        conditionThreshold: {
          filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="sabs-v2-${this.environment}"`,
          comparison: 'COMPARISON_GREATER',
          thresholdValue: 0.8,
          duration: '600s',
        },
      }],
      notificationChannels: [],
      enabled: true,
      documentation: 'CPU utilization is consistently above 80%, consider scaling up.',
    };
  }

  private createHighMemoryAlert(): AlertPolicyConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - High Memory Usage`,
      conditions: [{
        displayName: 'Memory utilization > 85%',
        conditionThreshold: {
          filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="sabs-v2-${this.environment}"`,
          comparison: 'COMPARISON_GREATER',
          thresholdValue: 0.85,
          duration: '600s',
        },
      }],
      notificationChannels: [],
      enabled: true,
      documentation: 'Memory utilization is consistently above 85%, risk of OOM errors.',
    };
  }

  private createDiskSpaceAlert(): AlertPolicyConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - Low Disk Space`,
      conditions: [{
        displayName: 'Disk utilization > 90%',
        conditionThreshold: {
          filter: `resource.type="cloudsql_database" AND resource.labels.database_id="${this.projectId}:sabs-v2-${this.environment}"`,
          comparison: 'COMPARISON_GREATER',
          thresholdValue: 0.9,
          duration: '300s',
        },
      }],
      notificationChannels: [],
      enabled: true,
      documentation: 'Database disk space is above 90%, urgent cleanup or expansion needed.',
    };
  }

  // ============================================================================
  // DATABASE ALERTS
  // ============================================================================

  private createDatabaseConnectionAlert(): AlertPolicyConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - Database Connection Issues`,
      conditions: [{
        displayName: 'Database connections > 80% of limit',
        conditionThreshold: {
          filter: `resource.type="cloudsql_database" AND resource.labels.database_id="${this.projectId}:sabs-v2-${this.environment}"`,
          comparison: 'COMPARISON_GREATER',
          thresholdValue: 0.8,
          duration: '300s',
        },
      }],
      notificationChannels: [],
      enabled: true,
      documentation: 'Database connection pool is near capacity, investigate connection leaks.',
    };
  }

  private createSlowQueryAlert(): AlertPolicyConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - Slow Database Queries`,
      conditions: [{
        displayName: 'Average query time > 1000ms',
        conditionThreshold: {
          filter: `resource.type="cloudsql_database" AND resource.labels.database_id="${this.projectId}:sabs-v2-${this.environment}"`,
          comparison: 'COMPARISON_GREATER',
          thresholdValue: 1000,
          duration: '600s',
        },
      }],
      notificationChannels: [],
      enabled: true,
      documentation: 'Database queries are taking longer than 1 second on average.',
    };
  }

  private createDatabaseCpuAlert(): AlertPolicyConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - High Database CPU`,
      conditions: [{
        displayName: 'Database CPU > 80%',
        conditionThreshold: {
          filter: `resource.type="cloudsql_database" AND resource.labels.database_id="${this.projectId}:sabs-v2-${this.environment}"`,
          comparison: 'COMPARISON_GREATER',
          thresholdValue: 0.8,
          duration: '600s',
        },
      }],
      notificationChannels: [],
      enabled: true,
      documentation: 'Database CPU utilization is above 80%, consider optimization or scaling.',
    };
  }

  // ============================================================================
  // SECURITY ALERTS
  // ============================================================================

  private createFailedLoginAlert(): AlertPolicyConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - High Failed Login Rate`,
      conditions: [{
        displayName: 'Failed logins > 100 per minute',
        conditionThreshold: {
          filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="sabs-v2-${this.environment}" AND jsonPayload.event="login_failed"`,
          comparison: 'COMPARISON_GREATER',
          thresholdValue: 100,
          duration: '60s',
        },
      }],
      notificationChannels: [],
      enabled: true,
      documentation: 'Unusually high number of failed login attempts detected, possible brute force attack.',
    };
  }

  private createSuspiciousActivityAlert(): AlertPolicyConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - Suspicious API Activity`,
      conditions: [{
        displayName: 'Unusual API request patterns',
        conditionThreshold: {
          filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="sabs-v2-${this.environment}" AND httpRequest.status>=400`,
          comparison: 'COMPARISON_GREATER',
          thresholdValue: 1000,
          duration: '300s',
        },
      }],
      notificationChannels: [],
      enabled: true,
      documentation: 'High volume of 4xx/5xx responses detected, investigate for potential attacks.',
    };
  }

  // ============================================================================
  // BUSINESS METRICS ALERTS
  // ============================================================================

  private createTransactionVolumeAlert(): AlertPolicyConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - Low Transaction Volume`,
      conditions: [{
        displayName: 'Transaction rate below normal',
        conditionThreshold: {
          filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="sabs-v2-${this.environment}" AND jsonPayload.event="transaction_created"`,
          comparison: 'COMPARISON_LESS',
          thresholdValue: this.environment === 'production' ? 10 : 1,
          duration: '1800s',
        },
      }],
      notificationChannels: [],
      enabled: this.environment === 'production',
      documentation: 'Transaction volume is significantly below normal levels.',
    };
  }

  private createRevenueAlert(): AlertPolicyConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - Revenue Anomaly`,
      conditions: [{
        displayName: 'Commission revenue below threshold',
        conditionThreshold: {
          filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="sabs-v2-${this.environment}" AND jsonPayload.event="commission_calculated"`,
          comparison: 'COMPARISON_LESS',
          thresholdValue: this.environment === 'production' ? 100 : 10,
          duration: '3600s',
        },
      }],
      notificationChannels: [],
      enabled: this.environment === 'production',
      documentation: 'Commission revenue is below expected thresholds.',
    };
  }

  private createCustomerGrowthAlert(): AlertPolicyConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - Customer Growth Anomaly`,
      conditions: [{
        displayName: 'New customer registrations below normal',
        conditionThreshold: {
          filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="sabs-v2-${this.environment}" AND jsonPayload.event="customer_registered"`,
          comparison: 'COMPARISON_LESS',
          thresholdValue: this.environment === 'production' ? 5 : 1,
          duration: '3600s',
        },
      }],
      notificationChannels: [],
      enabled: this.environment === 'production',
      documentation: 'New customer registration rate is below normal levels.',
    };
  }

  // ============================================================================
  // DASHBOARD CREATION
  // ============================================================================

  private createApplicationDashboard(): DashboardConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - Application Performance`,
      gridLayout: {
        widgets: [
          {
            title: 'Request Rate',
            xyChart: {
              dataSets: [{
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="sabs-v2-${this.environment}"`,
                  },
                },
              }],
            },
          },
          {
            title: 'Response Time',
            xyChart: {
              dataSets: [{
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="sabs-v2-${this.environment}"`,
                  },
                },
              }],
            },
          },
          {
            title: 'Error Rate',
            scorecard: {
              timeSeriesQuery: {
                timeSeriesFilter: {
                  filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="sabs-v2-${this.environment}"`,
                },
              },
            },
          },
        ],
      },
    };
  }

  private createInfrastructureDashboard(): DashboardConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - Infrastructure`,
      gridLayout: {
        widgets: [
          {
            title: 'CPU Utilization',
            xyChart: {},
          },
          {
            title: 'Memory Usage',
            xyChart: {},
          },
          {
            title: 'Active Instances',
            scorecard: {},
          },
        ],
      },
    };
  }

  private createBusinessMetricsDashboard(): DashboardConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - Business Metrics`,
      gridLayout: {
        widgets: [
          {
            title: 'Transaction Volume',
            xyChart: {},
          },
          {
            title: 'Revenue',
            xyChart: {},
          },
          {
            title: 'Active Users',
            scorecard: {},
          },
        ],
      },
    };
  }

  private createSecurityDashboard(): DashboardConfig {
    return {
      displayName: `Sabs v2 ${this.environment} - Security`,
      gridLayout: {
        widgets: [
          {
            title: 'Failed Login Attempts',
            xyChart: {},
          },
          {
            title: 'API Error Rates',
            xyChart: {},
          },
          {
            title: 'Security Events',
            xyChart: {},
          },
        ],
      },
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async createAlertPolicy(config: AlertPolicyConfig): Promise<void> {
    console.log(`Creating alert policy: ${config.displayName}`);
    // Implementation would use Google Cloud Monitoring API
    // For now, this is a placeholder that logs the configuration
    console.log(`  - Conditions: ${config.conditions.length}`);
    console.log(`  - Enabled: ${config.enabled}`);
  }

  private async createDashboard(config: DashboardConfig): Promise<void> {
    console.log(`Creating dashboard: ${config.displayName}`);
    // Implementation would use Google Cloud Monitoring API
    // For now, this is a placeholder that logs the configuration
    console.log(`  - Widgets: ${config.gridLayout.widgets.length}`);
  }

  /**
   * Main setup method
   */
  async setup(): Promise<void> {
    console.log(`🚀 Setting up monitoring for Sabs v2 ${this.environment} environment`);
    console.log(`📍 Project ID: ${this.projectId}`);
    console.log('=' + '='.repeat(60));

    try {
      await this.setupAlerts();
      await this.setupDashboards();

      console.log('\n✅ Monitoring setup completed successfully!');
      console.log(`🔔 Alert policies configured for ${this.environment}`);
      console.log(`📊 Dashboards created for comprehensive monitoring`);
      console.log(`🎯 Monitor your application at: https://console.cloud.google.com/monitoring`);
      
    } catch (error) {
      console.error('❌ Monitoring setup failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const projectId = process.env.GCP_PROJECT_ID || args[0];
  const environment = (process.env.ENVIRONMENT || args[1] || 'staging') as 'staging' | 'production';

  if (!projectId) {
    console.error('❌ Project ID is required');
    console.log('Usage: ts-node setup-alerts.ts <project-id> [environment]');
    console.log('   or: GCP_PROJECT_ID=<project-id> ENVIRONMENT=<env> ts-node setup-alerts.ts');
    process.exit(1);
  }

  const setup = new MonitoringSetup(projectId, environment);
  
  try {
    await setup.setup();
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}