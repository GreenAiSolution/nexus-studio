/**
 * Environment configuration validator
 * Fails fast if critical variables are missing or malformed
 */

const REQUIRED_VARS = [
  // Database
  'DATABASE_URL',
  // Clerk
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  // Encryption
  'ENCRYPTION_KEY',
  // Stripe
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  // Inngest
  'INNGEST_API_KEY',
  'INNGEST_EVENT_KEY',
  // App URL
  'NEXT_PUBLIC_APP_URL',
];

const OPTIONAL_VARS = [
  // AI Models
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GOOGLE_API_KEY',
  // OAuth Providers
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SLACK_CLIENT_ID',
  'SLACK_CLIENT_SECRET',
  'SALESFORCE_CLIENT_ID',
  'SALESFORCE_CLIENT_SECRET',
  'HUBSPOT_CLIENT_ID',
  'HUBSPOT_CLIENT_SECRET',
  // Monitoring
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  // Cache
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'QSTASH_TOKEN',
];

interface ConfigValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateConfig(): ConfigValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check optional variables
  for (const varName of OPTIONAL_VARS) {
    if (!process.env[varName]) {
      warnings.push(`${varName} not set (optional)`);
    }
  }

  // Validate ENCRYPTION_KEY format
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey && encryptionKey.length !== 64) {
    missing.push('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    missing.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  // Validate APP_URL format
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      new URL(appUrl);
    } catch {
      missing.push('NEXT_PUBLIC_APP_URL must be a valid URL');
    }
  }

  const valid = missing.length === 0;

  if (!valid && process.env.NODE_ENV === 'production') {
    console.error('❌ Critical environment variables missing:');
    missing.forEach((v) => console.error(`  - ${v}`));
    process.exit(1);
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Optional environment variables not configured:');
    warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  return { valid, missing, warnings };
}

// Validate on module load in production
if (process.env.NODE_ENV === 'production') {
  validateConfig();
}

export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value || defaultValue!;
}
