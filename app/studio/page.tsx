'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Crown,
  Users,
  Plug,
  Headset,
  ShieldCheck,
  Lock,
  Loader2,
} from 'lucide-react';
import { CORE_PLANS, ADD_ONS, summarize, type Selection } from '@/components/studio/catalog';
import { defaultAgents, type DeployedAgent } from '@/components/studio/agent-catalog';
import OnboardStage from '@/components/studio/onboard-stage';
import DashboardStage from '@/components/studio/dashboard-stage';
import { getUser, signOut } from '@/lib/session';

const StudioCanvas = dynamic(() => import('@/components/studio/studio-canvas'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-bg-primary" />,
});

const ADDON_ICONS: Record<string, typeof Sparkles> = { Sparkles, Crown, Users, Plug, Headset };

type Stage = 'enter' | 'select' | 'customize' | 'review' | 'pay' | 'onboard' | 'dashboard';

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

export default function StudioPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [firstName, setFirstName] = useState('operator');

  const [stage, setStage] = useState<Stage>('enter');
  const [hovered, setHovered] = useState<number | null>(null);
  const [selection, setSelection] = useState<Selection>({ planId: null, addOnIds: [] });
  const [activating, setActivating] = useState(false);
  const [agents, setAgents] = useState<DeployedAgent[]>([]);

  useEffect(() => {
    // Open studio — directly shareable. If someone signed in, greet them by
    // name; otherwise just welcome them in (no gate).
    const user = getUser();
    if (user) setFirstName(user.firstName);
    setMounted(true);
  }, []);

  const selectedIndex = useMemo(
    () => (selection.planId ? CORE_PLANS.findIndex(p => p.id === selection.planId) : null),
    [selection.planId],
  );
  const order = useMemo(() => summarize(selection), [selection]);

  if (!mounted) {
    return (
      <div className="absolute inset-0 grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pickPlan = (i: number) => setSelection(s => ({ ...s, planId: CORE_PLANS[i].id }));

  const toggleAddOn = (id: string) =>
    setSelection(s => ({
      ...s,
      addOnIds: s.addOnIds.includes(id)
        ? s.addOnIds.filter(a => a !== id)
        : [...s.addOnIds, id],
    }));

  const handleActivate = () => {
    setActivating(true);
    // Simulated provisioning. Real Stripe Checkout drops in here — the only
    // place a card is ever collected.
    setTimeout(() => {
      setActivating(false);
      if (order.plan) setAgents(defaultAgents(order.plan.agentSlots));
      setStage('onboard');
    }, 1600);
  };

  const updateAgent = (id: string, patch: Partial<DeployedAgent>) =>
    setAgents(prev => prev.map(a => (a.id === id ? { ...a, ...patch } : a)));

  const resetWorkforce = () => {
    setSelection({ planId: null, addOnIds: [] });
    setAgents([]);
    setStage('select');
  };

  const showCrystals = stage === 'select';

  return (
    <div className="relative h-full w-full text-text-primary">
      <div className="absolute inset-0">
        <StudioCanvas
          selectedIndex={selectedIndex}
          hoveredIndex={hovered}
          onSelect={pickPlan}
          onHover={setHovered}
          showCrystals={showCrystals}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg-primary/70 via-transparent to-bg-primary/90" />

      <div
        className="pointer-events-none absolute left-8 top-7 z-20 text-lg font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-brand)' }}
      >
        NEXUS <span className="text-primary">STUDIO</span>
      </div>

      <AnimatePresence mode="wait">
        {/* ENTER */}
        {stage === 'enter' && (
          <motion.section
            key="enter"
            className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.8 }}
          >
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4 text-sm uppercase tracking-[0.35em] text-secondary"
            >
              Welcome back, {firstName}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="max-w-3xl text-5xl font-bold leading-[1.05] sm:text-7xl"
            >
              Step into your
              <br />
              <span className="bg-gradient-to-r from-secondary via-primary to-gold bg-clip-text text-transparent">
                AI workforce studio
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 max-w-xl text-text-secondary"
            >
              Design the team of autonomous employees you want to hire. Shape it, tune it, and
              only pay when it&apos;s exactly right.
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.68 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStage('select')}
              className="group mt-12 inline-flex items-center gap-3 rounded-full px-9 py-4 text-base font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg,#6C63FF 0%,#00D4FF 100%)',
                boxShadow: '0 0 50px rgba(108,99,255,0.5)',
              }}
            >
              Begin
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </motion.button>
            <p className="mt-6 text-xs text-text-tertiary">No card required to explore</p>
          </motion.section>
        )}

        {/* SELECT */}
        {stage === 'select' && (
          <motion.section
            key="select"
            className="absolute inset-0 z-10 flex flex-col justify-between px-6 py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.6 }}
          >
            <div className="pointer-events-none text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">Choose your core workforce</h2>
              <p className="mt-2 text-text-secondary">
                Tap a crystal to select it. You can add specialist services next.
              </p>
            </div>

            <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
              {CORE_PLANS.map((plan, i) => {
                const active = selection.planId === plan.id;
                return (
                  <motion.button
                    key={plan.id}
                    onClick={() => pickPlan(i)}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    whileHover={{ y: -6 }}
                    className="rounded-2xl border p-5 text-left backdrop-blur-xl transition-colors"
                    style={{
                      borderColor: active ? plan.color : 'rgba(255,255,255,0.08)',
                      background: active
                        ? `linear-gradient(160deg, ${plan.glow} -60%, rgba(255,255,255,0.04) 60%)`
                        : 'rgba(255,255,255,0.03)',
                      boxShadow: active ? `0 0 40px ${plan.glow}` : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-semibold uppercase tracking-[0.2em]"
                        style={{ color: plan.color }}
                      >
                        {plan.name}
                      </span>
                      {active && (
                        <span
                          className="grid h-6 w-6 place-items-center rounded-full"
                          style={{ background: plan.color }}
                        >
                          <Check className="h-4 w-4 text-black" />
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">{plan.tagline}</p>
                    <p className="mt-4 text-3xl font-bold">
                      {money(plan.price)}
                      <span className="text-base font-normal text-text-tertiary">/{plan.cadence}</span>
                    </p>
                    <ul className="mt-4 space-y-1.5">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                          <Check className="h-3.5 w-3.5" style={{ color: plan.color }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </motion.button>
                );
              })}
            </div>

            <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
              <button
                onClick={() => setStage('enter')}
                className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                disabled={!selection.planId}
                onClick={() => setStage('customize')}
                className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#6C63FF,#00D4FF)' }}
              >
                Customize <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.section>
        )}

        {/* CUSTOMIZE */}
        {stage === 'customize' && (
          <StagePanel
            key="customize"
            title="Add specialist services"
            subtitle="Optional upgrades that stack on your plan. Toggle what you need."
            onBack={() => setStage('select')}
            onNext={() => setStage('review')}
            nextLabel="Review order"
            order={order}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ADD_ONS.map(a => {
                const Icon = ADDON_ICONS[a.icon] ?? Sparkles;
                const on = selection.addOnIds.includes(a.id);
                return (
                  <motion.button
                    key={a.id}
                    onClick={() => toggleAddOn(a.id)}
                    whileHover={{ y: -3 }}
                    className="flex items-start gap-4 rounded-2xl border p-4 text-left backdrop-blur-xl transition-colors"
                    style={{
                      borderColor: on ? 'rgba(108,99,255,0.8)' : 'rgba(255,255,255,0.08)',
                      background: on ? 'rgba(108,99,255,0.12)' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <span
                      className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                      style={{ background: on ? '#6C63FF' : 'rgba(255,255,255,0.06)' }}
                    >
                      <Icon className="h-5 w-5" style={{ color: on ? '#fff' : '#8890A0' }} />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{a.name}</span>
                        <span className="whitespace-nowrap text-sm font-semibold text-secondary">
                          +{money(a.price)}
                          <span className="text-text-tertiary">{a.cadence === 'mo' ? '/mo' : ' once'}</span>
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">{a.description}</p>
                    </div>
                    <span
                      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border"
                      style={{
                        borderColor: on ? '#6C63FF' : 'rgba(255,255,255,0.2)',
                        background: on ? '#6C63FF' : 'transparent',
                      }}
                    >
                      {on && <Check className="h-3.5 w-3.5 text-white" />}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </StagePanel>
        )}

        {/* REVIEW */}
        {stage === 'review' && (
          <StagePanel
            key="review"
            title="Review your workforce"
            subtitle="Here's everything you've assembled. Nothing is charged yet."
            onBack={() => setStage('customize')}
            onNext={() => setStage('pay')}
            nextLabel="Continue to payment"
            order={order}
          >
            <div className="space-y-3">
              {order.plan && (
                <Row
                  label={`${order.plan.name} plan`}
                  sub={order.plan.tagline}
                  value={`${money(order.plan.price)}/mo`}
                  color={order.plan.color}
                />
              )}
              {order.addOns.map(a => (
                <Row
                  key={a.id}
                  label={a.name}
                  sub={a.description}
                  value={`+${money(a.price)}${a.cadence === 'mo' ? '/mo' : ' once'}`}
                />
              ))}
              {order.addOns.length === 0 && (
                <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-text-secondary">
                  No add-ons selected — a clean, focused setup. You can always add more later.
                </p>
              )}
            </div>
          </StagePanel>
        )}

        {/* PAY */}
        {stage === 'pay' && (
          <motion.section
            key="pay"
            className="absolute inset-0 z-10 flex items-center justify-center px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-2xl">
              <div className="mb-6 flex items-center gap-2 text-secondary">
                <Lock className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em]">Secure checkout</span>
              </div>
              <h2 className="text-2xl font-bold">Confirm &amp; activate</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Review your total, then activate your workforce.
              </p>

              <div className="my-6 space-y-2 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Recurring</span>
                  <span className="font-semibold">{money(order.monthly)}/mo</span>
                </div>
                {order.oneTime > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">One-time setup</span>
                    <span className="font-semibold">{money(order.oneTime)}</span>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="font-semibold">Due today</span>
                  <span className="text-2xl font-bold text-white">{money(order.dueToday)}</span>
                </div>
              </div>

              <button
                onClick={handleActivate}
                disabled={activating}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-white transition disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg,#6C63FF,#00D4FF)',
                  boxShadow: '0 0 40px rgba(108,99,255,0.45)',
                }}
              >
                {activating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Provisioning your workforce…
                  </>
                ) : (
                  <>
                    Activate workforce · {money(order.dueToday)} <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-text-tertiary">
                <ShieldCheck className="h-3.5 w-3.5" /> Payments secured by Stripe · Cancel anytime
              </div>
              <button
                onClick={() => setStage('review')}
                className="mt-4 w-full text-center text-sm text-text-secondary hover:text-white"
              >
                Back to review
              </button>
            </div>
          </motion.section>
        )}

        {/* ONBOARD */}
        {stage === 'onboard' && order.plan && (
          <OnboardStage key="onboard" plan={order.plan} agents={agents} onChange={updateAgent} onDeploy={() => setStage('dashboard')} />
        )}

        {/* DASHBOARD */}
        {stage === 'dashboard' && order.plan && (
          <DashboardStage
            key="dashboard"
            plan={order.plan}
            agents={agents}
            order={order}
            onReset={resetWorkforce}
            onSignOut={() => {
              signOut();
              router.push('/');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Shared presentational bits ─────────────────────────────────────── */

function StagePanel({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel,
  order,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  order: ReturnType<typeof summarize>;
}) {
  return (
    <motion.section
      className="absolute inset-0 z-10 flex items-center justify-center px-6 py-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[1fr_300px]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-2xl">
          <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          <p className="mb-6 mt-1 text-text-secondary">{subtitle}</p>
          {children}
          <div className="mt-7 flex items-center justify-between">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#6C63FF,#00D4FF)' }}
            >
              {nextLabel} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <aside className="hidden self-start rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-secondary">Your build</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Plan</span>
              <span className="font-semibold">{order.plan?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Add-ons</span>
              <span className="font-semibold">{order.addOns.length}</span>
            </div>
          </div>
          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Monthly</span>
              <span className="font-semibold">{money(order.monthly)}</span>
            </div>
            {order.oneTime > 0 && (
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-text-secondary">One-time</span>
                <span className="font-semibold">{money(order.oneTime)}</span>
              </div>
            )}
            <div className="mt-3 flex items-baseline justify-between">
              <span className="font-semibold">Due today</span>
              <span className="text-xl font-bold">{money(order.dueToday)}</span>
            </div>
          </div>
        </aside>
      </div>
    </motion.section>
  );
}

function Row({
  label,
  sub,
  value,
  color,
}: {
  label: string;
  sub?: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color ?? '#6C63FF' }} />
        <div>
          <p className="font-semibold">{label}</p>
          {sub && <p className="text-xs text-text-secondary">{sub}</p>}
        </div>
      </div>
      <span className="whitespace-nowrap font-semibold text-secondary">{value}</span>
    </div>
  );
}
