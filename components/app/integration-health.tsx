"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Clock, RefreshCw, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { Integration } from "@prisma/client";

interface IntegrationHealthProps {
  integration: Integration;
}

export function IntegrationHealth({ integration }: IntegrationHealthProps) {
  const health = trpc.integrations.getHealth.useQuery(
    { integrationId: integration.id },
    { refetchInterval: 30000 } // Refresh every 30s
  );

  const syncNow = trpc.integrations.syncNow.useMutation({
    onSuccess: () => {
      health.refetch();
    },
  });

  if (health.isLoading) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div>
      </div>
    );
  }

  const data = health.data;
  if (!data) return null;

  const isHealthy = data.isHealthy;
  const lastSyncMinutesAgo = data.lastSyncAt
    ? Math.floor((Date.now() - new Date(data.lastSyncAt).getTime()) / 60000)
    : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Status Row */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-bg-secondary/30 border border-border">
        <div className="flex items-center gap-3">
          {isHealthy ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <AlertCircle className="w-5 h-5 text-warning" />
          )}
          <div>
            <p className="text-sm font-semibold">
              {isHealthy ? "Healthy" : "Issues Detected"}
            </p>
            <p className="text-xs text-text-secondary">
              {lastSyncMinutesAgo !== null
                ? `Last sync: ${lastSyncMinutesAgo}m ago`
                : "Never synced"}
            </p>
          </div>
        </div>

        <button
          onClick={() => syncNow.mutate({ integrationId: integration.id })}
          disabled={syncNow.isPending}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition text-sm font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${syncNow.isPending ? "animate-spin" : ""}`} />
          {syncNow.isPending ? "Syncing..." : "Sync Now"}
        </button>
      </div>

      {/* Error Display */}
      {data.lastError && (
        <div className="p-4 rounded-lg bg-error/10 border border-error/30">
          <p className="text-sm font-semibold text-error mb-1">Last Error</p>
          <p className="text-xs text-error/80 font-mono">{data.lastError}</p>
        </div>
      )}

      {/* Error Count & Active Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-bg-secondary/30 border border-border">
          <p className="text-xs text-text-secondary mb-1">Status</p>
          <p className="text-lg font-bold text-primary">
            {data.isActive ? "Active" : "Inactive"}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-bg-secondary/30 border border-border">
          <p className="text-xs text-text-secondary mb-1">Errors</p>
          <p className="text-lg font-bold text-warning">
            {data.errorCount}
          </p>
        </div>
      </div>

      {/* Recent Syncs */}
      {data.recentSyncs && data.recentSyncs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-secondary uppercase">Recent Syncs</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {data.recentSyncs.map((sync, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs p-2 rounded bg-bg-secondary/20 border border-border/30"
              >
                <div className="flex items-center gap-2">
                  {sync.status === "succeeded" ? (
                    <CheckCircle className="w-3 h-3 text-success" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-error" />
                  )}
                  <span className="text-text-secondary">
                    {sync.completedAt
                      ? new Date(sync.completedAt).toLocaleTimeString()
                      : "Running..."}
                  </span>
                </div>
                {sync.recordsSynced > 0 && (
                  <span className="text-text-tertiary">
                    {sync.recordsSynced} records
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
