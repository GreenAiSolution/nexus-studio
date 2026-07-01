'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { signIn } from '@/lib/session';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const enter = () => {
    if (!email || !password || loading) return;
    setLoading(true);
    // Self-contained: any credentials open the studio. Real auth drops in here.
    signIn(email);
    setTimeout(() => router.push('/studio'), 650);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    enter();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-primary px-4">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute left-1/2 top-1/3 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(108,99,255,0.75) 0%, rgba(0,212,255,0.3) 55%, transparent 78%)',
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 h-[380px] w-[380px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.6) 0%, transparent 70%)' }}
        />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <span
            className="text-3xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'var(--font-brand)' }}
          >
            NEXUS <span className="text-primary">STUDIO</span>
          </span>
          <p className="mt-3 text-sm text-text-secondary">
            Sign in to design your AI workforce
          </p>
        </div>

        <div
          className="rounded-2xl border border-white/10 p-8"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-white/25 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-text-secondary">Password</label>
                <button type="button" className="text-xs text-primary transition-colors hover:text-secondary">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-white/25 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg,#6C63FF 0%,#00D4FF 100%)',
                boxShadow: '0 0 30px rgba(108,99,255,0.4)',
              }}
            >
              {loading ? (
                'Entering the studio…'
              ) : (
                <>
                  Enter the studio
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              New here?{' '}
              <button
                type="button"
                onClick={enter}
                className="font-medium text-primary transition-colors hover:text-secondary"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/20">No card required to explore · Cancel anytime</p>
      </div>
    </div>
  );
}
