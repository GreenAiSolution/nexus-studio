"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Brain, Pause, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function AgentsPage() {
  const { isLoaded, userId } = useAuth();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const agentsList = trpc.agents.list.useQuery();
  const canCreate = trpc.subscription.canCreateAgent.useQuery();
  const deleteAgent = trpc.agents.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['agents', 'list']] });
      setDeletingId(null);
    },
  });
  const updateAgent = trpc.agents.update.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['agents', 'list']] });
    },
  });

  if (!isLoaded) return <div>Loading...</div>;
  if (!userId) redirect("/sign-in");

  const agents = agentsList.data ?? [];
  const isLoading = agentsList.isLoading;

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Your Agents</h1>
              <p className="text-text-secondary">Create and manage AI agents</p>
            </div>
            <Link href="/dashboard/agents/new">
              <Button disabled={canCreate.data?.allowed === false} className="flex items-center gap-2">
                <Plus className="w-5 h-5" /> Create Agent
              </Button>
            </Link>
          </div>

          {canCreate.data?.allowed === false && (
            <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30 text-warning">
              <p className="text-sm">{canCreate.data.message}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
          ) : agents.length === 0 ? (
            <Card className="p-12 text-center">
              <Brain className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary mb-6">No agents yet. Create your first AI agent to get started.</p>
              <Link href="/dashboard/agents/new">
                <Button className="flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" /> Create Your First Agent
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-6">
              {agents.map((agent, idx) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card hover>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{agent.name}</CardTitle>
                          <CardDescription className="mt-1">{agent.role}</CardDescription>
                        </div>
                        <Badge
                          variant={
                            agent.status === 'ACTIVE'
                              ? 'success'
                              : agent.status === 'PAUSED'
                              ? 'warning'
                              : 'outline'
                          }
                        >
                          {agent.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                        <div>
                          <p className="text-text-secondary">Model</p>
                          <p className="font-medium text-xs">{agent.model.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-text-secondary">Last Run</p>
                          <p className="font-medium">
                            {agent.lastRun
                              ? new Date(agent.lastRun).toLocaleDateString()
                              : 'Never'}
                          </p>
                        </div>
                        <div>
                          <p className="text-text-secondary">Next Run</p>
                          <p className="font-medium">
                            {agent.nextRun
                              ? new Date(agent.nextRun).toLocaleDateString()
                              : 'None'}
                          </p>
                        </div>
                        <div>
                          <p className="text-text-secondary">Status</p>
                          <p className="font-medium text-primary">
                            {agent.isRunning ? 'Running' : 'Idle'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateAgent.mutate({
                              id: agent.id,
                              status: agent.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
                            })
                          }
                          disabled={updateAgent.isPending}
                          className="flex items-center gap-1"
                        >
                          {agent.status === 'ACTIVE' ? (
                            <>
                              <Pause className="w-4 h-4" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" /> Activate
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingId(agent.id)}
                          disabled={deleteAgent.isPending || deletingId === agent.id}
                          className="flex items-center gap-1 text-error hover:text-error"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </Button>
                      </div>

                      {deletingId === agent.id && (
                        <div className="mt-4 p-4 bg-error/10 rounded-lg border border-error/30">
                          <p className="text-sm text-error mb-3">
                            Are you sure you want to delete "{agent.name}"?
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteAgent.mutate({ id: agent.id })}
                              disabled={deleteAgent.isPending}
                            >
                              Delete
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingId(null)}
                              disabled={deleteAgent.isPending}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
