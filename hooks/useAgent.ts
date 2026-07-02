"use client";

import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";

type AgentModel = "CLAUDE_OPUS" | "CLAUDE_SONNET" | "GPT_4O" | "GEMINI_PRO" | "LLAMA_70B" | "MISTRAL_LARGE";

export function useCreateAgent() {
  return useMutation({
    mutationFn: async (data: {
      name: string;
      role: string;
      model: AgentModel;
      tools?: string[];
      description?: string;
      systemPrompt?: string;
    }) => {
      return trpc.agents.create.mutate({
        name: data.name,
        role: data.role,
        model: data.model,
        description: data.description,
        systemPrompt: data.systemPrompt,
      });
    },
  });
}

export function useUpdateAgentTools() {
  return useMutation({
    mutationFn: async (data: {
      id: string;
      tools: string[];
    }) => {
      return trpc.agents.update.mutate({
        id: data.id,
        tools: data.tools,
      });
    },
  });
}

export function useDeleteAgent() {
  return useMutation({
    mutationFn: async (agentId: string) => {
      return trpc.agents.delete.mutate({ id: agentId });
    },
  });
}

export function useActivateAgent() {
  return useMutation({
    mutationFn: async (agentId: string) => {
      return trpc.agents.activate.mutate({ id: agentId });
    },
  });
}
