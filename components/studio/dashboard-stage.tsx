'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Handshake,
  Headset,
  PenTool,
  Plug,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  LogOut,
} from 'lucide-react';
import type { CorePlan, summarize } from './catalog';
import { roleById, type DeployedAgent } from './agent-catalog';

const ROLE_ICONS: Record<string, typeof Handshake> = {
  Handshake,
  Headset,
  Search,
  PenTool,
  Settings2,
  BarChart3,
};

interface AgentStat {
  tasks: number;
  lastAction: string;
  pulse: number;
}

interface FeedEntry {
  id: number;
  time: string;
  agentName: string;
  text: string;
}

function formatClock(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function DashboardStage({
  plan,
  agents,
  order,
  onReset,
  onSignOut,
}: {
  plan: CorePlan;
  agents: DeployedAgent[];
  order: ReturnType<typeof summarize>;
  onReset: () => void;
  onSignOut: () => void;
}) {
  const [stats, setStats] = useState<Record<string, AgentStat>>(() =>
    Object.fromEntries(agents.map(a => [a.id, { tasks: Math.floor(Math.random() * 4), lastAction: 'Coming online…', pulse: 0 }])),
  );
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const feedId = useRef(0);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const clock = setInterval(() => setElapsed(Date.now() - startedAt.current), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (agents.length === 0) return;
    const work = setInterval(() => {
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const role = roleById(agent.roleId);
      const line = role.activity[Math.floor(Math.random() * role.activity.length)];

      setStats(prev => ({
        ...prev,
        [agent.id]: {
          tasks: (prev[agent.id]?.tasks ?? 0) + 1,
          lastAction: line,
          pulse: (prev[agent.id]?.pulse ?? 0) + 1,
        },
      }));

      feedId.current += 1;
      setFeed(prev => [
        { id: feedId.current, time: new Date().toLocaleTimeString(), agentName: agent.name, text: line },
        ...prev,
      ].slice(0, 10));
    }, 2200);
    return () => clearInterval(work);
  }, [agents]);

  const totalTasks = Object.values(stats).reduce((s, a) => s + a.tasks, 0);
  const integrations = order.addOns.length + (plan.id === 'RECRUIT' ? 3 : plan.id === 'OPERATOR' ? 10 : 15);

  return (
    <motion.section
      className="absolute inset-0 z-10 overflow-y-auto px-6 py-10"
      style={{ paddingTop: '6rem' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: plan.color }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: plan.color }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: plan.color }} />
              </span>
              {plan.name} workforce · live
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">Your workforce is live</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" /> Design another
            </button>
            <button
              onClick={onSignOut}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>

        {/* Stat strip */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Sparkles} label="Active Agents" value={String(agents.length)} color={plan.color} />
          <StatCard icon={Activity} label="Tasks Completed" value={String(totalTasks)} color={plan.color} />
          <StatCard icon={Plug} label="Integrations" value={String(integrations)} color={plan.color} />
          <StatCard icon={BarChart3} label="Live For" value={formatClock(elapsed)} color={plan.color} mono />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Agent grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {agents.map((agent, i) => {
              const role = roleById(agent.roleId);
              const Icon = ROLE_ICONS[role.icon] ?? Handshake;
              const s = stats[agent.id];
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
                      style={{ background: plan.color }}
                    >
                      {agent.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">{agent.name}</p>
                        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
                        </span>
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <Icon className="h-3 w-3" /> {role.name}
                      </p>
                    </div>
                    <span className="shrink-0 text-right">
                      <span className="block text-lg font-bold leading-none">{s?.tasks ?? 0}</span>
                      <span className="block text-[10px] text-text-tertiary">tasks</span>
                    </span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={s?.lastAction}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 truncate rounded-lg bg-black/20 px-3 py-2 text-xs text-text-secondary"
                    >
                      {agent.name} {s?.lastAction}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Activity feed */}
          <aside className="hidden self-start rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl lg:block">
            <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-secondary">
              <Activity className="h-3.5 w-3.5" /> Live activity
            </p>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {feed.length === 0 && (
                  <p className="text-sm text-text-tertiary">Waiting for the first task…</p>
                )}
                {feed.map(entry => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="border-l-2 pl-3 text-sm"
                    style={{ borderColor: plan.color }}
                  >
                    <p className="text-text-secondary">
                      <span className="font-semibold text-white">{entry.agentName}</span> {entry.text}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-tertiary">{entry.time}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </aside>
        </div>
      </div>
    </motion.section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  mono,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
  color: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
      <Icon className="mb-2 h-4 w-4" style={{ color }} />
      <p className={`text-xl font-bold ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</p>
      <p className="text-xs text-text-secondary">{label}</p>
    </div>
  );
}
