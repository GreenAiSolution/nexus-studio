"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Zap, AlertCircle, Loader } from "lucide-react";
import { useCreateAgent, useUpdateAgentTools } from "@/hooks/useAgent";

type AgentModel = "CLAUDE_OPUS" | "CLAUDE_SONNET" | "GPT_4O" | "GEMINI_PRO" | "LLAMA_70B" | "MISTRAL_LARGE";

const AI_MODELS: Array<{ label: string; value: AgentModel }> = [
  { label: "Claude 3 Opus", value: "CLAUDE_OPUS" },
  { label: "Claude 3 Sonnet", value: "CLAUDE_SONNET" },
  { label: "GPT-4o", value: "GPT_4O" },
  { label: "Gemini 2.5 Pro", value: "GEMINI_PRO" },
  { label: "Llama 3.1 70B", value: "LLAMA_70B" },
  { label: "Mistral Large", value: "MISTRAL_LARGE" },
];

const INTEGRATIONS = ["Slack", "Gmail", "HubSpot", "Salesforce", "Notion", "Stripe"];

export default function CreateAgentPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [agentName, setAgentName] = useState("");
  const [role, setRole] = useState("");
  const [model, setModel] = useState<AgentModel>("CLAUDE_OPUS");
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [createdAgentId, setCreatedAgentId] = useState<string>("");

  const createAgentMutation = useCreateAgent();
  const updateToolsMutation = useUpdateAgentTools();

  if (!isLoaded) return <div>Loading...</div>;
  if (!userId) redirect("/sign-in");

  const toggleIntegration = (integration: string) => {
    setSelectedIntegrations((prev) =>
      prev.includes(integration) ? prev.filter((i) => i !== integration) : [...prev, integration]
    );
  };

  const handleCreate = async () => {
    setError("");
    try {
      const agent = await createAgentMutation.mutateAsync({
        name: agentName,
        role,
        model,
      });

      setCreatedAgentId(agent.id);

      if (selectedIntegrations.length > 0) {
        await updateToolsMutation.mutateAsync({
          id: agent.id,
          tools: selectedIntegrations,
        });
      }

      router.push("/dashboard/agents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    }
  };

  const isLoading = createAgentMutation.isPending || updateToolsMutation.isPending;

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-2 flex-1 mx-1 rounded ${s <= step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
          <p className="text-text-2">Step {step} of 3</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-8 border border-border bg-surface/40 backdrop-blur"
        >
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-accent/10 border border-accent flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-accent">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-bold mb-3">Agent Name</label>
                <input
                  type="text"
                  placeholder="e.g., Sales Development Rep"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border focus:border-primary focus:outline-none text-text-1"
                />
              </div>
              <div>
                <label className="block text-lg font-bold mb-3">Role Description</label>
                <textarea
                  placeholder="What will this agent do? E.g., Find qualified leads, schedule demos, nurture relationships"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border focus:border-primary focus:outline-none text-text-1"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-bold mb-4">Select AI Model</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {AI_MODELS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setModel(m.value)}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        model === m.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <p className="font-semibold">{m.label}</p>
                      <p className="text-text-2 text-sm">State-of-the-art reasoning</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-bold mb-4">Select Integrations</label>
                <p className="text-text-2 mb-4">Choose which tools this agent can access</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {INTEGRATIONS.map((integration) => (
                    <button
                      key={integration}
                      onClick={() => toggleIntegration(integration)}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        selectedIntegrations.includes(integration)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 ${
                            selectedIntegrations.includes(integration) ? "bg-primary border-primary" : "border-border"
                          }`}
                        />
                        <p className="font-semibold">{integration}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-12">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={isLoading}
                className="px-6 py-3 border border-text-2 rounded-lg font-semibold hover:bg-surface transition disabled:opacity-50"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && (!agentName || !role)}
                className="ml-auto px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className="ml-auto px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> Create Agent
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
