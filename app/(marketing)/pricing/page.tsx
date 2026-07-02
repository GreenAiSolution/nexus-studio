import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Check, Sparkles, Crown } from 'lucide-react';

interface Tier {
  id: string;
  name: string;
  price: number;
  tagline: string;
  description: string;
  agents: string;
  features: string[];
  cta: string;
  href: string;
  accent: 'primary' | 'secondary' | 'gold' | 'accent';
  badge?: { label: string; icon: 'sparkles' | 'crown' };
}

const tiers: Tier[] = [
  {
    id: 'RECRUIT',
    name: 'Recruit',
    price: 97,
    tagline: 'Your first hire',
    description: 'For solo founders and small teams testing the autonomous waters.',
    agents: '1 AI Agent',
    features: [
      '1 AI Agent',
      '3 Tool Connectors',
      '2 AI Models',
      '500 Monthly Runs',
      'Email Support',
      'Basic Analytics',
    ],
    cta: 'Start with Recruit',
    href: '/sign-up',
    accent: 'primary',
  },
  {
    id: 'OPERATOR',
    name: 'Operator',
    price: 497,
    tagline: 'For growing teams',
    description: 'A small department of agents handling sales, support, and ops in parallel.',
    agents: '5 AI Agents',
    features: [
      '5 AI Agents',
      '10 Tool Connectors',
      '5 AI Models',
      '5,000 Monthly Runs',
      'Priority Support',
      'Advanced Analytics',
      'Custom Workflows',
      'API Access',
    ],
    cta: 'Start with Operator',
    href: '/sign-up',
    accent: 'secondary',
  },
  {
    id: 'COMMANDER',
    name: 'Commander',
    price: 997,
    tagline: 'Department-scale ops',
    description: 'Run an entire function autonomously. The sweet spot for most companies.',
    agents: '15 AI Agents',
    features: [
      '15 AI Agents',
      '25 Tool Connectors',
      '10 AI Models',
      '25,000 Monthly Runs',
      '24/7 Priority Support',
      'Advanced Analytics + Forecasting',
      'Agent-to-Agent Orchestration',
      'Webhook Workflows',
      'SOC 2 Audit Logs',
    ],
    cta: 'Start with Commander',
    href: '/sign-up',
    accent: 'primary',
    badge: { label: 'Most Loved', icon: 'sparkles' },
  },
  {
    id: 'EMPIRE',
    name: 'Empire',
    price: 2497,
    tagline: 'Enterprise automation',
    description: 'Multi-team, multi-region. White-label, SLAs, dedicated infrastructure.',
    agents: '50 AI Agents',
    features: [
      '50 AI Agents',
      'All Tool Connectors',
      'All AI Models',
      '150,000 Monthly Runs',
      'Dedicated Account Manager',
      'White-Label Option',
      'Custom Integrations',
      '99.99% SLA Guarantee',
      'Priority Compute',
      'Single Sign-On',
    ],
    cta: 'Start with Empire',
    href: '/sign-up',
    accent: 'gold',
  },
  {
    id: 'SOVEREIGN',
    name: 'Sovereign',
    price: 7497,
    tagline: 'No limits. Period.',
    description: 'Run an autonomous workforce at planetary scale with no ceiling.',
    agents: 'Unlimited Agents',
    features: [
      'Unlimited AI Agents',
      'All Tool Connectors',
      'All AI Models',
      'Unlimited Monthly Runs',
      'Dedicated Solutions Architect',
      'Custom Model Fine-Tuning',
      'On-Premise Deployment Option',
      '99.99% SLA + Carrier-Grade Failover',
      'Quarterly Strategy Sessions',
      'Early Access to New Capabilities',
    ],
    cta: 'Talk to sales',
    href: '/sign-up',
    accent: 'accent',
    badge: { label: 'Apex Tier', icon: 'crown' },
  },
];

const accentMap = {
  primary: { ring: 'border-primary/40', glow: 'from-primary/40', text: 'text-primary' },
  secondary: { ring: 'border-secondary/40', glow: 'from-secondary/40', text: 'text-secondary' },
  gold: { ring: 'border-gold/40', glow: 'from-gold/40', text: 'text-gold' },
  accent: { ring: 'border-accent/40', glow: 'from-accent/40', text: 'text-accent' },
} as const;

