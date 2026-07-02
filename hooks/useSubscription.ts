"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";

export function useUpgradeTier() {
  return useMutation({
    mutationFn: async (tier: "RECRUIT" | "OPERATOR" | "EMPIRE") => {
      return trpc.subscription.upgradeTier.mutate({ tier });
    },
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async (tier: "RECRUIT" | "OPERATOR" | "EMPIRE") => {
      return trpc.subscription.createCheckoutSession.mutate({ tier });
    },
  });
}

export function useCurrentSubscription() {
  return useQuery({
    queryKey: ["subscription", "current"],
    queryFn: async () => {
      return trpc.subscription.getCurrent.query();
    },
  });
}
