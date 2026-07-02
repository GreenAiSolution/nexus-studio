"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, TrendingUp, Clock, Zap, Activity, Settings } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

export default function DashboardPage() {
  const { isLoaded, userId } = useAuth();
  const tasksStats = trpc.tasks.getStats.useQuery();
  const agentsList = trpc.agents.list.useQuery();
  const subscriptionUsage = trpc.subscription.getUsage.useQuery();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!userId) {
    redirect("/sign-in");
  }

  const isLoading = tasksStats.isLoading || agentsList.isLoading || subscriptionUsage.isLoading;

  const activeAgents = agentsList.data?.filter(a => a.status === 'ACTIVE').length ?? 0;
  const tasksToday = tasksStats.data?.total ?? 0;
  const connectedIntegrations = subscriptionUsage.data?.integrations ?? 0;

  const stats = [
    {
      label: "Active Agents",
      value: isLoading ? "..." : activeAgents.toString(),
      icon: Zap,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Tasks Today",
      value: isLoading ? "..." : tasksToday.toString(),
      icon: Activity,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      label: "Integrations",
      value: isLoading ? "..." : connectedIntegrations.toString(),
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Success Rate",
      value: isLoading ? "..." : tasksStats.data?.successRate ? `${Math.round(tasksStats.data.successRate * 100)}%` : "0%",
      icon: Clock,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-text-2">Manage your AI agents and automations.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid md:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="rounded-xl p-6 border border-border bg-surface/40 backdrop-blur hover:border-primary/50 transition"
              >
                <div className={`${stat.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className="text-text-2 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 mb-12"
        >
          <Link href="/dashboard/agents/new">
            <div className="group rounded-xl p-8 border-2 border-dashed border-primary/50 bg-primary/5 hover:border-primary hover:bg-primary/10 transition cursor-pointer h-full flex flex-col items-center justify-center text-center gap-4">
              <div className="p-4 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Create New Agent</h3>
                <p className="text-text-2 text-sm">Build your first AI agent</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/integrations">
            <div className="group rounded-xl p-8 border-2 border-dashed border-secondary/50 bg-secondary/5 hover:border-secondary hover:bg-secondary/10 transition cursor-pointer h-full flex flex-col items-center justify-center text-center gap-4">
              <div className="p-4 rounded-lg bg-secondary/20 group-hover:bg-secondary/30 transition">
                <Settings className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Connect Tools</h3>
                <p className="text-text-2 text-sm">Add integrations</p>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-xl p-8 border border-border bg-surface/40 backdrop-blur"
        >
          <h2 className="text-2xl font-bold mb-6">Task Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-text-secondary text-sm">Total Tasks</p>
              <p className="text-2xl font-bold">{isLoading ? "..." : tasksStats.data?.total ?? 0}</p>
            </div>
            <div>
              <p className="text-text-secondary text-sm">Completed</p>
              <p className="text-2xl font-bold text-success">{isLoading ? "..." : tasksStats.data?.completed ?? 0}</p>
            </div>
            <div>
              <p className="text-text-secondary text-sm">Running</p>
              <p className="text-2xl font-bold text-secondary">{isLoading ? "..." : tasksStats.data?.running ?? 0}</p>
            </div>
            <div>
              <p className="text-text-secondary text-sm">Failed</p>
              <p className="text-2xl font-bold text-error">{isLoading ? "..." : tasksStats.data?.failed ?? 0}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
