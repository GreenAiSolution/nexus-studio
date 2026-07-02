"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { CheckCircle, Plus, Loader, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import type { IntegrationProvider } from "@prisma/client";

const AVAILABLE_INTEGRATIONS: Array<{
  name: string;
  icon: string;
  description: string;
  provider: IntegrationProvider;
}> = [
  { name: "Slack", icon: "💬", description: "Send messages and notifications", provider: "SLACK" },
  { name: "Teams", icon: "👥", description: "Microsoft Teams integration", provider: "MS_TEAMS" },
  { name: "Discord", icon: "🎮", description: "Discord server management", provider: "DISCORD" },
  { name: "Telegram", icon: "📱", description: "Telegram bot integration", provider: "TELEGRAM" },
  { name: "HubSpot", icon: "🎯", description: "Manage contacts and deals", provider: "HUBSPOT" },
  { name: "Salesforce", icon: "🏢", description: "CRM integration", provider: "SALESFORCE" },
  { name: "Pipedrive", icon: "📈", description: "Sales pipeline management", provider: "PIPEDRIVE" },
  { name: "Google Workspace", icon: "📧", description: "Email and docs integration", provider: "GOOGLE_WORKSPACE" },
  { name: "Microsoft 365", icon: "📱", description: "Office integration", provider: "MICROSOFT_365" },
  { name: "Notion", icon: "📝", description: "Create and update pages", provider: "NOTION" },
  { name: "Airtable", icon: "📋", description: "Manage bases and records", provider: "AIRTABLE" },
  { name: "Zapier", icon: "⚡", description: "No-code automation", provider: "ZAPIER" },
  { name: "Make", icon: "🔗", description: "Workflow automation", provider: "MAKE" },
  { name: "Stripe", icon: "💳", description: "Process payments", provider: "STRIPE" },
];

export default function IntegrationsPage() {
  const { isLoaded, userId } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const integrationsList = trpc.integrations.list.useQuery();
  const createIntegration = trpc.integrations.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['integrations', 'list']] });
    },
  });
  const disconnectIntegration = trpc.integrations.disconnect.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['integrations', 'list']] });
    },
  });

  if (!isLoaded) return <div>Loading...</div>;
  if (!userId) redirect("/sign-in");

  const connectedProviders = new Set(integrationsList.data?.map(i => i.provider) ?? []);

  const handleConnect = async (provider: IntegrationProvider, name: string) => {
    setError("");
    try {
      await createIntegration.mutateAsync({
        provider,
        name,
      });
    } catch (err) {
      const errorMsg = `Failed to connect ${name}: ${err instanceof Error ? err.message : "Unknown error"}`;
      console.error('Mutation failed:', errorMsg);
      setError(errorMsg);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      await disconnectIntegration.mutateAsync({ id: integrationId });
    } catch (err) {
      setError(
        `Failed to disconnect: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  };

  const getIntegrationId = (provider: string) => {
    return integrationsList.data?.find(i => i.provider === provider)?.id;
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-4xl font-bold mb-2">Integrations</h1>
          <p className="text-text-secondary mb-12">
            Connect tools and services to your agents ({integrationsList.data?.length ?? 0} connected)
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {integrationsList.isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {AVAILABLE_INTEGRATIONS.map((integration, i) => {
                const isConnected = connectedProviders.has(integration.provider);
                const integrationId = getIntegrationId(integration.provider);
                const isLoading = createIntegration.isPending || disconnectIntegration.isPending;

                return (
                  <motion.div
                    key={integration.provider}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl p-6 border border-border bg-bg-secondary/50 backdrop-blur hover:border-primary/50 transition group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl">{integration.icon}</div>
                      {isConnected ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <Plus className="w-5 h-5 text-text-tertiary group-hover:text-primary transition" />
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-1">{integration.name}</h3>
                    <p className="text-text-secondary text-sm mb-4">
                      {integration.description}
                    </p>

                    {isConnected && integrationId ? (
                      <button
                        onClick={() => handleDisconnect(integrationId)}
                        disabled={isLoading}
                        className="w-full py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 bg-success/10 text-success hover:bg-success/20 disabled:opacity-50"
                      >
                        {isLoading && <Loader className="w-4 h-4 animate-spin" />}
                        <CheckCircle className="w-4 h-4" /> Connected
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(integration.provider, integration.name)}
                        disabled={isLoading}
                        className="w-full py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 border border-primary text-primary hover:bg-primary/10 disabled:opacity-50"
                      >
                        {isLoading && <Loader className="w-4 h-4 animate-spin" />}
                        {isLoading ? "Connecting..." : "Connect"}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
