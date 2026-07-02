import { inngest } from './client';
import { prisma } from '@/lib/db';
import { getLanguageModel } from '@/lib/agents/models';
import { HumanMessage } from '@langchain/core/messages';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const executeAgentTask = inngest.createFunction(
  {
    id: 'execute-agent-task',
    name: 'Execute Agent Task',
    triggers: [{ event: 'agent/task.execute' }],
  },
  async (ctx: any) => {
    const { taskId, agentId, organizationId, prompt } = ctx.event.data;

    try {
      // Update task status to RUNNING
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'RUNNING', startedAt: new Date() },
      });

      // Load agent configuration
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Initialize language model
      const llm = getLanguageModel(agent.model, agent.temperature);

      // Execute agent reasoning
      const messages = [new HumanMessage(prompt)];
      const response = await llm.invoke(messages);

      const result = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);

      // Save result
      const endTime = new Date();
      const duration = endTime.getTime() - (agent.lastRun?.getTime() || 0);

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          result,
          completedAt: endTime,
          duration: Math.max(0, duration),
        },
      });

      // Update agent's lastRun
      await prisma.agent.update({
        where: { id: agentId },
        data: { lastRun: new Date() },
      });

      return { success: true, taskId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          error: errorMessage,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const retryFailedTask = inngest.createFunction(
  {
    id: 'retry-failed-task',
    name: 'Retry Failed Task',
    triggers: [{ event: 'agent/task.retry' }],
  },
  async (ctx: any) => {
    const { taskId } = ctx.event.data;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Re-execute the task
    await inngest.send({
      name: 'agent/task.execute',
      data: {
        taskId: task.id,
        agentId: task.agentId,
        organizationId: task.organizationId,
        prompt: task.prompt,
      },
    });

    return { retriedTaskId: taskId };
  }
);
