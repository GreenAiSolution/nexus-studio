"use client";

import { useEffect, useRef, useState } from "react";
import {
  SERVICES,
  CONNECTOR_LIST,
  CREATIVE_APPS,
  WORKFLOWS,
  TIERS,
  type Connector,
} from "@/pixel-pilot";
import { CreativeForge } from "@/components/pixel-pilot/creative-forge";

// ─── SCROLL-REVEAL WRAPPER ────────────────────────────────────────────────────

function Reveal({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      id={id}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{ opacity: 0, transform: "translateY(28px)" }}
    >
      {children}
    </div>
  );
}

// ─── CONNECTOR CARD (live wiring) ─────────────────────────────────────────────

function ConnectorCard({ c }: { c: Connector }) {
  const [status, setStatus] = useState<"idle" | "checking" | "needs-config">("idle");

  async function connect() {
    setStatus("checking");
    try {
      const res = await fetch(`/api/pixel-pilot/connectors/${c.id}`, { redirect: "manual" });
      // A live connector answers with an opaque redirect to the OAuth consent page.
      if (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400)) {
        window.location.href = `/api/pixel-pilot/connectors/${c.id}`;
        return;
      }
      setStatus("needs-config");
    } catch {
      setStatus("needs-config");
    }
  }

  return (
    <div
      className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 overflow-hidden hover:-translate-y-1 transition"
      style={{ ["--hue" as string]: c.hue }}
    >
      <div
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition"
        style={{ background: `radial-gradient(120px 80px at 30% 0%, ${c.hue}22, transparent)` }}
      />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ background: c.hue, boxShadow: `0 0 20px ${c.hue}66` }}
          >
            {c.name[0]}
          </span>
          <div>
            <div className="font-semibold">{c.name}</div>
            <div className="text-[11px] uppercase tracking-widest text-text-tertiary">
              {c.category}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-text-secondary">{c.tagline}</p>
        <ul className="mt-4 space-y-1.5">
          {c.powers.map((p) => (
            <li key={p} className="flex items-start gap-2 text-xs text-text-secondary">
              <span className="mt-1 h-1 w-1 rounded-full" style={{ background: c.hue }} />
              {p}
            </li>
          ))}
        </ul>
        <button
          onClick={connect}
          className="mt-5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium hover:border-white/25 transition"
        >
          {status === "checking"
            ? "Opening…"
            : status === "needs-config"
            ? "Add credentials to connect"
            : `Connect ${c.name}`}
        </button>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PixelPilotPage() {
  return (
    <div className="relative">
      {/* HERO */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-24">
        <div className="container mx-auto max-w-5xl text-center flex flex-col items-center gap-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF2E9A] animate-pulse" />
            <span className="text-xs uppercase tracking-[0.3em] text-text-secondary">
              The new face of paid media
            </span>
          </div>

          <h1 className="text-[clamp(2.75rem,8vw,7rem)] leading-[0.92] font-semibold tracking-tight">
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg,#00D4FF,#6C63FF,#FF2E9A)" }}
            >
              Your ad spend,
            </span>
            <span className="block text-text-primary">on autopilot.</span>
          </h1>

          <p className="text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed">
            Pixel Pilot isn&apos;t a dashboard. It&apos;s an autonomous media buyer that flies Meta,
            Google &amp; TikTok to <span className="text-text-primary">real profit</span> — 24/7,
            hands off the wheel.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="#pricing"
              className="rounded-full px-7 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(90deg,#6C63FF,#FF2E9A)" }}
            >
              Book a flight →
            </a>
            <a
              href="#forge"
              className="rounded-full border border-white/15 px-7 py-3 text-sm font-medium text-text-primary hover:bg-white/5 transition"
            >
              Try the Creative Forge
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.25em] text-text-tertiary">
            <span>Profit-optimized</span>
            <span className="text-text-tertiary/40">·</span>
            <span>4 native channels</span>
            <span className="text-text-tertiary/40">·</span>
            <span>Higgsfield creative</span>
            <span className="text-text-tertiary/40">·</span>
            <span>&lt;60min to live</span>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-[10px] tracking-[0.4em] uppercase text-text-tertiary">Descend</span>
            <span className="block h-8 w-px bg-gradient-to-b from-text-tertiary/60 to-transparent animate-pulse" />
          </div>
        </div>
      </section>

      {/* FLIGHT DECK — 10 SERVICES */}
      <section id="deck" className="px-6 py-24">
        <div className="container mx-auto max-w-6xl">
          <Reveal className="text-center max-w-3xl mx-auto space-y-4">
            <div className="text-xs uppercase tracking-[0.3em] text-[#FF2E9A]">── The Flight Deck</div>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">
              Ten instruments.
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg,#00D4FF,#6C63FF,#FF2E9A)" }}
              >
                One autonomous buyer.
              </span>
            </h2>
            <p className="text-text-secondary text-lg">
              Not another ad tool. The full media-buying department — every service pointed at one
              niche, and none of it basic.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-5 mt-14">
            {SERVICES.map((s, i) => (
              <Reveal key={s.id} id={s.id} className="[transition-delay:var(--d)]" >
                <div
                  className="group relative h-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-7 overflow-hidden hover:border-white/20 transition"
                  style={{ ["--d" as string]: `${(i % 2) * 80}ms` }}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-px opacity-60"
                    style={{ background: `linear-gradient(90deg,transparent,${s.accent},transparent)` }}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs font-mono tracking-widest"
                          style={{ color: s.accent }}
                        >
                          {s.no}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.25em] text-text-tertiary rounded-full border border-white/10 px-2 py-0.5">
                          {s.category}
                        </span>
                      </div>
                      <h3 className="mt-3 text-2xl font-semibold leading-tight">{s.name}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className="text-2xl font-semibold tabular-nums"
                        style={{ color: s.accent }}
                      >
                        {s.metric.value}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-text-tertiary">
                        {s.metric.label}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-[15px] font-medium text-text-primary">{s.headline}</p>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">{s.body}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: s.accent }}>
                    <span aria-hidden>◆</span>
                    <span className="text-text-secondary italic">{s.edge}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CONNECTORS */}
      <section id="connectors" className="px-6 py-24">
        <div className="container mx-auto max-w-6xl">
          <Reveal className="grid lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
            <div className="lg:sticky lg:top-28 space-y-4">
              <div className="text-xs uppercase tracking-[0.3em] text-secondary">── Connectors</div>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
                Four pipes.
                <br />
                One flight plan.
              </h2>
              <p className="text-text-secondary text-lg max-w-md">
                Pixel Pilot flies where your money already lives. OAuth in a click — spend and
                delivery flow in, decisions flow back out, and Shopify keeps everyone honest with
                real profit.
              </p>
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-text-tertiary pt-2">
                <span className="inline-block h-px w-10 bg-text-tertiary/60" />
                Native OAuth · Real-time
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {CONNECTOR_LIST.map((c) => (
                <ConnectorCard key={c.id} c={c} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CREATIVE FORGE */}
      <section id="forge" className="px-6 py-24">
        <div className="container mx-auto max-w-6xl">
          <Reveal className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <div className="text-xs uppercase tracking-[0.3em] text-[#FF2E9A]">
              ── Creative Forge · powered by Higgsfield
            </div>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">
              Watch it make the ad.
            </h2>
            <p className="text-text-secondary text-lg">
              This is the product automating itself, live. Drop a brand, pick a vibe, and Pixel Pilot
              fires Higgsfield to forge a scroll-stopping reel — the same engine that refreshes
              fatigued creative on your account automatically.
            </p>
          </Reveal>
          <Reveal>
            <CreativeForge />
          </Reveal>

          {/* Creative apps */}
          <Reveal className="mt-16">
            <div className="text-xs uppercase tracking-[0.3em] text-text-tertiary text-center mb-6">
              ── The apps you actually open
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CREATIVE_APPS.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 hover:border-white/20 transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                      style={{ background: `${a.accent}1f`, color: a.accent }}
                    >
                      {a.glyph}
                    </span>
                    <div>
                      <div className="font-semibold text-sm">{a.name}</div>
                      <div className="text-[10px] uppercase tracking-widest text-text-tertiary">
                        {a.kind}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-text-secondary leading-relaxed">{a.blurb}</p>
                  <div className="mt-3 text-[11px] text-text-tertiary">
                    Powered by <span style={{ color: a.accent }}>{a.poweredBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* AUTOMATION — n8n */}
      <section id="automation" className="px-6 py-24">
        <div className="container mx-auto max-w-6xl">
          <Reveal className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <div className="text-xs uppercase tracking-[0.3em] text-secondary">
              ── Automation spine · n8n
            </div>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">
              The loops that run while you sleep.
            </h2>
            <p className="text-text-secondary text-lg">
              Every decision Pixel Pilot makes rides a real n8n workflow — importable, auditable,
              yours. Here are four of the brains on the wing.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-5">
            {WORKFLOWS.map((w) => (
              <Reveal key={w.id}>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 h-full">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold">{w.name}</h3>
                    <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-widest text-secondary">
                      {w.cadence}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{w.summary}</p>

                  {/* node flow */}
                  <div className="mt-5 flex flex-wrap items-center gap-1.5">
                    {w.nodes.map((n, i) => (
                      <span key={n.name} className="flex items-center gap-1.5">
                        <span className="rounded-md border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-text-secondary">
                          {n.name}
                        </span>
                        {i < w.nodes.length - 1 && (
                          <span className="text-text-tertiary/60 text-xs">→</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-6 py-24">
        <div className="container mx-auto max-w-6xl">
          <Reveal className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <div className="text-xs uppercase tracking-[0.3em] text-gold">── Book a flight</div>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">
              Priced like the department it replaces.
            </h2>
            <p className="text-text-secondary text-lg">
              This isn&apos;t a $99 app. It&apos;s a media-buying team that never sleeps — retainer
              plus a slice of spend, so we only win when you do.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {TIERS.map((t) => (
              <Reveal key={t.id}>
                <div
                  className={`relative h-full rounded-2xl border ${t.border} bg-white/[0.03] backdrop-blur-md p-7 flex flex-col overflow-hidden ${
                    t.featured ? "md:-translate-y-3 md:scale-[1.03]" : ""
                  }`}
                >
                  <div
                    className={`absolute -inset-1 rounded-3xl bg-gradient-to-b ${t.accent} opacity-30 blur-2xl -z-10`}
                  />
                  {t.featured && (
                    <div className="absolute top-4 right-4 text-[10px] uppercase tracking-[0.25em] rounded-full bg-primary/20 text-primary border border-primary/30 px-2 py-0.5">
                      Most flown
                    </div>
                  )}
                  {t.apex && (
                    <div className="absolute top-4 right-4 text-[10px] uppercase tracking-[0.25em] rounded-full bg-gold/20 text-gold border border-gold/30 px-2 py-0.5">
                      Apex
                    </div>
                  )}

                  <div className="text-xs uppercase tracking-[0.3em] text-text-tertiary">{t.id}</div>
                  <div className="mt-2 text-2xl font-semibold">{t.name}</div>
                  <div className="mt-1 text-sm text-text-secondary">{t.tagline}</div>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tabular-nums">
                      ${t.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-text-tertiary">/mo</span>
                  </div>
                  <div className="mt-1 text-xs text-[#FF2E9A]">{t.performance}</div>
                  <div className="mt-1 text-xs text-text-tertiary">{t.adSpend}</div>

                  <div className="mt-5 space-y-2 text-sm">
                    {t.includes.map((f) => (
                      <div key={f} className="flex items-start gap-2 text-text-secondary">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-secondary shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-8 text-xs text-text-tertiary">{t.forWho}</div>
                  <a
                    href="#"
                    className={`mt-4 w-full text-center rounded-lg px-6 py-3 text-sm font-semibold transition ${
                      t.featured || t.apex
                        ? "text-white hover:opacity-90"
                        : "border border-white/15 text-text-primary hover:bg-white/5"
                    }`}
                    style={
                      t.featured || t.apex
                        ? { background: "linear-gradient(90deg,#6C63FF,#FF2E9A)" }
                        : undefined
                    }
                  >
                    {t.apex ? "Talk to command" : `Fly with ${t.name}`}
                  </a>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="text-center text-xs text-text-tertiary mt-8">
            Every tier: profit-based reporting, Slack war room, and a 60-minute zero-to-live launch.
          </Reveal>
        </div>
      </section>

      {/* FINAL */}
      <section className="px-6 py-32">
        <Reveal className="container mx-auto max-w-3xl text-center space-y-6">
          <h2 className="text-4xl md:text-7xl font-semibold tracking-tight leading-[1.02]">
            Stop managing ads.
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg,#00D4FF,#6C63FF,#FF2E9A)" }}
            >
              Start flying them.
            </span>
          </h2>
          <p className="text-text-secondary text-lg md:text-xl">
            Your competitors are still clicking. Put a pilot in the seat and let your spend climb to
            profit on its own.
          </p>
          <div className="flex justify-center pt-2">
            <a
              href="#pricing"
              className="rounded-full px-8 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(90deg,#6C63FF,#FF2E9A)" }}
            >
              Book a flight →
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
