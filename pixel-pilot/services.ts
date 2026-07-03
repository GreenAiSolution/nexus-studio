// ─── PIXEL PILOT · SERVICES ──────────────────────────────────────────────────
// The full flight deck. Ten services, all pointed at one niche: autonomous paid
// media buying. This is the single source of truth for the marketing surface,
// the 3D orbit, and the pricing matrix — edit here, it propagates everywhere.

export type ServiceCategory =
  | 'Autonomy'
  | 'Economics'
  | 'Orchestration'
  | 'Creative'
  | 'Intelligence'
  | 'Trust';

export interface Service {
  /** Stable slug — used as anchor + orbit key. */
  readonly id: string;
  /** Two-digit flight number shown in the UI. */
  readonly no: string;
  readonly name: string;
  readonly category: ServiceCategory;
  readonly headline: string;
  readonly body: string;
  /** The one-line proof that lands the "not basic" claim. */
  readonly edge: string;
  /** A believable hero metric for the card. */
  readonly metric: { value: string; label: string };
  /** Theme color for gradients/glow. */
  readonly accent: string;
}

export const SERVICES: Service[] = [
  {
    id: 'autonomous-buyer',
    no: '01',
    name: 'The Autonomous Media Buyer',
    category: 'Autonomy',
    headline: "You don't get a login. You get a media buyer.",
    body: 'Pixel Pilot lives in your Slack, works 24/7, and executes decisions in-platform — reallocating budget, killing losers, scaling winners — without waiting on a human to click.',
    edge: 'It owns the outcome, not a dashboard.',
    metric: { value: '24/7', label: 'On the account' },
    accent: '#6C63FF',
  },
  {
    id: 'profit-optimized',
    no: '02',
    name: 'Profit-Optimized, Not ROAS-Optimized',
    category: 'Economics',
    headline: 'It bids to your bank account.',
    body: 'Wired into Shopify for real COGS, returns and LTV, Pixel Pilot optimizes to actual profit per customer — the number the ad platforms will never show you because it is their revenue.',
    edge: 'Meta will never optimize against its own revenue. We do.',
    metric: { value: '+31%', label: 'Blended net margin' },
    accent: '#95BF47',
  },
  {
    id: 'cross-channel',
    no: '03',
    name: 'Cross-Channel Conductor',
    category: 'Orchestration',
    headline: 'One brain across Meta, Google & TikTok.',
    body: 'Most tools optimize inside a single channel. The Conductor treats your entire media mix as one portfolio and moves the next dollar to wherever its marginal return is highest — in real time.',
    edge: 'Portfolio-level allocation no single-platform tool can see.',
    metric: { value: '3+', label: 'Channels, one budget' },
    accent: '#00D4FF',
  },
  {
    id: 'creative-genome',
    no: '04',
    name: 'Creative Genome Engine',
    category: 'Creative',
    headline: 'Winning ads, decoded and recombined.',
    body: 'The Genome decomposes thousands of proven ads into structural genes — hook, pacing, emotional arc, framing — then predictively recombines them. The dataset compounds; a prompt cannot clone it.',
    edge: 'A proprietary creative dataset, not a random generator.',
    metric: { value: '10k+', label: 'Ad genes mapped' },
    accent: '#FF2E9A',
  },
  {
    id: 'synthetic-testing',
    no: '05',
    name: 'Synthetic Pre-Testing',
    category: 'Intelligence',
    headline: 'Test 500 ads before you spend $1.',
    body: 'Simulate performance against LLM personas modeled on your real customers. Kill the losers in silico and launch only predicted winners — stop paying the platforms to A/B test for you.',
    edge: 'Kill the dogs before they ever cost you a click.',
    metric: { value: '500', label: 'Ads tested in silico' },
    accent: '#C9A84C',
  },
  {
    id: 'data-flywheel',
    no: '06',
    name: 'Self-Improving Data Flywheel',
    category: 'Intelligence',
    headline: 'Every dollar makes it smarter.',
    body: 'Each spend trains a model private to your account. The longer Pixel Pilot flies, the sharper it gets and the more it compounds — a growing asset you own, and a moat that raises the cost of ever leaving.',
    edge: 'A compounding, account-specific model — not a static tool.',
    metric: { value: '∞', label: 'Compounding edge' },
    accent: '#8B7FFF',
  },
  {
    id: 'compliance-autopilot',
    no: '07',
    name: 'Compliance-Safe Autopilot',
    category: 'Trust',
    headline: 'Scale the niches that get accounts banned.',
    body: 'Supplements, med-spa, finance, crypto, cannabis — verticals where accounts get nuked weekly. Pixel Pilot writes and optimizes within policy guardrails and actively manages account health.',
    edge: 'Aggression inside the guardrails the big players avoid.',
    metric: { value: '0', label: 'Surprise bans' },
    accent: '#FF6B35',
  },
  {
    id: 'attribution-truth',
    no: '08',
    name: 'Attribution Truth Engine',
    category: 'Intelligence',
    headline: 'Finally know what actually drove the sale.',
    body: 'Blended media-mix modeling plus live incrementality testing cuts through the post-iOS fog, then feeds that truth straight back into the optimizer so it acts on reality, not platform-reported fiction.',
    edge: 'Measurement is the hardest moat — and the biggest unsolved pain.',
    metric: { value: '1st-party', label: 'Ground truth' },
    accent: '#00D4FF',
  },
  {
    id: 'zero-to-live',
    no: '09',
    name: 'Zero-to-Live in Under an Hour',
    category: 'Autonomy',
    headline: 'Point it at a URL. Walk away. Come back to live ads.',
    body: 'Pixel Pilot researches the market, builds personas, writes the strategy, generates the creative, wires the tracking, and launches — autonomously. Onboarding is the product.',
    edge: 'Market research to live campaign while you make coffee.',
    metric: { value: '<60min', label: 'URL → live' },
    accent: '#6C63FF',
  },
  {
    id: 'impression-creative',
    no: '10',
    name: 'Impression-Level Generative Creative',
    category: 'Creative',
    headline: 'A different ad for every single viewer.',
    body: 'Creative assembled per-impression from weather, time of day, browsing behavior and live inventory. True 1:1 personalization at the impression — not the audience — and defensible bleeding edge.',
    edge: '1:1 at the impression, not the segment.',
    metric: { value: '1:1', label: 'Per impression' },
    accent: '#FF2E9A',
  },
];

export function getService(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}
