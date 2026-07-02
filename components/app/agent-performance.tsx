"use client";

import { motion } from "framer-motion";
import { BarChart, TrendingUp, Activity, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Link from "next/link";

export function AgentPerformance() {
  const agents = trpc.agents.list.useQuery();

  if (agents.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  const data = agents.data || [];

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-lg p-8 border border-dashed border-border bg-bg-secondary/20 text-center"
      >
        <Activity className="w-12 h-12 text-text-tertiary mx-auto mb-3 opacity-50" />
        <p className="text-text-secondary mb-2">No agents yet</p>
        <Link
          href="/dashboard/agents/new"
          className="text-sm text-primary hover:underline font-semibold"
        >
          Create your first agent →
        </Link>
      </motion.div>
    );
  }

  const activeAgents = data.filter((a) => a.status === "ACTIVE");
  const draftAgents = data.filter((a) => a.status === "DRAFT");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Agent Status Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-lg p-4 border border-border bg-bg-secondary/30">
          <div className="flex items-center gap-2 mb-2">
            <BarChart className="w-4 h-4 text-primary" />
            <p className="text-xs text-text-secondary font-semibold uppercase">Total</p>
          </div>
          <p className="text-2xl font-bold">{data.length}</p>
        </div>

        <div className="rounded-lg p-4 border border-border bg-bg-secondary/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <p className="text-xs text-text-secondary font-semibold uppercase">Active</p>
          </div>
          <p className="text-2xl font-bold text-success">{activeAgents.length}</p>
        </div>

        <div className="rounded-lg p-4 border border-border bg-bg-secondary/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-warning" />
            <p className="text-xs text-text-secondary font-semibold uppercase">Draft</p>
          </div>
          <p className="text-2xl font-bold text-warning">{draftAgents.length}</p>
        </div>
      </div>

      {/* Agent List */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-secondary uppercase mb-3">Your Agents</p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {data.map((agent) => (
            <Link key={agent.id} href={`/dashboard/agents/${agent.id}`}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 4 }}
                className="p-4 rounded-lg border border-border bg-bg-secondary/30 hover:border-primary/50 hover:bg-bg-secondary/50 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-text-primary">{agent.name}</h4>
                    <p className="text-xs text-text-secondary">{agent.role}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      agent.status === "ACTIVE"
                        ? "bg-success/20 text-success"
                        : agent.status === "DRAFT"
                          ? "bg-warning/20 text-warning"
                          : "bg-border text-text-tertiary"
                    }`}
                  >
                    {agent.status}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-text-secondary">
                    Model: <span className="text-text-primary font-semibold">{agent.model}</span>
                  </div>
                  {agent.lastRun && (
                    <div className="text-text-secondary">
                      Last: <span className="text-text-primary font-semibold">
                        {new Date(agent.lastRun).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {agent.nextRun && (
                    <div className="text-text-secondary">
                      Next: <span className="text-text-primary font-semibold">
                        {new Date(agent.nextRun).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {agent.isRunning && (
                  <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Running
                  </div>
                )}
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
