// ─── PIXEL PILOT · n8n WORKFLOWS ─────────────────────────────────────────────
// The automation spine. Each entry is a real n8n workflow graph (nodes +
// connections in n8n's export shape) that can be imported straight into an n8n
// instance, plus a webhook path Pixel Pilot triggers at runtime. These are the
// looping brains behind the services — the parts that run while nobody watches.
//
// Trigger flow: the app POSTs to `/api/pixel-pilot/workflows/[id]` which forwards
// to `${N8N_BASE_URL}${webhookPath}`. With no N8N_BASE_URL set the route returns
// a dry-run receipt so the demo still works end to end.

export interface N8nNode {
  readonly name: string;
  readonly type: string;
  readonly notes: string;
}

export interface Workflow {
  readonly id: string;
  readonly name: string;
  readonly serviceId: string; // ties back to services.ts
  readonly summary: string;
  readonly trigger: 'webhook' | 'schedule' | 'event';
  readonly cadence: string;
  readonly webhookPath: string;
  readonly nodes: N8nNode[];
  /** n8n connection map: node name → downstream node names. */
  readonly connections: Record<string, string[]>;
}

export const WORKFLOWS: Workflow[] = [
  {
    id: 'budget-reallocation',
    name: 'Autonomous Budget Reallocation',
    serviceId: 'cross-channel',
    summary:
      'Every 15 minutes, pull spend + profit across all channels, rank by marginal return, and shift budget to the leaders.',
    trigger: 'schedule',
    cadence: 'Every 15 min',
    webhookPath: '/webhook/pp-budget-reallocation',
    nodes: [
      { name: 'Every 15m', type: 'n8n-nodes-base.scheduleTrigger', notes: 'Cron cadence' },
      { name: 'Pull Meta Ads', type: 'n8n-nodes-base.httpRequest', notes: 'Insights API' },
      { name: 'Pull Google Ads', type: 'n8n-nodes-base.httpRequest', notes: 'GAQL report' },
      { name: 'Pull TikTok Ads', type: 'n8n-nodes-base.httpRequest', notes: 'Reporting API' },
      { name: 'Join + Shopify Profit', type: 'n8n-nodes-base.merge', notes: 'Attach real margin' },
      { name: 'Marginal ROAS Model', type: 'n8n-nodes-base.code', notes: 'Rank next-dollar value' },
      { name: 'Approval Gate', type: 'n8n-nodes-base.if', notes: 'Auto below threshold' },
      { name: 'Apply Budgets', type: 'n8n-nodes-base.httpRequest', notes: 'PATCH each platform' },
      { name: 'Log to Slack', type: 'n8n-nodes-base.slack', notes: 'Post the moves made' },
    ],
    connections: {
      'Every 15m': ['Pull Meta Ads', 'Pull Google Ads', 'Pull TikTok Ads'],
      'Pull Meta Ads': ['Join + Shopify Profit'],
      'Pull Google Ads': ['Join + Shopify Profit'],
      'Pull TikTok Ads': ['Join + Shopify Profit'],
      'Join + Shopify Profit': ['Marginal ROAS Model'],
      'Marginal ROAS Model': ['Approval Gate'],
      'Approval Gate': ['Apply Budgets'],
      'Apply Budgets': ['Log to Slack'],
    },
  },
  {
    id: 'creative-refresh',
    name: 'Creative Genome Refresh',
    serviceId: 'creative-genome',
    summary:
      'When an ad shows fatigue, recombine winning genes, render fresh variants via Higgsfield, and ship them to the ad set.',
    trigger: 'event',
    cadence: 'On fatigue signal',
    webhookPath: '/webhook/pp-creative-refresh',
    nodes: [
      { name: 'Fatigue Detected', type: 'n8n-nodes-base.webhook', notes: 'Frequency / CTR decay' },
      { name: 'Query Genome', type: 'n8n-nodes-base.httpRequest', notes: 'Top-performing genes' },
      { name: 'Compose Brief', type: 'n8n-nodes-base.code', notes: 'Recombine hook + arc' },
      { name: 'Higgsfield Render', type: 'n8n-nodes-base.httpRequest', notes: 'Generate reels' },
      { name: 'Wait for Render', type: 'n8n-nodes-base.wait', notes: 'Poll job status' },
      { name: 'Publish Variants', type: 'n8n-nodes-base.httpRequest', notes: 'Upload to ad set' },
    ],
    connections: {
      'Fatigue Detected': ['Query Genome'],
      'Query Genome': ['Compose Brief'],
      'Compose Brief': ['Higgsfield Render'],
      'Higgsfield Render': ['Wait for Render'],
      'Wait for Render': ['Publish Variants'],
    },
  },
  {
    id: 'compliance-guard',
    name: 'Compliance Guardrail',
    serviceId: 'compliance-autopilot',
    summary:
      'Screen every asset against the platform policy model before it goes live — block, rewrite, or approve.',
    trigger: 'event',
    cadence: 'Pre-flight, every asset',
    webhookPath: '/webhook/pp-compliance-guard',
    nodes: [
      { name: 'Asset Submitted', type: 'n8n-nodes-base.webhook', notes: 'New creative queued' },
      { name: 'Policy Model', type: 'n8n-nodes-base.httpRequest', notes: 'Score against rules' },
      { name: 'Risk Branch', type: 'n8n-nodes-base.switch', notes: 'clear / rewrite / block' },
      { name: 'Auto-Rewrite', type: 'n8n-nodes-base.httpRequest', notes: 'Safe copy variant' },
      { name: 'Approve to Queue', type: 'n8n-nodes-base.httpRequest', notes: 'Release for launch' },
      { name: 'Flag for Human', type: 'n8n-nodes-base.slack', notes: 'Escalate hard cases' },
    ],
    connections: {
      'Asset Submitted': ['Policy Model'],
      'Policy Model': ['Risk Branch'],
      'Risk Branch': ['Auto-Rewrite', 'Approve to Queue', 'Flag for Human'],
      'Auto-Rewrite': ['Policy Model'],
    },
  },
  {
    id: 'zero-to-live',
    name: 'Zero-to-Live Launch',
    serviceId: 'zero-to-live',
    summary:
      'From a single product URL: research, personas, strategy, creative, tracking, and a live campaign — hands-off.',
    trigger: 'webhook',
    cadence: 'On new client URL',
    webhookPath: '/webhook/pp-zero-to-live',
    nodes: [
      { name: 'Product URL In', type: 'n8n-nodes-base.webhook', notes: 'Kickoff' },
      { name: 'Scrape + Research', type: 'n8n-nodes-base.httpRequest', notes: 'Market + competitors' },
      { name: 'Build Personas', type: 'n8n-nodes-base.code', notes: 'Synthetic audiences' },
      { name: 'Draft Strategy', type: 'n8n-nodes-base.httpRequest', notes: 'Channel + budget plan' },
      { name: 'Higgsfield Creative', type: 'n8n-nodes-base.httpRequest', notes: 'First ad batch' },
      { name: 'Wire Tracking', type: 'n8n-nodes-base.httpRequest', notes: 'Pixels + CAPI' },
      { name: 'Launch Campaign', type: 'n8n-nodes-base.httpRequest', notes: 'Go live' },
      { name: 'Notify Client', type: 'n8n-nodes-base.slack', notes: 'It is flying' },
    ],
    connections: {
      'Product URL In': ['Scrape + Research'],
      'Scrape + Research': ['Build Personas'],
      'Build Personas': ['Draft Strategy'],
      'Draft Strategy': ['Higgsfield Creative'],
      'Higgsfield Creative': ['Wire Tracking'],
      'Wire Tracking': ['Launch Campaign'],
      'Launch Campaign': ['Notify Client'],
    },
  },
];

export function getWorkflow(id: string): Workflow | undefined {
  return WORKFLOWS.find((w) => w.id === id);
}
