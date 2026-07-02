/**
 * Salesforce API client for NEXUS AI
 * Handles authentication, contact sync, and data transformation
 */

export interface SalesforceContact {
  Id: string;
  Email: string;
  Name: string;
  Phone?: string;
  Title?: string;
  Company?: string;
  LeadSource?: string;
}

export interface SalesforceSyncResult {
  ok: boolean;
  contactsSynced?: number;
  error?: string;
  rateLimitRemaining?: number;
  rateLimitReset?: string;
}

/**
 * Exchange OAuth code for Salesforce access token
 */
export async function exchangeSalesforceCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{
  ok: boolean;
  accessToken?: string;
  refreshToken?: string;
  instanceUrl?: string;
  expiresIn?: number;
  error?: string;
}> {
  const tokenUrl = 'https://login.salesforce.com/services/oauth2/token';

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Salesforce OAuth failed: ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      ok: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      instanceUrl: data.instance_url,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: errorMessage,
    };
  }
}

/**
 * Refresh Salesforce access token
 */
export async function refreshSalesforceToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{
  ok: boolean;
  accessToken?: string;
  expiresIn?: number;
  error?: string;
}> {
  const tokenUrl = 'https://login.salesforce.com/services/oauth2/token';

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Salesforce token refresh failed: ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      ok: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: errorMessage,
    };
  }
}

/**
 * Fetch contacts from Salesforce using SOQL
 */
export async function fetchSalesforceContacts(
  accessToken: string,
  instanceUrl: string,
  limit: number = 100,
  offset: number = 0
): Promise<{
  ok: boolean;
  contacts?: SalesforceContact[];
  totalSize?: number;
  hasMore?: boolean;
  rateLimitRemaining?: number;
  error?: string;
}> {
  const soql = `SELECT Id, Email, Name, Phone, Title, Company, LeadSource FROM Contact LIMIT ${limit} OFFSET ${offset}`;
  const url = `${instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const rateLimitRemaining = response.headers.get('sforce-limit-info');

    // Handle 401 Unauthorized (token expired)
    if (response.status === 401) {
      return {
        ok: false,
        error: 'token_expired',
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: `Salesforce query failed: ${response.statusText}`,
        rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining.split('/')[0]) : undefined,
      };
    }

    const data = await response.json();

    return {
      ok: true,
      contacts: data.records,
      totalSize: data.totalSize,
      hasMore: !data.done,
      rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining.split('/')[0]) : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: errorMessage,
    };
  }
}

/**
 * Create an activity record on a Salesforce contact
 */
export async function createSalesforceActivity(
  accessToken: string,
  instanceUrl: string,
  contactId: string,
  subject: string,
  description: string
): Promise<{
  ok: boolean;
  activityId?: string;
  error?: string;
}> {
  const url = `${instanceUrl}/services/data/v59.0/sobjects/Task`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        WhoId: contactId,
        Subject: subject,
        Description: description,
        ActivityDate: new Date().toISOString().split('T')[0],
      }),
    });

    if (response.status === 401) {
      return {
        ok: false,
        error: 'token_expired',
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: `Failed to create Salesforce activity: ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      ok: true,
      activityId: data.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: errorMessage,
    };
  }
}

/**
 * Parse Salesforce rate limit info header
 * Format: "50000/50000"
 */
export function parseSalesforceRateLimit(rateLimitHeader: string | null): { remaining: number; total: number } | null {
  if (!rateLimitHeader) return null;
  const [remaining, total] = rateLimitHeader.split('/').map(Number);
  return { remaining, total };
}
