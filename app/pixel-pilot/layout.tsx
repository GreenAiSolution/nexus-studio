"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const FlightScene = dynamic(
  () => import("@/components/pixel-pilot/flight-scene").then((m) => ({ default: m.FlightScene })),
  { ssr: false }
);

const NAV = [
  { href: "#deck", label: "Flight Deck" },
  { href: "#connectors", label: "Connectors" },
  { href: "#forge", label: "Creative Forge" },
  { href: "#automation", label: "Automation" },
  { href: "#pricing", label: "Pricing" },
];

export default function PixelPilotLayout({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? window.scrollY / total : 0);
      setScrolled(window.scrollY > 24);
      frame = 0;
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative bg-[#05060f] text-text-primary">
      <FlightScene />

      {/* Scroll progress */}
      <div
        className="fixed top-0 inset-x-0 z-[60] h-[2px] origin-left transition-[transform] duration-150 ease-out"
        style={{
          transform: `scaleX(${progress})`,
          background: "linear-gradient(90deg,#00D4FF 0%,#6C63FF 45%,#FF2E9A 100%)",
        }}
        aria-hidden
      />

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "border-b border-white/5 backdrop-blur-xl bg-[#05060f]/60" : "bg-transparent"
        }`}
      >
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/pixel-pilot" className="group flex items-center gap-2">
            <span className="relative inline-flex h-8 w-8 items-center justify-center">
              <span
                className="absolute inset-0 rounded-md opacity-90 blur-[6px]"
                style={{ background: "linear-gradient(135deg,#00D4FF,#6C63FF,#FF2E9A)" }}
              />
              <span className="relative inline-block h-3 w-3 rotate-45 bg-white" />
            </span>
            <span className="text-lg font-semibold tracking-[0.18em] uppercase">
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg,#00D4FF,#6C63FF,#FF2E9A)" }}
              >
                Pixel
              </span>
              <span className="text-text-primary">/Pilot</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-1 py-1 backdrop-blur-md">
            {NAV.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-4 py-1.5 rounded-full text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:inline-flex text-xs text-text-tertiary hover:text-text-secondary transition"
            >
              ← Nexus
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(90deg,#6C63FF,#FF2E9A)" }}
            >
              Book a flight
              <span aria-hidden>→</span>
            </a>
          </div>
        </nav>
      </header>

      <main className="flex-1 relative z-10">{children}</main>

      <footer className="relative z-10 border-t border-white/5 bg-[#05060f]/50 backdrop-blur-xl py-12 mt-32">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div
              className="text-lg font-semibold tracking-[0.18em] uppercase bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg,#00D4FF,#6C63FF,#FF2E9A)" }}
            >
              Pixel/Pilot
            </div>
            <p className="text-sm text-text-secondary max-w-sm">
              The autonomous media buyer that flies your ad spend to profit. A Nexus/AI company.
            </p>
          </div>
          <div className="text-text-tertiary text-xs uppercase tracking-widest">
            © 2026 · Built for the autonomous era
          </div>
        </div>
      </footer>
    </div>
  );
}
