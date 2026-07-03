// ─── PIXEL PILOT · PRICING ───────────────────────────────────────────────────
// This is not a cheap tool — it is a media-buying department that never sleeps.
// Premium, retainer + performance. Priced against the media buyer you would hire,
// not the SaaS you would cancel.

export interface Tier {
  readonly id: string;
  readonly name: string;
  readonly price: number; // monthly retainer, USD
  readonly performance: string; // performance component
  readonly tagline: string;
  readonly forWho: string;
  readonly adSpend: string;
  readonly includes: string[];
  readonly accent: string;
  readonly border: string;
  readonly featured?: boolean;
  readonly apex?: boolean;
}

export const TIERS: Tier[] = [
  {
    id: 'PILOT',
    name: 'Pilot',
    price: 2500,
    performance: '+ 8% of ad spend',
    tagline: 'One channel, fully flown',
    forWho: 'Brands scaling their first paid channel',
    adSpend: 'Up to $50k/mo managed',
    includes: [
      'Autonomous buyer on 1 channel',
      'Creative Forge + Genome Lab',
      'Profit-based optimization',
      'Slack war room',
    ],
    accent: 'from-secondary/60 to-secondary/0',
    border: 'border-secondary/30',
  },
  {
    id: 'SQUADRON',
    name: 'Squadron',
    price: 6000,
    performance: '+ 6% of ad spend',
    tagline: 'The full media mix, conducted',
    forWho: 'Growth brands across Meta, Google & TikTok',
    adSpend: 'Up to $250k/mo managed',
    includes: [
      'Cross-Channel Conductor',
      'Synthetic Arena pre-testing',
      'Attribution Truth Engine',
      'All n8n automations',
      'Impression-level creative',
    ],
    accent: 'from-primary/70 to-secondary/30',
    border: 'border-primary/40',
    featured: true,
  },
  {
    id: 'FLEET',
    name: 'Fleet Command',
    price: 15000,
    performance: '+ 4% of ad spend',
    tagline: 'No ceiling. Your own air force.',
    forWho: 'Category leaders & regulated scale',
    adSpend: 'Unlimited spend managed',
    includes: [
      'Everything in Squadron',
      'Compliance-Safe Autopilot',
      'Private data flywheel + model',
      'Dedicated flight director',
      'White-label for agencies',
    ],
    accent: 'from-gold/70 to-accent/30',
    border: 'border-gold/40',
    apex: true,
  },
];
