/**
 * NEXUS AI — Monitoring & Alerts Configuration
 *
 * Thresholds and alert rules for production monitoring
 */

export const MONITORING_CONFIG = {
  // Error Rate Monitoring
  errorRate: {
    critical: 0.05, // 5%
    warning: 0.02,  // 2%
    checkInterval: 60, // seconds
  },

  // Task Execution Performance
  taskExecution: {
    p95Latency: 2000, // 2 seconds
    p99Latency: 5000, // 5 seconds
    maxRetries: 3,
    timeoutMs: 30000,
  },

  // API Performance
  api: {
    p95ResponseTime: 500, // 500ms
    maxConcurrentRequests: 1000,
    rateLimitPerMinute: 1000,
  },

  // Database
  database: {
    maxConnectionPoolSize: 20,
    slowQueryThreshold: 100, // ms
    maxConnections: 100,
  },

  // Cost Tracking
  costs: {
    monthlyBudgetAlert: 0.9, // Alert at 90% of budget
    dailyBudgetAlert: 0.8,   // Alert at 80% of daily budget
  },

  // Integration Health
  integrations: {
    maxConsecutiveFailures: 3,
    tokenRefreshInterval: 3600, // 1 hour
    syncTimeout: 300000, // 5 minutes
  },

  // Inngest Workflows
  workflows: {
    maxQueuedTime: 60000, // 1 minute
    maxExecutionTime: 600000, // 10 minutes
    maxRetries: 3,
  },
};

/**
 * Alert Rules
 */
export const ALERT_RULES = {
  criticalErrors: {
    name: 'Critical Errors',
    condition: 'error_rate > 0.05',
    severity: 'critical',
    actions: ['page_oncall', 'slack_alert', 'sentry_issue'],
  },

  highLatency: {
    name: 'High API Latency',
    condition: 'p95_latency > 2000',
    severity: 'warning',
    actions: ['slack_alert', 'auto_scale_up'],
  },

  databaseIssues: {
    name: 'Database Connection Issues',
    condition: 'db_connection_errors > 10/min',
    severity: 'critical',
    actions: ['page_oncall', 'slack_alert', 'failover_check'],
  },

  integrationFailure: {
    name: 'Integration Sync Failures',
    condition: 'consecutive_failures > 3',
    severity: 'warning',
    actions: ['slack_alert', 'disable_integration', 'notify_user'],
  },

  budgetOverflow: {
    name: 'Budget Alert',
    condition: 'spent_percentage > 90',
    severity: 'warning',
    actions: ['slack_alert', 'email_alert', 'notify_account_owner'],
  },

  upstreamFailure: {
    name: 'Upstream API Failure',
    condition: 'api_response_code >= 500 for duration > 5min',
    severity: 'critical',
    actions: ['page_oncall', 'slack_alert', 'fallback_to_cache'],
  },
};

/**
 * Logging Configuration
 */
export const LOGGING_CONFIG = {
  // Log Levels
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    critical: 4,
  },

  // What to log
  logTargets: {
    errors: true,
    apiRequests: true,
    taskExecution: true,
    integrationSync: true,
    costTracking: true,
    authentication: true,
    webhookEvents: true,
  },

  // Sampling (log every Nth event for high-volume)
  sampling: {
    apiRequests: 0.1, // 10%
    taskExecution: 0.5, // 50%
    webhookEvents: 1.0, // 100%
  },

  // Retention
  retention: {
    errors: 90, // days
    audit: 365,
    performance: 30,
  },
};

/**
 * Dashboard Metrics
 */
export const DASHBOARD_METRICS = {
  realtime: [
    'active_users',
    'requests_per_second',
    'error_rate',
    'p95_latency',
    'task_queue_length',
  ],

  daily: [
    'total_tasks_executed',
    'total_spend',
    'new_users',
    'integration_syncs',
    'failed_tasks',
  ],

  weekly: [
    'new_organizations',
    'churn_rate',
    'feature_usage',
    'model_distribution',
    'integration_usage',
  ],

  monthly: [
    'mrr', // Monthly Recurring Revenue
    'arpu', // Average Revenue Per User
    'cost_per_task',
    'profit_margin',
    'ltv', // Lifetime Value
  ],
};

/**
 * Health Check Endpoints
 */
export const HEALTH_CHECKS = {
  '/api/health': {
    description: 'Basic health check',
    interval: 30, // seconds
    timeout: 5,
  },

  '/api/trpc/health': {
    description: 'API health check',
    interval: 60,
    timeout: 5,
  },

  'database': {
    description: 'Database connection health',
    interval: 60,
    timeout: 5,
  },

  'redis': {
    description: 'Redis connection health',
    interval: 60,
    timeout: 5,
  },

  'inngest': {
    description: 'Inngest webhook health',
    interval: 300,
    timeout: 10,
  },
};
