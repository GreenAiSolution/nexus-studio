// ─── PIXEL PILOT · CONNECTORS ────────────────────────────────────────────────
// The four ad/data platforms Pixel Pilot flies. Each connector is a fully-typed
// OAuth definition wired to its real authorization + token endpoints, so the
// `/api/pixel-pilot/connectors/[provider]` route can mint a live consent URL the
// moment credentials land in the environment. Until then the registry still
// renders the marketing surface — connectors degrade gracefully, never crash.
//
// Wiring note: secrets are read from env by name (never inlined). A connector is
// "live" only when both its client id + secret are present; otherwise the UI
// shows it as "available" and the OAuth route returns a 503 with a clear reason.

export type ConnectorId = 'meta_ads' | 'google_ads' | 'tiktok_ads' | 'shopify';

export interface ConnectorScope {
  readonly value: string;
  readonly reason: string;
}

export interface Connector {
  readonly id: ConnectorId;
  readonly name: string;
  readonly category: 'Paid Social' | 'Paid Search' | 'Commerce';
  readonly tagline: string;
  /** Brand color used for the 3D chip + UI accents. */
  readonly hue: string;
  /** What Pixel Pilot actually does once this pipe is open. */
  readonly powers: string[];
  readonly auth: {
    readonly authUrl: string;
    readonly tokenUrl: string;
    /** Env var names — resolved at request time, never bundled. */
    readonly clientIdEnv: string;
    readonly clientSecretEnv: string;
    readonly scopes: ConnectorScope[];
    /** Shopify authorizes per-shop, so its host is templated. */
    readonly perShop?: boolean;
  };
}

export const CONNECTORS: Record<ConnectorId, Connector> = {
  meta_ads: {
    id: 'meta_ads',
    name: 'Meta Ads',
    category: 'Paid Social',
    tagline: 'Facebook + Instagram · the demand engine',
    hue: '#1877F2',
    powers: [
      'Read spend, ROAS and delivery in real time',
      'Push budget, bid and audience changes autonomously',
      'Publish Genome-built creative straight to ad sets',
    ],
    auth: {
      authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
      clientIdEnv: 'META_ADS_CLIENT_ID',
      clientSecretEnv: 'META_ADS_CLIENT_SECRET',
      scopes: [
        { value: 'ads_read', reason: 'Pull performance + spend' },
        { value: 'ads_management', reason: 'Reallocate budget and bids' },
        { value: 'business_management', reason: 'Operate across ad accounts' },
      ],
    },
  },
  google_ads: {
    id: 'google_ads',
    name: 'Google Ads',
    category: 'Paid Search',
    tagline: 'Search · Shopping · PMax · YouTube',
    hue: '#34A853',
    powers: [
      'Ingest conversions and Performance Max signals',
      'Steer tCPA / tROAS targets against real profit',
      'Fold search intent into the cross-channel conductor',
    ],
    auth: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientIdEnv: 'GOOGLE_ADS_CLIENT_ID',
      clientSecretEnv: 'GOOGLE_ADS_CLIENT_SECRET',
      scopes: [
        { value: 'https://www.googleapis.com/auth/adwords', reason: 'Manage campaigns + budgets' },
      ],
    },
  },
  tiktok_ads: {
    id: 'tiktok_ads',
    name: 'TikTok Ads',
    category: 'Paid Social',
    tagline: 'The velocity channel · UGC at scale',
    hue: '#FF0050',
    powers: [
      'Detect creative fatigue hour by hour',
      'Auto-ship Higgsfield reels as fresh variants',
      'Scale winners before the trend cools',
    ],
    auth: {
      authUrl: 'https://business-api.tiktok.com/portal/auth',
      tokenUrl: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
      clientIdEnv: 'TIKTOK_ADS_CLIENT_ID',
      clientSecretEnv: 'TIKTOK_ADS_CLIENT_SECRET',
      scopes: [
        { value: 'advertiser.read', reason: 'Read advertiser + reporting data' },
        { value: 'campaign.write', reason: 'Publish and optimize campaigns' },
      ],
    },
  },
  shopify: {
    id: 'shopify',
    name: 'Shopify',
    category: 'Commerce',
    tagline: 'The truth source · real margin & LTV',
    hue: '#95BF47',
    powers: [
      'Stream orders, COGS, returns and LTV',
      'Feed real profit into every bid decision',
      'Route spend to in-stock, high-margin SKUs',
    ],
    auth: {
      authUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
      tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
      clientIdEnv: 'SHOPIFY_CLIENT_ID',
      clientSecretEnv: 'SHOPIFY_CLIENT_SECRET',
      perShop: true,
      scopes: [
        { value: 'read_orders', reason: 'Attribute revenue to spend' },
        { value: 'read_products', reason: 'Know margin + inventory' },
        { value: 'read_reports', reason: 'Reconcile true profit' },
      ],
    },
  },
};

export const CONNECTOR_LIST: Connector[] = Object.values(CONNECTORS);

export function isConnectorId(value: string): value is ConnectorId {
  return value in CONNECTORS;
}

/** A connector is live only when both halves of its credential pair exist. */
export function connectorIsLive(c: Connector): boolean {
  return Boolean(process.env[c.auth.clientIdEnv] && process.env[c.auth.clientSecretEnv]);
}

export interface BuildAuthUrlOptions {
  readonly state: string;
  readonly redirectUri: string;
  /** Required when connector.auth.perShop is true (e.g. Shopify). */
  readonly shop?: string;
}

/**
 * Build a live OAuth consent URL. Throws with an actionable message when the
 * connector is not configured — the API route turns that into a 503, so the
 * failure is legible instead of a silent broken redirect.
 */
export function buildAuthUrl(connector: Connector, opts: BuildAuthUrlOptions): string {
  const clientId = process.env[connector.auth.clientIdEnv];
  if (!clientId) {
    throw new Error(
      `${connector.name} is not configured — set ${connector.auth.clientIdEnv} / ${connector.auth.clientSecretEnv}`
    );
  }

  let authBase = connector.auth.authUrl;
  if (connector.auth.perShop) {
    if (!opts.shop) throw new Error(`${connector.name} requires a shop domain`);
    const shop = opts.shop.replace(/\.myshopify\.com$/i, '').replace(/[^a-z0-9-]/gi, '');
    authBase = authBase.replace('{shop}', shop);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: opts.redirectUri,
    response_type: 'code',
    state: opts.state,
    scope: connector.auth.scopes.map((s) => s.value).join(connector.id === 'meta_ads' ? ',' : ' '),
  });

  return `${authBase}?${params.toString()}`;
}
