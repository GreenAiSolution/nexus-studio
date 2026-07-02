"use client";

import { motion } from "framer-motion";
import { TrendingUp, AlertCircle, Zap, DollarSign } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function DashboardMetrics() {
  const usage = trpc.subscription.getUsage.useQuery();
  const costMetrics = trpc.costs.getCostMetrics.useQuery();

  if (usage.isLoading || costMetrics.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  const data = {
    usage: usage.data,
    costs: costMetrics.data,
  };

  if (!data.usage) return null;

  const agentsPercentage =
    data.usage.agents.limit === -1
      ? 100
      : Math.round((data.usage.agents.used / data.usage.agents.limit) * 100);

  const integrationsPercentage =
    data.usage.integrations.limit === -1
      ? 100
      : Math.round((data.usage.integrations.used / data.usage.integrations.limit) * 100);

  const tasksPercentage =
    data.usage.tasksThisMonth.limit === -1
      ? Math.min(100, Math.round((data.usage.tasksThisMonth.used / 1000) * 100))
      : Math.round((data.usage.tasksThisMonth.used / data.usage.tasksThisMonth.limit) * 100);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "text-error";
    if (percentage >= 70) return "text-warning";
    return "text-success";
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Usage Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Agents Usage */}
        <div className="rounded-lg p-4 border border-border bg-bg-secondary/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-text-secondary">Agents</p>
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold mb-2">
            {data.usage.agents.used}
            {data.usage.agents.limit !== -1 && <span className="text-sm text-text-secondary">/{data.usage.agents.limit}</span>}
          </p>
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                agentsPercentage >= 90 ? "bg-error" : agentsPercentage >= 70 ? "bg-warning" : "bg-success"
              }`}
              style={{ width: `${Math.min(agentsPercentage, 100)}%` }}
            />
          </div>
          <p className={`text-xs mt-2 ${getStatusColor(agentsPercentage)}`}>
            {agentsPercentage}% used
          </p>
        </div>

        {/* Integrations Usage */}
        <div className="rounded-lg p-4 border border-border bg-bg-secondary/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-text-secondary">Integrations</p>
            <TrendingUp className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-2xl font-bold mb-2">
            {data.usage.integrations.used}
            {data.usage.integrations.limit !== -1 && (
              <span className="text-sm text-text-secondary">/{data.usage.integrations.limit}</span>
            )}
          </p>
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                integrationsPercentage >= 90
                  ? "bg-error"
                  : integrationsPercentage >= 70
                    ? "bg-warning"
                    : "bg-success"
              }`}
              style={{ width: `${Math.min(integrationsPercentage, 100)}%` }}
            />
          </div>
          <p className={`text-xs mt-2 ${getStatusColor(integrationsPercentage)}`}>
            {integrationsPercentage}% used
          </p>
        </div>

        {/* Tasks This Month */}
        <div className="rounded-lg p-4 border border-border bg-bg-secondary/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-text-secondary">Tasks (30d)</p>
            <AlertCircle className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-bold mb-2">
            {data.usage.tasksThisMonth.used}
            {data.usage.tasksThisMonth.limit !== -1 && (
              <span className="text-sm text-text-secondary">/{data.usage.tasksThisMonth.limit}</span>
            )}
          </p>
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                tasksPercentage >= 90 ? "bg-error" : tasksPercentage >= 70 ? "bg-warning" : "bg-success"
              }`}
              style={{ width: `${Math.min(tasksPercentage, 100)}%` }}
            />
          </div>
          <p className={`text-xs mt-2 ${getStatusColor(tasksPercentage)}`}>
            {tasksPercentage}% used
          </p>
        </div>
      </div>

      {/* Cost Metrics */}
      {data.costs && (
        <div className="rounded-lg p-4 border border-border bg-bg-secondary/30">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-gold" />
            <p className="text-sm font-semibold text-text-secondary">Cost Summary</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-tertiary mb-1">This Month</p>
              <p className="text-2xl font-bold text-gold">
                ${data.costs.monthlySpend.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary mb-1">Budget Remaining</p>
              <p className={`text-2xl font-bold ${data.costs.remainingBudget >= 0 ? "text-success" : "text-error"}`}>
                ${data.costs.remainingBudget.toFixed(2)}
              </p>
            </div>
          </div>
          {data.costs.estimatedMonthEnd && (
            <p className="text-xs text-text-tertiary mt-3">
              Estimated end-of-month spend: ${data.costs.estimatedMonthEnd.toFixed(2)}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
