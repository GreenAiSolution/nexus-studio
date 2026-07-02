"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function TasksPage() {
  const { isLoaded, userId } = useAuth();
  const tasksList = trpc.tasks.list.useQuery();

  if (!isLoaded) return <div>Loading...</div>;
  if (!userId) redirect("/sign-in");

  const tasks = tasksList.data ?? [];
  const isLoading = tasksList.isLoading;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'RUNNING':
        return 'secondary';
      case 'PENDING':
        return 'warning';
      default:
        return 'outline';
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-4xl font-bold mb-2">Tasks</h1>
          <p className="text-text-secondary mb-12">Track your agent executions and results</p>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
          ) : tasks.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary mb-6">
                No tasks yet. Create an agent and run it to see execution history.
              </p>
              <Link href="/dashboard/agents/new">
                <button className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90">
                  Create Your First Agent
                </button>
              </Link>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left text-text-secondary text-sm">
                    <th className="py-3 px-4 font-medium">Agent</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Prompt</th>
                    <th className="py-3 px-4 font-medium">Duration</th>
                    <th className="py-3 px-4 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, idx) => (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-border/50 hover:bg-bg-secondary/30 transition"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{task.agent?.name || 'Unknown'}</p>
                          <p className="text-xs text-text-secondary">{task.agent?.role}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={getStatusVariant(task.status)}>
                          {task.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-text-secondary truncate max-w-xs">
                          {task.prompt.substring(0, 50)}...
                        </p>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {formatDuration(task.duration)}
                      </td>
                      <td className="py-4 px-4 text-sm text-text-secondary">
                        {new Date(task.createdAt).toLocaleDateString()} at{' '}
                        {new Date(task.createdAt).toLocaleTimeString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
