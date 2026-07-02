/**
 * Monitoring configuration and dashboard setup guide
 * Instructions for connecting monitoring services
 */

export const MONITORING_SERVICES = {
  sentry: {
    name: 'Sentry Error Tracking',
    url: 'https://sentry.io',
    setup: `
      1. Sign up at https://sentry.io
      2. Create a new project for Next.js
      3. Copy your DSN and add to environment:
         NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
      4. Set SENTRY_AUTH_TOKEN for source map uploads
      5. Sentry dashboard shows:
         - Error frequency and stack traces
         - Performance metrics
         - Release tracking
    `,
    envVars: ['NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_AUTH_TOKEN'],
    dashboardUrl: 'https://sentry.io/organizations/your-org/issues/',
    metrics: [
      'Error rate and frequency',
      'Performance (transaction duration)',
      'User impact analysis',
      'Release health',
      'Session replay',
    ],
  },

  posthog: {
    name: 'PostHog Product Analytics',
    url: 'https://posthog.com',
    setup: `
      1. Sign up at https://posthog.com
      2. Create a project
      3. Get your API key and add to environment:
         NEXT_PUBLIC_POSTHOG_KEY=phc_...
      4. Install PostHog npm package:
         npm install posthog-js next-use-posthog
      5. Track key events:
         - User signup/login
         - Agent creation
         - Subscription upgrades
         - Task execution
      6. Monitor:
         - Feature adoption
         - User funnels
         - Retention and churn
         - Cohort analysis
    `,
    envVars: ['NEXT_PUBLIC_POSTHOG_KEY'],
    dashboardUrl: 'https://app.posthog.com/insights',
    metrics: [
      'User engagement',
      'Feature adoption',
      'Conversion funnels',
      'Retention curves',
      'Cohort analysis',
      'Revenue metrics',
    ],
  },

  stripe: {
    name: 'Stripe Payments & Analytics',
    url: 'https://stripe.com',
    setup: `
      1. Create account at https://stripe.com
      2. Add payment products for each tier:
         - RECRUIT: $97/month
         - OPERATOR: $497/month
         - EMPIRE: $2,497/month
      3. Configure webhook endpoint:
         POST /api/webhooks/stripe
      4. Add API keys to environment:
         STRIPE_SECRET_KEY=sk_live_...
         STRIPE_WEBHOOK_SECRET=whsec_...
         NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
      5. Monitor in Stripe dashboard:
         - Subscription metrics
         - Revenue trends
         - Churn analysis
         - Failed payments
    `,
    envVars: [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    ],
    dashboardUrl: 'https://dashboard.stripe.com',
    metrics: [
      'Monthly Recurring Revenue (MRR)',
      'Customer Lifetime Value (LTV)',
      'Churn rate',
      'ARPU (Average Revenue Per User)',
      'Failed payments',
      'Subscription growth',
    ],
  },

  inngest: {
    name: 'Inngest Job Queue & Monitoring',
    url: 'https://inngest.com',
    setup: `
      1. Create account at https://inngest.com
      2. Get API keys:
         INNGEST_API_KEY=...
         INNGEST_EVENT_KEY=...
      3. Dashboard shows:
         - Function execution timeline
         - Success/failure rates
         - Retry history
         - Performance metrics
      4. Monitor:
         - Agent task execution
         - Job processing latency
         - Error patterns
         - Queue depth
    `,
    envVars: ['INNGEST_API_KEY', 'INNGEST_EVENT_KEY'],
    dashboardUrl: 'https://app.inngest.com',
    metrics: [
      'Function execution rate',
      'Success rate',
      'Avg execution duration',
      'Retry count and patterns',
      'Error frequency',
    ],
  },

  vercel: {
    name: 'Vercel Analytics & Deployment',
    url: 'https://vercel.com',
    setup: `
      1. Deploy to Vercel:
         npm install -g vercel
         vercel deploy
      2. Configure environment variables in Vercel dashboard
      3. Enable analytics:
         - Web Vitals
         - Real User Monitoring (RUM)
         - Performance insights
      4. Monitor:
         - Deployment status
         - Build performance
         - Runtime metrics
         - Edge function performance
    `,
    envVars: [],
    dashboardUrl: 'https://vercel.com/dashboard',
    metrics: [
      'Web Vitals (LCP, FID, CLS)',
      'Build performance',
      'Edge function latency',
      'CDN cache hit rate',
      'Request volume and latency',
    ],
  },

  database: {
    name: 'Neon Database Monitoring',
    url: 'https://neon.tech',
    setup: `
      1. Create project at https://neon.tech
      2. Get connection string:
         DATABASE_URL=postgresql://...
      3. Enable monitoring in Neon console:
         - Slow query logs
         - Connection tracking
         - Backup status
      4. Monitor:
         - Query performance
         - Connection pool status
         - Replica lag
         - Backup health
    `,
    envVars: ['DATABASE_URL'],
    dashboardUrl: 'https://console.neon.tech',
    metrics: [
      'Query latency',
      'Connection count',
      'Storage usage',
      'Backup status',
      'Replica lag',
    ],
  },

  uptime: {
    name: 'Uptime Monitoring',
    url: 'https://uptimerobot.com or https://healthchecks.io',
    setup: `
      1. Choose uptime monitor (UptimeRobot or Healthchecks.io)
      2. Add monitor for:
         - https://your-domain.com/api/health
         - Interval: 5 minutes
         - Alert on failure
      3. Configure alerts:
         - Email notifications
         - Slack integration
         - PagerDuty for on-call
      4. Track SLA compliance (99.9%+)
    `,
    envVars: [],
    dashboardUrl: 'https://uptimerobot.com or https://healthchecks.io',
    metrics: [
      'Uptime percentage',
      'Response time',
      'MTTR (Mean Time To Recovery)',
      'Incident history',
    ],
  },
};

