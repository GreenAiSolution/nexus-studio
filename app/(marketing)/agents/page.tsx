import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Agent {
  name: string;
  role: string;
  description: string;
  tools: string[];
  model: string;
  accent: string;
}

const agents: Agent[] = [
  {
    name: 'Ember',
    role: 'Sales Development',
    description:
      'Prospects, qualifies, and routes leads while you sleep. Books meetings the moment intent is detected.',
    tools: ['Salesforce', 'Gmail', 'Slack', 'Perplexity', 'Calendar'],
    model: 'Claude Opus 4.7',
    accent: 'from-primary to-secondary',
  },
  {
    name: 'Aurora',
    role: 'Customer Support',
    description:
      'Resolves tickets, escalates intelligently, and updates documentation as it learns from every interaction.',
    tools: ['Slack', 'Zendesk', 'Intercom', 'Discord'],
    model: 'Claude Sonnet 4.6',
    accent: 'from-secondary to-gold',
  },
  {
    name: 'Vector',
    role: 'Operations',
    description:
      'Monitors metrics, files reports, and orchestrates other agents on schedule. The conductor of your fleet.',
    tools: ['Google Sheets', 'Stripe', 'Linear', 'Custom APIs'],
    model: 'GPT-4o',
    accent: 'from-gold to-accent',
  },
  {
    name: 'Glyph',
    role: 'Content & Brand',
    description:
      'Drafts, edits, and ships content across every channel — all on-brand, on-voice, on-schedule.',
    tools: ['Notion', 'Twitter API', 'LinkedIn', 'Webflow'],
    model: 'Claude Opus 4.7',
    accent: 'from-primary to-gold',
  },
  {
    name: 'Atlas',
    role: 'Research & Intel',
    description:
      'Deep web research, competitor monitoring, and signal extraction across every public surface.',
    tools: ['Perplexity', 'SerpAPI', 'Apify', 'Custom Crawlers'],
    model: 'GPT-4o + Claude',
    accent: 'from-secondary to-primary',
  },
  {
    name: 'Ledger',
    role: 'Finance Ops',
    description:
      'Categorizes transactions, reconciles statements, and flags anomalies before they become problems.',
    tools: ['Stripe', 'QuickBooks', 'Plaid', 'Mercury'],
    model: 'Claude Sonnet 4.6',
    accent: 'from-accent to-primary',
  },
];

export default function AgentsPage() {
  return (
    <div className="relative space-y-24 py-24">
      {/* Hero */}
      <section className="container mx-auto px-6 text-center space-y-6 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs uppercase tracking-[0.3em] text-text-secondary">
            Pre-trained. Production-ready.
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight">
          Meet your{' '}
          <span className="bg-gradient-to-r from-primary via-secondary to-gold bg-clip-text text-transparent">
            workforce
          </span>
          .
        </h1>
        <p className="text-lg text-text-secondary">
          Pre-built agents specialized for the work you actually do. Deploy in minutes. Customize at
          will. Compose into autonomous teams.
        </p>
      </section>

      {/* Grid */}
      <section className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 overflow-hidden hover:-translate-y-1 transition-all"
            >
              <div
                className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent`}
              />
              <div
                className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${agent.accent} opacity-0 group-hover:opacity-10 transition`}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-[0.3em] text-text-tertiary">
                    {agent.role}
                  </span>
                  <span
                    className={`text-xs rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-text-secondary`}
                  >
                    {agent.model}
                  </span>
                </div>
                <h3 className="text-3xl font-semibold">{agent.name}</h3>
                <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                  {agent.description}
                </p>

                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="text-xs uppercase tracking-widest text-text-tertiary mb-3">
                    Connected to
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {agent.tools.map((tool) => (
                      <span
                        key={tool}
                        className="rounded-md bg-white/[0.04] border border-white/10 px-2 py-1 text-xs text-text-secondary"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href="/sign-up"
                  className="mt-6 inline-flex items-center gap-2 text-sm text-secondary group-hover:gap-3 transition-all"
                >
                  <span>Hire {agent.name}</span>
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 via-transparent to-gold/10 backdrop-blur-md p-10 text-center space-y-5">
          <h2 className="text-3xl md:text-4xl font-semibold">Need a custom agent?</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Build any agent with any combination of tools, memory, and orchestration logic — no code
            required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/sign-up">
              <Button size="lg">Start building</Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                See pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
