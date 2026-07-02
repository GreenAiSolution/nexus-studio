'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// ─── CHAPTER WRAPPER ─────────────────────────────────────────────────────
// Each chapter is a full-viewport section that fades its content in/out
// based on its own scroll position. The 3D scene behind it animates
// continuously based on global scroll progress.

function Chapter({
  id,
  index,
  total,
  children,
  align = 'center',
}: {
  id: string;
  index: number;
  total: number;
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const inner = innerRef.current;
    if (!el || !inner) return;

    let frame = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Center of element vs center of viewport, normalized
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(center - vh / 2);
      const max = vh * 0.7;
      const closeness = Math.max(0, 1 - dist / max);
      // Ease
      const eased = closeness * closeness * (3 - 2 * closeness);
      inner.style.opacity = String(eased);
      inner.style.transform = `translate3d(0, ${(1 - eased) * 30}px, 0)`;
      frame = 0;
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const alignClass =
    align === 'left'
      ? 'items-start text-left'
      : align === 'right'
      ? 'items-end text-right'
      : 'items-center text-center';

  return (
    <section
      ref={ref}
      id={id}
      className="relative min-h-screen flex flex-col justify-center px-6 py-24"
      data-chapter={index}
    >
      {/* Chapter marker */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.4em] text-text-tertiary uppercase select-none">
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>

      <div
        ref={innerRef}
        className={`container mx-auto flex flex-col gap-8 max-w-5xl will-change-[transform,opacity] ${alignClass}`}
        style={{ opacity: 0 }}
      >
        {children}
      </div>
    </section>
  );
}

// ─── PRICING TIER DATA ───────────────────────────────────────────────────

const TIERS = [
  {
    id: 'RECRUIT',
    name: 'Recruit',
    price: 97,
    tagline: 'Your first hire',
    agents: '1 AI Agent',
    runs: '500 runs/mo',
    accent: 'from-primary/60 to-primary/0',
    border: 'border-white/10',
  },
  {
    id: 'OPERATOR',
    name: 'Operator',
    price: 497,
    tagline: 'For growing teams',
    agents: '5 AI Agents',
    runs: '5,000 runs/mo',
    accent: 'from-secondary/60 to-secondary/0',
    border: 'border-secondary/30',
  },
  {
    id: 'COMMANDER',
    name: 'Commander',
    price: 997,
    tagline: 'Department-scale ops',
    agents: '15 AI Agents',
    runs: '25,000 runs/mo',
    accent: 'from-primary/70 to-secondary/30',
    border: 'border-primary/40',
    featured: true,
  },
  {
    id: 'EMPIRE',
    name: 'Empire',
    price: 2497,
    tagline: 'Enterprise automation',
    agents: '50 AI Agents',
    runs: '150,000 runs/mo',
    accent: 'from-gold/70 to-gold/0',
    border: 'border-gold/40',
  },
  {
    id: 'SOVEREIGN',
    name: 'Sovereign',
    price: 7497,
    tagline: 'No limits. Period.',
    agents: 'Unlimited Agents',
    runs: 'Unlimited runs',
    accent: 'from-accent/80 to-gold/30',
    border: 'border-accent/40',
    apex: true,
  },
];

// ─── HOMEPAGE ────────────────────────────────────────────────────────────

export default function HomePage() {
  const total = 6;

  return (
    <div className="relative">
      {/* CHAPTER NAV — vertical dots */}
      <ChapterNav total={total} />

      {/* 01 ORIGIN */}
      <Chapter id="origin" index={0} total={total}>
        <div className="inline-flex items-center gap-2 self-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
          <span className="text-xs uppercase tracking-[0.3em] text-text-secondary">
            The autonomous era begins
          </span>
        </div>

        <h1 className="text-[clamp(2.75rem,8vw,7rem)] leading-[0.95] font-semibold tracking-tight">
          <span className="block bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            AI that runs
          </span>
          <span className="block text-text-primary">your company.</span>
        </h1>

        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Deploy intelligent autonomous agents that handle sales, support, research, and operations —
          all running 24/7 with zero oversight required.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/sign-up">
            <Button size="lg">Deploy your first agent</Button>
          </Link>
          <Link href="/studio">
            <Button size="lg" variant="outline">
              Enter the Studio
            </Button>
          </Link>
          <Link href="#pricing">
            <Button size="lg" variant="outline">
              Explore pricing
            </Button>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.25em] text-text-tertiary">
          <span>15+ Models</span>
          <span className="text-text-tertiary/40">·</span>
          <span>50+ Integrations</span>
          <span className="text-text-tertiary/40">·</span>
          <span>SOC 2 Type II</span>
          <span className="text-text-tertiary/40">·</span>
          <span>99.99% Uptime</span>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[10px] tracking-[0.4em] uppercase text-text-tertiary">Scroll</span>
          <span className="block h-8 w-px bg-gradient-to-b from-text-tertiary/60 to-transparent animate-pulse" />
        </div>
      </Chapter>

      {/* 02 CAPABILITIES */}
      <Chapter id="capabilities" index={1} total={total} align="left">
        <div className="grid md:grid-cols-2 gap-12 items-center w-full">
          <div className="space-y-6">
            <div className="text-xs uppercase tracking-[0.3em] text-secondary">
              ── Capabilities
            </div>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
              One platform.
              <br />
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                Infinite workflows.
              </span>
            </h2>
            <p className="text-text-secondary text-lg max-w-lg">
              Compose autonomous agents that think, plan, and act across every tool your business
              already uses. No prompts to write. No code to ship.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Reasoning', value: '15+', sub: 'Frontier models' },
              { label: 'Tools', value: '50+', sub: 'Native connectors' },
              { label: 'Memory', value: '∞', sub: 'Vector + episodic' },
              { label: 'Latency', value: '47ms', sub: 'Avg response' },
            ].map((s) => (
              <div
                key={s.label}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md overflow-hidden hover:border-white/20 transition"
              >
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition" />
                <div className="relative">
                  <div className="text-xs uppercase tracking-widest text-text-tertiary">
                    {s.label}
                  </div>
                  <div className="mt-3 text-4xl font-semibold tabular-nums bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {s.value}
                  </div>
                  <div className="mt-1 text-sm text-text-secondary">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Chapter>

      {/* 03 AGENTS */}
      <Chapter id="agents" index={2} total={total}>
        <div className="text-xs uppercase tracking-[0.3em] text-accent">── Agents</div>
        <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight max-w-4xl">
          Pre-trained for the work
          <br />
          you actually do.
        </h2>

        <div className="grid md:grid-cols-3 gap-6 w-full mt-10">
          {[
            {
              role: 'Sales',
              name: 'Ember',
              desc: 'Qualifies leads, schedules meetings, follows up — across CRM, email, and Slack.',
              tag: 'Revenue',
            },
            {
              role: 'Support',
              name: 'Aurora',
              desc: 'Resolves tickets, escalates intelligently, and writes docs as it learns.',
              tag: 'CX',
            },
            {
              role: 'Operations',
              name: 'Vector',
              desc: 'Monitors metrics, files reports, and orchestrates other agents on schedule.',
              tag: 'Ops',
            },
          ].map((a) => (
            <div
              key={a.name}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6 text-left overflow-hidden hover:-translate-y-1 transition"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest text-text-tertiary">
                  {a.role}
                </div>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-text-secondary">
                  {a.tag}
                </span>
              </div>
              <div className="mt-3 text-2xl font-semibold">{a.name}</div>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">{a.desc}</p>
              <div className="mt-6 flex items-center gap-2 text-xs text-secondary group-hover:gap-3 transition-all">
                <span>Configure</span>
                <span aria-hidden>→</span>
              </div>
            </div>
          ))}
        </div>
      </Chapter>

      {/* 04 INTEGRATIONS */}
      <Chapter id="integrations" index={3} total={total} align="left">
        <div className="grid md:grid-cols-2 gap-12 items-center w-full">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold">── Integrations</div>
            <h2 className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
              Already connected
              <br />
              <span className="bg-gradient-to-r from-gold to-accent bg-clip-text text-transparent">
                to your stack.
              </span>
            </h2>
            <p className="mt-6 text-text-secondary text-lg max-w-md">
              Plug into Salesforce, HubSpot, Slack, Google Workspace, Notion, Linear, Stripe — and
              45+ more. OAuth in a click. Webhooks first-class. Zero glue code.
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-text-tertiary">
              <span className="inline-block h-px w-10 bg-text-tertiary/60" />
              <span>Native OAuth</span>
              <span>· Webhooks</span>
              <span>· REST + GraphQL</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              'Slack',
              'Salesforce',
              'HubSpot',
              'Notion',
              'Linear',
              'GitHub',
              'Stripe',
              'Gmail',
              'Calendar',
              'Drive',
              'Zendesk',
              'Jira',
            ].map((name, i) => (
              <div
                key={name}
                className="aspect-square rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex items-center justify-center text-[10px] uppercase tracking-widest text-text-secondary hover:border-white/25 hover:text-text-primary transition"
                style={{ animation: `tile-pulse 6s ease-in-out ${i * 0.15}s infinite` }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </Chapter>

      {/* 05 PRICING */}
      <Chapter id="pricing" index={4} total={total}>
        <div className="text-xs uppercase tracking-[0.3em] text-primary">── Pricing</div>
        <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
          Scale your workforce.
        </h2>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Five tiers, one workforce. Upgrade the moment you outgrow the last.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 w-full mt-10">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className={`group relative rounded-2xl border ${t.border} bg-white/[0.03] backdrop-blur-md p-6 text-left overflow-hidden flex flex-col ${
                t.featured ? 'lg:-translate-y-3 lg:scale-[1.03]' : ''
              } ${t.apex ? 'lg:-translate-y-1' : ''}`}
            >
              <div
                className={`absolute -inset-1 rounded-3xl bg-gradient-to-b ${t.accent} opacity-30 blur-2xl -z-10`}
              />
              {t.featured && (
                <div className="absolute top-4 right-4 text-[10px] uppercase tracking-[0.25em] rounded-full bg-primary/20 text-primary border border-primary/30 px-2 py-0.5">
                  Most Loved
                </div>
              )}
              {t.apex && (
                <div className="absolute top-4 right-4 text-[10px] uppercase tracking-[0.25em] rounded-full bg-accent/20 text-accent border border-accent/30 px-2 py-0.5">
                  Apex
                </div>
              )}

              <div className="text-xs uppercase tracking-[0.3em] text-text-tertiary">
                {t.id}
              </div>
              <div className="mt-2 text-2xl font-semibold">{t.name}</div>
              <div className="mt-1 text-sm text-text-secondary">{t.tagline}</div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tabular-nums">${t.price.toLocaleString()}</span>
                <span className="text-sm text-text-tertiary">/mo</span>
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  {t.agents}
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-text-tertiary" />
                  {t.runs}
                </div>
              </div>

              <Link href="/sign-up" className="mt-auto pt-8">
                <Button
                  variant={t.featured || t.apex ? 'default' : 'outline'}
                  className="w-full"
                >
                  {t.apex ? 'Talk to sales' : 'Start with ' + t.name}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-xs text-text-tertiary mt-6">
          All plans include SOC 2, 99.99% SLA, audit logs, and 14-day free trial.
        </div>
      </Chapter>

      {/* 06 CONVERGENCE */}
      <Chapter id="convergence" index={5} total={total}>
        <div className="text-xs uppercase tracking-[0.3em] text-text-tertiary">
          ── The autonomous era
        </div>

        <h2 className="text-4xl md:text-7xl font-semibold tracking-tight leading-[1.02]">
          Stop hiring humans
          <br />
          <span className="bg-gradient-to-r from-primary via-secondary to-gold bg-clip-text text-transparent">
            for work AI can run.
          </span>
        </h2>

        <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto">
          Your competitors are deploying their first agents this quarter. Make sure you&apos;re not
          the last one in the room with a manual workflow.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/sign-up">
            <Button size="lg">Deploy your first agent</Button>
          </Link>
          <Link href="/integrations">
            <Button size="lg" variant="outline">
              Browse the stack
            </Button>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto">
          {[
            { value: '500+', label: 'Active agents' },
            { value: '1M+', label: 'Tasks/day' },
            { value: '99.99%', label: 'Uptime' },
            { value: '47ms', label: 'Avg response' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 text-center"
            >
              <div className="text-2xl font-semibold tabular-nums bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="text-xs uppercase tracking-widest text-text-tertiary mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </Chapter>

    </div>
  );
}

// ─── CHAPTER NAV — vertical dots ─────────────────────────────────────────

function ChapterNav({ total }: { total: number }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>('section[data-chapter]')
      );
      const vh = window.innerHeight;
      let bestIdx = 0;
      let bestDist = Infinity;
      sections.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const d = Math.abs(center - vh / 2);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      });
      setActive(bestIdx);
      frame = 0;
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const labels = ['Origin', 'Capabilities', 'Agents', 'Integrations', 'Pricing', 'Begin'];

  return (
    <nav
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3"
      aria-label="Chapter navigation"
    >
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === active;
        return (
          <a
            key={i}
            href={`#${['origin', 'capabilities', 'agents', 'integrations', 'pricing', 'convergence'][i]}`}
            className="group flex items-center gap-3"
          >
            <span
              className={`text-[10px] uppercase tracking-[0.3em] transition-opacity ${
                isActive ? 'opacity-90 text-text-primary' : 'opacity-0 group-hover:opacity-60 text-text-secondary'
              }`}
            >
              {labels[i]}
            </span>
            <span
              className={`h-1.5 rounded-full transition-all ${
                isActive
                  ? 'w-6 bg-gradient-to-r from-primary to-secondary'
                  : 'w-1.5 bg-white/30 group-hover:bg-white/60'
              }`}
            />
          </a>
        );
      })}
    </nav>
  );
}