/**
 * Key metrics to track for SaaS success
 */
export const KEY_METRICS = {
  // Financial
  MRR: 'Monthly Recurring Revenue',
  ARR: 'Annual Recurring Revenue',
  ARPU: 'Average Revenue Per User',
  LTV: 'Customer Lifetime Value',
  CAC: 'Customer Acquisition Cost',
  LTV_CAC_Ratio: 'LTV/CAC (should be 3:1+)',

  // Growth
  CustomerCount: 'Total active customers',
  NewCustomers: 'New customers per month',
  ChurnRate: 'Percentage of customers leaving',
  GrowthRate: 'Month-over-month growth %',
  ConversionRate: 'Signup to paid conversion %',

  // Product
  DailyActiveUsers: 'Users active per day',
  MonthlyActiveUsers: 'Users active per month',
  FeatureAdoption: 'Adoption rate of new features',
  UserEngagement: 'Tasks executed per user per month',

  // Operations
  SystemUptime: 'API uptime percentage (target: 99.9%)',
  APILatency: 'P95 API response time (target: <200ms)',
  ErrorRate: 'Application error percentage (target: <0.1%)',
  SupportResponseTime: 'Time to first response on support tickets',

  // Agent Performance
  TaskSuccessRate: 'Percentage of successful task executions',
  AverageTaskDuration: 'Avg time to complete a task',
  ToolUsageRate: 'Most commonly used tools',
  ModelPerformance: 'Accuracy/quality by model',
};

/**
 * Recommended alert thresholds
 */
export const ALERT_THRESHOLDS = {
  ErrorRate: {
    warning: 0.5, // 0.5% error rate
    critical: 2.0, // 2% error rate
  },
  APILatency: {
    warning: 500, // ms
    critical: 1000, // ms
  },
  DatabaseLatency: {
    warning: 100, // ms
    critical: 500, // ms
  },
  UpstashLatency: {
    warning: 50, // ms
    critical: 200, // ms
  },
  Uptime: {
    warning: 99.5, // %
    critical: 99.0, // %
  },
  FailedPayments: {
    warning: 5, // % of transactions
    critical: 10, // %
  },
};

/**
 * Dashboard setup checklist
 */
export const SETUP_CHECKLIST = [
  '[ ] Sentry account created and DSN configured',
  '[ ] PostHog account created and tracking enabled',
  '[ ] Stripe account set up with 3 price tiers',
  '[ ] Stripe webhooks pointing to /api/webhooks/stripe',
  '[ ] Inngest account created and linked',
  '[ ] Vercel deployment configured',
  '[ ] Neon database monitoring enabled',
  '[ ] Uptime monitoring configured',
  '[ ] Slack integration for alerts',
  '[ ] PagerDuty (or on-call system) configured',
  '[ ] Logs aggregation set up (Sentry)',
  '[ ] Custom dashboards created for:',
  '    [ ] MRR and growth metrics',
  '    [ ] Agent execution performance',
  '    [ ] API health and latency',
  '    [ ] User engagement metrics',
];
