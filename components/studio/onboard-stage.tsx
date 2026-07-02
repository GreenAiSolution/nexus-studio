'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Handshake,
  Headset,
  Search,
  PenTool,
  Settings2,
  BarChart3,
} from 'lucide-react';
import type { CorePlan } from './catalog';
import { AGENT_ROLES, roleById, type DeployedAgent } from './agent-catalog';

const ROLE_ICONS: Record<string, typeof Handshake> = {
  Handshake,
  Headset,
  Search,
  PenTool,
  Settings2,
  BarChart3,
};

export default function OnboardStage({
  plan,
  agents,
  onChange,
  onDeploy,
}: {
  plan: CorePlan;
  agents: DeployedAgent[];
  onChange: (id: string, patch: Partial<DeployedAgent>) => void;
  onDeploy: () => void;
}) {
  return (
    <motion.section
      className="absolute inset-0 z-10 flex items-center justify-center overflow-y-auto px-6 py-10"
      style={{ paddingTop: '6rem' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-4xl">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: plan.color }}>
          <CheckCircle2 className="h-4 w-4" /> Payment confirmed
        </div>
        <h2 className="text-2xl font-bold sm:text-3xl">Configure your workforce</h2>
        <p className="mb-8 mt-1 text-text-secondary">
          Give each teammate a name and a role. You can change this anytime.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {agents.map((agent, i) => {
            const role = roleById(agent.roleId);
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
                    style={{ background: plan.color }}
                  >
                    {agent.name.slice(0, 2).toUpperCase()}
                  </span>
                  <input
                    value={agent.name}
                    onChange={e => onChange(agent.id, { name: e.target.value })}
                    placeholder="Agent name"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white placeholder-white/25 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Role — {role.tagline}
                </p>
                <div className="flex flex-wrap gap-2">
                  {AGENT_ROLES.map(r => {
                    const Icon = ROLE_ICONS[r.icon] ?? Handshake;
                    const active = r.id === agent.roleId;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onChange(agent.id, { roleId: r.id })}
                        title={r.name}
                        className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          borderColor: active ? plan.color : 'rgba(255,255,255,0.12)',
                          background: active ? `${plan.color}22` : 'transparent',
                          color: active ? '#fff' : '#8890A0',
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-end">
          <button
            onClick={onDeploy}
            className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white"
            style={{
              background: `linear-gradient(135deg, ${plan.color}, #00D4FF)`,
              boxShadow: `0 0 40px ${plan.glow}`,
            }}
          >
            Deploy workforce <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.section>
  );
}
