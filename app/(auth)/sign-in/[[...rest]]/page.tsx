'use client';

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

type Mode = 'password' | 'reset-request' | 'reset-confirm';

export default function SignInPage() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isReady = fetchStatus === 'idle';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReady) return;
    setLoading(true);
    setError('');

    try {
      const { error: pwErr } = await signIn.password({ emailAddress: email, password });
      if (pwErr) {
        setError(pwErr.message || 'Invalid email or password.');
        return;
      }
      const { error: finalErr } = await signIn.finalize();
      if (finalErr) {
        setError(finalErr.message || 'Failed to complete sign in.');
        return;
      }
      router.push('/studio');
    } catch (err: unknown) {
      const msg = (err as { errors?: { message: string }[] })?.errors?.[0]?.message;
      setError(msg || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReady) return;
    setLoading(true);
    setError('');
    try {
      const { error: createErr } = await signIn.create({ identifier: email });
      if (createErr) {
        setError(createErr.message || 'Could not find an account with that email.');
        return;
      }
      const { error: sendErr } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendErr) {
        setError(sendErr.message || 'Failed to send reset code.');
        return;
      }
      setMode('reset-confirm');
    } catch (err: unknown) {
      const msg = (err as { errors?: { message: string }[] })?.errors?.[0]?.message;
      setError(msg || 'Could not find an account with that email.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReady) return;
    setLoading(true);
    setError('');
    try {
      const { error: verifyErr } = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (verifyErr) {
        setError(verifyErr.message || 'Invalid code. Please check your email.');
        return;
      }
      const { error: submitErr } = await signIn.resetPasswordEmailCode.submitPassword({ password: newPassword });
      if (submitErr) {
        setError(submitErr.message || 'Failed to reset password.');
        return;
      }
      const { error: finalErr } = await signIn.finalize();
      if (finalErr) {
        setError(finalErr.message || 'Failed to complete sign in.');
        return;
      }
      router.push('/studio');
    } catch (err: unknown) {
      const msg = (err as { errors?: { message: string }[] })?.errors?.[0]?.message;
      setError(msg || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.7) 0%, rgba(0,212,255,0.3) 60%, transparent 80%)' }}
        />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold tracking-tight text-white">
              NEXUS <span className="text-primary">AI</span>
            </span>
          </Link>
          <p className="mt-3 text-text-secondary text-sm">
            {mode === 'password' && 'Sign in to your account'}
            {mode === 'reset-request' && 'Reset your password'}
            {mode === 'reset-confirm' && `Enter the code sent to ${email}`}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-white/10 p-8"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}
        >
          {mode === 'password' && (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-text-secondary">Password</label>
                    <button
                      type="button"
                      onClick={() => { setError(''); setMode('reset-request'); }}
                      className="text-xs text-primary hover:text-secondary transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !isReady}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: loading
                      ? 'rgba(108,99,255,0.5)'
                      : 'linear-gradient(135deg, #6C63FF 0%, #4fb6ff 100%)',
                    boxShadow: loading ? 'none' : '0 0 30px rgba(108,99,255,0.4)',
                  }}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-text-secondary">
                  Don&apos;t have an account?{' '}
                  <Link href="/sign-up" className="text-primary hover:text-secondary font-medium transition-colors">
                    Create one free
                  </Link>
                </p>
              </div>
            </>
          )}

          {mode === 'reset-request' && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isReady}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: loading
                    ? 'rgba(108,99,255,0.5)'
                    : 'linear-gradient(135deg, #6C63FF 0%, #4fb6ff 100%)',
                  boxShadow: loading ? 'none' : '0 0 30px rgba(108,99,255,0.4)',
                }}
              >
                {loading ? 'Sending code…' : 'Send reset code'}
              </button>

              <button
                type="button"
                onClick={() => { setError(''); setMode('password'); }}
                className="w-full text-center text-sm text-text-secondary hover:text-white transition-colors"
              >
                Back to sign in
              </button>
            </form>
          )}

          {mode === 'reset-confirm' && (
            <form onSubmit={handleConfirmReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Verification code
                </label>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isReady || code.length < 6}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: loading
                    ? 'rgba(108,99,255,0.5)'
                    : 'linear-gradient(135deg, #6C63FF 0%, #4fb6ff 100%)',
                  boxShadow: loading ? 'none' : '0 0 30px rgba(108,99,255,0.4)',
                }}
              >
                {loading ? 'Resetting…' : 'Reset password & sign in'}
              </button>

              <button
                type="button"
                onClick={() => { setError(''); setMode('password'); }}
                className="w-full text-center text-sm text-text-secondary hover:text-white transition-colors"
              >
                Back to sign in
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-white/20">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}
