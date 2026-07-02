'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ImmersiveScrollScene = dynamic(
  () =>
    import('@/components/3d/immersive-scroll-scene').then((m) => ({
      default: m.ImmersiveScrollScene,
    })),
  { ssr: false }
);

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const p = total > 0 ? window.scrollY / total : 0;
      setProgress(p);
      setScrolled(window.scrollY > 24);
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

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  const navLinks: { href: string; label: string }[] = [
    { href: '/agents', label: 'Agents' },
    { href: '/integrations', label: 'Integrations' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/studio', label: 'Studio' },
  ];

  return (
    <div className="flex flex-col min-h-screen relative">
      <ImmersiveScrollScene />

      {/* Scroll progress bar */}
      <div
        className="fixed top-0 inset-x-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-primary via-secondary to-gold transition-[transform] duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden
      />

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/5 backdrop-blur-xl bg-bg-primary/60'
            : 'bg-transparent'
        }`}
      >
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <span className="relative inline-flex h-8 w-8 items-center justify-center">
              <span className="absolute inset-0 rounded-md bg-gradient-to-br from-primary via-secondary to-gold opacity-90 blur-[6px]" />
              <span className="relative inline-block h-3 w-3 rounded-sm bg-white" />
            </span>
            <span className="text-xl font-semibold tracking-[0.18em] uppercase">
              <span className="bg-gradient-to-r from-primary via-secondary to-gold bg-clip-text text-transparent">
                Nexus
              </span>
              <span className="text-text-primary">/AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-1 py-1 backdrop-blur-md">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  isActive(link.href)
                    ? 'bg-white/10 text-text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="hidden sm:inline-flex text-sm text-text-secondary hover:text-text-primary transition"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-full bg-white text-bg-primary px-4 py-1.5 text-sm font-medium hover:bg-white/90 transition"
            >
              Deploy
              <span aria-hidden>→</span>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 relative z-10">{children}</main>

      <footer className="relative z-10 border-t border-white/5 bg-bg-primary/40 backdrop-blur-xl py-12 mt-32">
        <div className="container mx-auto px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="space-y-3">
              <div className="text-xl font-semibold tracking-[0.18em] uppercase bg-gradient-to-r from-primary via-secondary to-gold bg-clip-text text-transparent">
                Nexus/AI
              </div>
              <p className="text-sm text-text-secondary max-w-xs">
                Autonomous AI workforce. Deploy intelligent agents that run your operations 24/7.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-text-tertiary mb-2">Product</div>
              <Link href="/agents" className="block text-sm text-text-secondary hover:text-text-primary">Agents</Link>
              <Link href="/integrations" className="block text-sm text-text-secondary hover:text-text-primary">Integrations</Link>
              <Link href="/pricing" className="block text-sm text-text-secondary hover:text-text-primary">Pricing</Link>
            </div>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-text-tertiary mb-2">Company</div>
              <span className="block text-sm text-text-secondary">About</span>
              <span className="block text-sm text-text-secondary">Careers</span>
              <span className="block text-sm text-text-secondary">Contact</span>
            </div>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-text-tertiary mb-2">Legal</div>
              <span className="block text-sm text-text-secondary">Privacy</span>
              <span className="block text-sm text-text-secondary">Terms</span>
              <span className="block text-sm text-text-secondary">SOC 2</span>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-text-tertiary text-sm">© 2026 NEXUS AI. All rights reserved.</div>
            <div className="text-text-tertiary text-xs uppercase tracking-widest">
              Built for the autonomous era
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