export default function PricingPage() {
  return (
    <div className="relative space-y-24 py-24">
      {/* Hero */}
      <section className="container mx-auto px-6 text-center space-y-6 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
          <span className="text-xs uppercase tracking-[0.3em] text-text-secondary">
            Five tiers. One workforce.
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight">
          Scale your <span className="bg-gradient-to-r from-primary via-secondary to-gold bg-clip-text text-transparent">workforce</span>.
        </h1>
        <p className="text-lg text-text-secondary">
          From your first agent to an autonomous fleet. Upgrade the moment you outgrow the last tier.
        </p>
      </section>

      {/* Tier grid */}
      <section className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
          {tiers.map((tier) => {
            const a = accentMap[tier.accent];
            const featured = tier.badge?.label === 'Most Loved';
            const apex = tier.badge?.label === 'Apex Tier';
            return (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border ${a.ring} bg-white/[0.03] backdrop-blur-md p-6 overflow-hidden ${
                  featured ? 'lg:-translate-y-4 lg:scale-[1.03]' : ''
                } ${apex ? 'lg:-translate-y-2' : ''}`}
              >
                <div
                  className={`absolute -inset-1 rounded-3xl bg-gradient-to-b ${a.glow} to-transparent opacity-20 blur-2xl -z-10`}
                />

                {tier.badge && (
                  <div
                    className={`absolute top-4 right-4 inline-flex items-center gap-1 rounded-full ${a.text} border ${a.ring} bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em]`}
                  >
                    {tier.badge.icon === 'sparkles' ? (
                      <Sparkles className="w-3 h-3" />
                    ) : (
                      <Crown className="w-3 h-3" />
                    )}
                    {tier.badge.label}
                  </div>
                )}

                <div className="text-xs uppercase tracking-[0.3em] text-text-tertiary">{tier.id}</div>
                <div className="mt-2 text-2xl font-semibold">{tier.name}</div>
                <div className="mt-1 text-sm text-text-secondary">{tier.tagline}</div>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tabular-nums">
                    ${tier.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-text-tertiary">/mo</span>
                </div>

                <p className="mt-4 text-xs text-text-secondary leading-relaxed min-h-[3rem]">
                  {tier.description}
                </p>

                <Link href={tier.href} className="mt-6 w-full">
                  <Button
                    variant={featured || apex ? 'default' : 'outline'}
                    className="w-full"
                    size="lg"
                  >
                    {tier.cta}
                  </Button>
                </Link>

                <div className="mt-6 pt-6 border-t border-white/5 space-y-2.5 flex-1">
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${a.text}`} />
                      <span className="text-text-secondary leading-snug">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Annual savings */}
      <section className="container mx-auto px-6 max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold">── Annual</div>
            <h3 className="mt-2 text-2xl font-semibold">Pay annually, save two months.</h3>
            <p className="mt-1 text-text-secondary">
              Commit to a year and we take 2 months off the top, across every tier.
            </p>
          </div>
          <Link href="/sign-up">
            <Button size="lg">Switch to annual</Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-6 max-w-3xl space-y-8">
        <div className="text-center space-y-3">
          <div className="text-xs uppercase tracking-[0.3em] text-text-tertiary">── FAQ</div>
          <h2 className="text-3xl font-semibold">Common questions</h2>
        </div>

        <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden">
          {[
            {
              q: 'Can I change tiers anytime?',
              a: 'Yes. Upgrades take effect immediately and are prorated. Downgrades take effect on the next billing cycle.',
            },
            {
              q: 'Is there a free trial?',
              a: 'Every plan includes a 14-day free trial. No credit card required to start on Recruit.',
            },
            {
              q: 'What counts as a "run"?',
              a: 'A run is a single complete agent task — from trigger to result. Tool calls, model invocations, and memory reads inside a single run are all included.',
            },
            {
              q: 'Do you support custom enterprise contracts?',
              a: 'Yes. Sovereign customers get bespoke contracts, on-premise deployments, custom model fine-tuning, and a dedicated solutions architect.',
            },
            {
              q: 'How does billing work for unlimited agents?',
              a: 'Sovereign has no hard cap on agents or runs. Fair-use applies — our team will reach out before anything affects your service.',
            },
          ].map((faq) => (
            <details key={faq.q} className="group p-6 cursor-pointer">
              <summary className="flex items-center justify-between gap-4 list-none">
                <span className="font-medium text-text-primary">{faq.q}</span>
                <span className="text-text-tertiary text-xl group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
