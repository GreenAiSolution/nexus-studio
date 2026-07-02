"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Clock, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function TaskHistory() {
  const taskStats = trpc.tasks.getStats.useQuery();

  if (taskStats.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  const data = taskStats.data;
  if (!data) return null;

  const successRate = typeof data.successRate === 'number' ? data.successRate : 0;
  const failureRate = 100 - successRate;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg p-4 border border-border bg-bg-secondary/30">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-xs text-text-secondary font-semibold uppercase">Total</p>
          </div>
          <p className="text-2xl font-bold">{data.total}</p>
        </div>

        <div className="rounded-lg p-4 border border-border bg-bg-secondary/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <p className="text-xs text-text-secondary font-semibold uppercase">Success</p>
          </div>
          <p className="text-2xl font-bold text-success">{data.completed}</p>
        </div>

        <div className="rounded-lg p-4 border border-border bg-bg-secondary/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-error" />
            <p className="text-xs text-text-secondary font-semibold uppercase">Failed</p>
          </div>
          <p className="text-2xl font-bold text-error">{data.failed}</p>
        </div>

        <div className="rounded-lg p-4 border border-border bg-bg-secondary/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-secondary" />
            <p className="text-xs text-text-secondary font-semibold uppercase">Success Rate</p>
          </div>
          <p className={`text-2xl font-bold ${successRate >= 90 ? "text-success" : "text-warning"}`}>
            {successRate}%
          </p>
        </div>
      </div>

      {/* Success/Failure Breakdown */}
      {data.total > 0 && (
        <div className="rounded-lg p-4 border border-border bg-bg-secondary/30">
          <p className="text-sm font-semibold mb-3 text-text-secondary">Success Breakdown</p>
          <div className="space-y-2">
            {/* Success Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Successful</span>
                <span className="font-semibold text-success">{successRate}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-success transition-all"
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>

            {/* Failure Bar */}
            {failureRate > 0 && (
              <div className="space-y-1 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Failed</span>
                  <span className="font-semibold text-error">{failureRate}%</span>
                </div>
                <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-error transition-all"
                    style={{ width: `${failureRate}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Time-based Stats */}
      {data.avgDuration !== undefined && (
        <div className="rounded-lg p-4 border border-border bg-bg-secondary/30">
          <p className="text-sm font-semibold mb-3 text-text-secondary">Performance Metrics</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Avg Task Duration</span>
              <span className="font-semibold">{data.avgDuration.toFixed(2)}s</span>
            </div>
            {data.running > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Currently Running</span>
                <span className="font-semibold text-primary">{data.running}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {data.total === 0 && (
        <div className="rounded-lg p-8 border border-dashed border-border bg-bg-secondary/20 text-center">
          <p className="text-text-secondary">No tasks executed yet.</p>
          <p className="text-sm text-text-tertiary">
            Create an agent and trigger a task to see execution history.
          </p>
        </div>
      )}
    </motion.div>
  );
}
