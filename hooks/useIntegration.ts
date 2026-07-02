"use client";

import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";

export function useCreateIntegration() {
  return useMutation({
    mutationFn: async (data: {
      provider:
        | "SLACK"
        | "MS_TEAMS"
        | "DISCORD"
        | "TELEGRAM"
        | "HUBSPOT"
        | "SALESFORCE"
        | "PIPEDRIVE"
        | "GOOGLE_WORKSPACE"
        | "MICROSOFT_365"
        | "NOTION"
        | "AIRTABLE"
        | "ZAPIER"
        | "MAKE"
        | "OPENAI"
        | "ANTHROPIC"
        | "GOOGLE_AI"
        | "PERPLEXITY"
        | "STRIPE"
        | "CUSTOM_API";
      name: string;
      displayName?: string;
      accessToken?: string;
      refreshToken?: string;
      config?: Record<string, any>;
    }) => {
      return trpc.integrations.create.mutate(data);
    },
  });
}

export function useDisconnectIntegration() {
  return useMutation({
    mutationFn: async (integrationId: string) => {
      return trpc.integrations.disconnect.mutate({ id: integrationId });
    },
  });
}

export function useUpdateIntegrationStatus() {
  return useMutation({
    mutationFn: async (data: {
      id: string;
      isActive?: boolean;
      lastError?: string;
    }) => {
      return trpc.integrations.updateStatus.mutate(data);
    },
  });
}
