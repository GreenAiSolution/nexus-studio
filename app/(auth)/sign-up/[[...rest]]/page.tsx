'use client';

import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

type Step = 'account' | 'verify';
const STEP_ORDER: Step[] = ['account', 'verify'];

export default function SignUpPage() {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<Step>('account');

  // Step 1 — account fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');

  // Step 2 — email verification
  const [code, setCode] = useState('');

  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const isReady = fetchStatus === 'idle';

  // ── Step 1: create account ────────────────────────────────────────────────
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReady) return;
    setLoading(true);
    setError('');
    try {
      const { error: createErr } = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });
      if (createErr) {
        setError(createErr.message || 'Something went wrong. Please try again.');
        return;
      }
      const { error: sendErr } = await signUp.verifications.sendEmailCode();
      if (sendErr) {
        setError(sendErr.message || 'Failed to send verification code.');
        return;
      }
      setStep('verify');
    } catch (err: unknown) {
      const msg = (err as { errors?: { message: string }[] })?.errors?.[0]?.message;
      setError(msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify email → straight into the studio (no card required) ─────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReady) return;
    setLoading(true);
    setError('');
    try {
      const { error: verifyErr } = await signUp.verifications.verifyEmailCode({ code });
      if (verifyErr) {
        setError(verifyErr.message || 'Invalid code. Please check your email.');
        return;
      }
      // Finalize session after verification so user is authenticated
      const { error: finalErr } = await signUp.finalize();
      if (finalErr) {
        setError(finalErr.message || 'Failed to complete sign up.');
        return;
      }
      // Design your workforce & pay inside the studio — never here.
      router.push('/studio');
    } catch (err: unknown) {
      const msg = (err as { errors?: { message: string }[] })?.errors?.[0]?.message;
      setError(msg || 'Invalid code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-16">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.7) 0%, rgba(0,212,255,0.3) 60%, transparent 80%)' }}
        />
      </div>

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold tracking-tight text-white">
              NEXUS <span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {STEP_ORDER.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: step === s
                      ? 'linear-gradient(135deg,#6C63FF,#00D4FF)'
                      : STEP_ORDER.indexOf(step) > i
                        ? 'rgba(108,99,255,0.4)'
                        : 'rgba(255,255,255,0.06)',
                    color: step === s || STEP_ORDER.indexOf(step) > i
                      ? 'white'
                      : 'rgba(255,255,255,0.3)',
                    boxShadow: step === s ? '0 0 12px rgba(108,99,255,0.5)' : 'none',
                  }}
                >
                  {STEP_ORDER.indexOf(step) > i ? '✓' : i + 1}
                </div>
                {i < STEP_ORDER.length - 1 && <div className="w-8 h-px bg-white/10" />}
              </div>
            ))}
          </div>
          <p className="mt-3 text-text-secondary text-sm">
            {step === 'account' && 'Create your account'}
            {step === 'verify'  && 'Verify your email'}
          </p>
        </div>

        {/* ── STEP 1: Account ─────────────────────────────────────────── */}
        {step === 'account' && (
          <div
            className="rounded-2xl border border-white/10 p-8"
            style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}
          >
            <form onSubmit={handleCreateAccount} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">First name</label>
                  <input
                    value={firstName} onChange={e => setFirstName(e.target.value)} required
                    placeholder="John"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Last name</label>
                  <input
                    value={lastName} onChange={e => setLastName(e.target.value)} required
                    placeholder="Smith"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Work email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@company.com" autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Min 8 characters" autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
              )}

              <button
                type="submit" disabled={loading || !isReady}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#6C63FF 0%,#4fb6ff 100%)', boxShadow: '0 0 30px rgba(108,99,255,0.35)' }}
              >
                {loading ? 'Creating account…' : 'Continue'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-primary hover:text-secondary font-medium transition-colors">Sign in</Link>
            </p>
          </div>
        )}

        {/* ── STEP 2: Verify email ─────────────────────────────────────── */}
        {step === 'verify' && (
          <div
            className="rounded-2xl border border-white/10 p-8"
            style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)' }}>
                <span className="text-2xl">📧</span>
              </div>
              <p className="text-text-secondary text-sm">
                We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Verification code</label>
                <input
                  value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required
                  placeholder="000000" maxLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
              )}

              <button
                type="submit" disabled={loading || code.length < 6}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#6C63FF 0%,#4fb6ff 100%)', boxShadow: '0 0 30px rgba(108,99,255,0.35)' }}
              >
                {loading ? 'Verifying…' : 'Verify & enter studio'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
