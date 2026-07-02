"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { CheckCircle, ArrowRight, Loader, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";

const TIERS = [
  {
    name: "RECRUIT" as const,
    price: 97,
    features: ["1 Agent", "3 Integrations", "500 runs/mo", "Email support"],
  },
  {
    name: "OPERATOR" as const,
    price: 497,
    features: ["5 Agents", "10 Integrations", "5,000 runs/mo", "Priority support"],
  },
  {
    name: "EMPIRE" as const,
    price: 2497,
    features: ["Unlimited Agents", "All 15+ Tools", "Unlimited runs", "Dedicated manager"],
  },
];

export default function BillingPage() {
  const { isLoaded, userId } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const currentSub = trpc.subscription.getCurrent.useQuery();
  const usage = trpc.subscription.getUsage.useQuery();
  const upgradeTier = trpc.subscription.upgradeTier.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['subscription', 'getCurrent']] });
      queryClient.invalidateQueries({ queryKey: [['subscription', 'getUsage']] });
    },
  });

  if (!isLoaded) return <div>Loading...</div>;
  if (!userId) redirect("/sign-in");

  const currentPlan = currentSub.data?.tier || "RECRUIT";
  const isLoading = currentSub.isLoading || usage.isLoading;

  const handleUpgrade = async (tier: "RECRUIT" | "OPERATOR" | "EMPIRE") => {
    setError("");
    try {
      await upgradeTier.mutateAsync({ tier });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upgrade");
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-4xl font-bold mb-2">Billing & Plan</h1>
          <p className="text-text-secondary mb-12">Manage your subscription and usage</p>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {/* Current Plan */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="mb-12 rounded-xl p-8 border border-border bg-bg-secondary/50 backdrop-blur">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Current Plan: {currentPlan}</h2>
                    <p className="text-3xl font-bold text-primary">
                      ${TIERS.find((t) => t.name === currentPlan)?.price}/month
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-text-secondary text-sm mb-1">Next billing date</p>
                    <p className="font-medium">
                      {currentSub.data?.currentPeriodEnd
                        ? new Date(currentSub.data.currentPeriodEnd).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Usage Meters */}
              <h2 className="text-2xl font-bold mb-6">Usage & Limits</h2>
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="rounded-xl p-6 border border-border bg-bg-secondary/50 backdrop-blur">
                  <p className="text-text-secondary text-sm mb-2">Agents</p>
                  <p className="text-3xl font-bold mb-3">
                    {usage.data?.agents?.used || 0} / {(usage.data?.agents?.limit ?? -1) < 0 ? '∞' : usage.data?.agents?.limit}
                  </p>
                  {(usage.data?.agents?.limit ?? -1) > 0 && (
                    <>
                      <div className="w-full bg-bg-tertiary rounded-full h-2 mb-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{
                            width: `${Math.min(100, ((usage.data?.agents?.used || 0) / (usage.data?.agents?.limit || 1)) * 100)}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-text-tertiary">
                        {Math.round(((usage.data?.agents?.used || 0) / (usage.data?.agents?.limit || 1)) * 100)}% used
                      </p>
                    </>
                  )}
                </div>

                <div className="rounded-xl p-6 border border-border bg-bg-secondary/50 backdrop-blur">
                  <p className="text-text-secondary text-sm mb-2">Integrations</p>
                  <p className="text-3xl font-bold mb-3">
                    {usage.data?.integrations?.used || 0} / {(usage.data?.integrations?.limit ?? -1) < 0 ? '∞' : usage.data?.integrations?.limit}
                  </p>
                  {(usage.data?.integrations?.limit ?? -1) > 0 && (
                    <>
                      <div className="w-full bg-bg-tertiary rounded-full h-2 mb-2">
                        <div
                          className="bg-secondary rounded-full h-2 transition-all"
                          style={{
                            width: `${Math.min(100, ((usage.data?.integrations?.used || 0) / (usage.data?.integrations?.limit || 1)) * 100)}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-text-tertiary">
                        {Math.round(((usage.data?.integrations?.used || 0) / (usage.data?.integrations?.limit || 1)) * 100)}% used
                      </p>
                    </>
                  )}
                </div>

                <div className="rounded-xl p-6 border border-border bg-bg-secondary/50 backdrop-blur">
                  <p className="text-text-secondary text-sm mb-2">Tasks This Month</p>
                  <p className="text-3xl font-bold mb-3">
                    {usage.data?.tasksThisMonth?.used || 0} / {(usage.data?.tasksThisMonth?.limit ?? -1) < 0 ? '∞' : usage.data?.tasksThisMonth?.limit}
                  </p>
                  {(usage.data?.tasksThisMonth?.limit ?? -1) > 0 && (
                    <>
                      <div className="w-full bg-bg-tertiary rounded-full h-2 mb-2">
                        <div
                          className="bg-accent rounded-full h-2 transition-all"
                          style={{
                            width: `${Math.min(100, ((usage.data?.tasksThisMonth?.used || 0) / (usage.data?.tasksThisMonth?.limit || 1)) * 100)}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-text-tertiary">
                        {Math.round(((usage.data?.tasksThisMonth?.used || 0) / (usage.data?.tasksThisMonth?.limit || 1)) * 100)}% used
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Upgrade Options */}
              <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {TIERS.map((tier) => {
                  const isCurrent = tier.name === currentPlan;

                  return (
                    <motion.div
                      key={tier.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-xl p-8 border-2 ${
                        isCurrent ? "border-primary bg-primary/10" : "border-border bg-bg-secondary/50"
                      } backdrop-blur`}
                    >
                      {isCurrent && (
                        <div className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold rounded-full mb-4">
                          Current
                        </div>
                      )}
                      <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                      <p className="text-3xl font-bold text-primary mb-6">${tier.price}/mo</p>

                      <ul className="space-y-3 mb-8">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => handleUpgrade(tier.name)}
                        disabled={isCurrent || upgradeTier.isPending}
                        className={`w-full py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                          isCurrent
                            ? "bg-primary/20 text-primary cursor-default"
                            : "bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                        }`}
                      >
                        {upgradeTier.isPending && <Loader className="w-4 h-4 animate-spin" />}
                        {isCurrent ? "Current Plan" : `Upgrade to ${tier.name}`}
                        {!isCurrent && <ArrowRight className="w-4 h-4" />}
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Payment Method Banner */}
              <div className="mt-12 rounded-xl p-8 border border-warning/30 bg-warning/5 backdrop-blur">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-bold text-warning mb-2">Payment method required</h2>
                    <p className="text-text-secondary">
                      Stripe integration coming soon. Your upgrades are stored in the database but charges will begin once payment integration is ready.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
