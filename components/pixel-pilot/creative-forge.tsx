"use client";

// ─── PIXEL PILOT · CREATIVE FORGE (client) ───────────────────────────────────
// The live, on-site demo of the product automating itself: a visitor types a
// brand + product, picks a vibe/channel, and Pixel Pilot fires Higgsfield to
// forge an ad reel — streaming the render as it "builds". Talks to
// POST /api/pixel-pilot/higgsfield. Works with or without a real Higgsfield key
// (the route returns a shaped simulated job when none is set).

import { useEffect, useRef, useState } from "react";
import { VIBES, type CreativeJob, type CreativeVibe } from "@/pixel-pilot";

const CHANNELS: { id: CreativeJob["channel"]; label: string }[] = [
  { id: "tiktok", label: "TikTok" },
  { id: "reels", label: "Reels" },
  { id: "shorts", label: "Shorts" },
  { id: "feed", label: "Feed" },
];

const BUILD_STEPS = [
  "Reading the brand",
  "Pulling winning genes",
  "Directing the shot",
  "Higgsfield rendering",
  "Cutting the hook",
  "Reel ready",
];

export function CreativeForge() {
  const [brand, setBrand] = useState("");
  const [product, setProduct] = useState("");
  const [vibe, setVibe] = useState<CreativeVibe>("kinetic");
  const [channel, setChannel] = useState<CreativeJob["channel"]>("tiktok");
  const [job, setJob] = useState<CreativeJob | null>(null);
  const [live, setLive] = useState(false);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  async function forge() {
    if (!brand.trim() || busy) return;
    setBusy(true);
    setError(null);
    setJob(null);
    setStep(0);

    // Animate the build steps while the request is in flight.
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setStep((s) => Math.min(s + 1, BUILD_STEPS.length - 2));
    }, 650);

    try {
      const res = await fetch("/api/pixel-pilot/higgsfield", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, product, vibe, channel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Render failed");
      // let the animation breathe a moment before revealing
      setTimeout(() => {
        if (timer.current) clearInterval(timer.current);
        setStep(BUILD_STEPS.length - 1);
        setJob(data.job as CreativeJob);
        setLive(Boolean(data.live));
        setBusy(false);
      }, 900);
    } catch (err) {
      if (timer.current) clearInterval(timer.current);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  const activeVibe = VIBES.find((v) => v.id === vibe)!;

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-stretch">
      {/* CONTROLS */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.25em] text-text-tertiary">Brand</label>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Lumen Skincare"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary/70 focus:outline-none focus:border-[#FF2E9A]/60 transition"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.25em] text-text-tertiary">
            Product / URL
          </label>
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Vitamin-C serum that sells out weekly"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary/70 focus:outline-none focus:border-[#FF2E9A]/60 transition"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.25em] text-text-tertiary">Vibe</label>
          <div className="grid grid-cols-2 gap-2">
            {VIBES.map((v) => (
              <button
                key={v.id}
                onClick={() => setVibe(v.id)}
                className={`rounded-lg border px-3 py-2.5 text-left transition ${
                  vibe === v.id
                    ? "border-[#FF2E9A]/60 bg-[#FF2E9A]/10 text-text-primary"
                    : "border-white/10 bg-black/20 text-text-secondary hover:border-white/25"
                }`}
              >
                <div className="text-sm font-medium">{v.name}</div>
                <div className="text-[11px] text-text-tertiary leading-snug mt-0.5">{v.note}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.25em] text-text-tertiary">Channel</label>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <button
                key={c.id}
                onClick={() => setChannel(c.id)}
                className={`rounded-full border px-4 py-1.5 text-xs transition ${
                  channel === c.id
                    ? "border-secondary/60 bg-secondary/10 text-text-primary"
                    : "border-white/10 text-text-secondary hover:border-white/25"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={forge}
          disabled={busy || !brand.trim()}
          className="w-full rounded-lg px-6 py-3.5 text-sm font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(90deg,#00D4FF 0%,#6C63FF 45%,#FF2E9A 100%)" }}
        >
          {busy ? "Forging…" : "Forge the reel →"}
        </button>
        {error && <div className="text-xs text-error">{error}</div>}
      </div>

      {/* PREVIEW */}
      <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden min-h-[420px] flex items-center justify-center">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(255,46,154,0.25), transparent 60%)",
          }}
        />

        {!job && !busy && (
          <div className="relative text-center px-8 space-y-3">
            <div className="text-5xl">✦</div>
            <div className="text-text-secondary text-sm max-w-xs mx-auto">
              Your ad reel renders here. Fill in a brand and forge it — powered by Higgsfield.
            </div>
          </div>
        )}

        {busy && (
          <div className="relative w-full px-8 space-y-4">
            <div className="mx-auto w-40 aspect-[9/16] rounded-xl border border-white/10 overflow-hidden relative">
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,212,255,0.35), rgba(108,99,255,0.35), rgba(255,46,154,0.35))",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">
                ✦
              </div>
            </div>
            <div className="space-y-1.5 max-w-xs mx-auto">
              {BUILD_STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`flex items-center gap-2 text-xs transition ${
                    i <= step ? "text-text-primary" : "text-text-tertiary/50"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      i < step ? "bg-secondary" : i === step ? "bg-[#FF2E9A] animate-pulse" : "bg-white/15"
                    }`}
                  />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {job && !busy && (
          <div className="relative w-full px-8 py-8 space-y-4">
            <div
              className="mx-auto rounded-xl border border-white/15 overflow-hidden relative flex items-center justify-center"
              style={{
                width: job.aspect === "1:1" ? "220px" : "180px",
                aspectRatio: job.aspect.replace(":", "/"),
                background:
                  "linear-gradient(135deg, rgba(0,212,255,0.5), rgba(108,99,255,0.5), rgba(255,46,154,0.55))",
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="text-3xl">▶</div>
                <div className="mt-2 text-sm font-semibold px-3 text-center leading-tight">
                  {job.brand}
                </div>
                <div className="text-[10px] uppercase tracking-widest opacity-80 mt-1">
                  {activeVibe.name} · {job.channel}
                </div>
              </div>
            </div>

            <div className="max-w-sm mx-auto grid grid-cols-2 gap-2 text-center text-[11px]">
              <Stat label="Aspect" value={job.aspect} />
              <Stat label="Duration" value={`${job.durationSec}s`} />
              <Stat label="Preset" value={job.preset} />
              <Stat label="Source" value={live ? "Higgsfield · live" : "Simulated"} />
            </div>
            <div className="text-center">
              <button
                onClick={() => setJob(null)}
                className="text-xs text-text-secondary hover:text-text-primary underline underline-offset-4"
              >
                Forge another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2">
      <div className="text-text-tertiary uppercase tracking-widest text-[9px]">{label}</div>
      <div className="text-text-primary mt-0.5 truncate">{value}</div>
    </div>
  );
}
