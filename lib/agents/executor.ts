/**
 * NEXUS AI — Agent Executor
 *
 * Executes AI agents with LangChain, automatic model routing,
 * and cost tracking.
 */

import { prisma } from '@/lib/db';
import { getLanguageModel } from './models';
import { selectOptimalModel, estimateTaskCost, type RoutingContext } from './model-router';
import { AgentModel } from '@prisma/client';
import { RunnableSequence } from '@langchain/core/runnables';
import { SystemMessagePromptTemplate, HumanMessagePromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';

export interface ExecutionContext {
  organizationId: string;
  agentId: string;
  userId?: string;
  taskId?: string;
  taskInput: string;
  maxTokens?: number;
  temperature?: number;
  forceModel?: AgentModel;
}

export interface ExecutionResult {
  output: string;
  modelUsed: AgentModel;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  latencyMs: number;
}

/**
 * Execute an agent task with automatic model routing
 */
export async function executeAgent(context: ExecutionContext): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Load agent configuration
  const agent = await prisma.agent.findUnique({
    where: { id: context.agentId },
  });

  if (!agent) {
    throw new Error(`Agent not found: ${context.agentId}`);
  }

  // Create or use existing task
  let taskId = context.taskId;
  if (!taskId && context.userId) {
    const task = await prisma.task.create({
      data: {
        organizationId: context.organizationId,
        agentId: context.agentId,
        userId: context.userId,
        prompt: context.taskInput,
        status: 'PENDING',
      },
    });
    taskId = task.id;
  } else if (!taskId) {
    throw new Error('Either taskId or userId must be provided in ExecutionContext');
  }

  // Determine model to use
  let modelToUse = context.forceModel || agent.model;

  if (!context.forceModel) {
    // Use router to select optimal model
    const routingContext: RoutingContext = {
      organizationId: context.organizationId,
      taskComplexity: context.taskInput.length > 500 ? 'complex' : 'moderate',
      requiresReasoning: agent.systemPrompt?.toLowerCase().includes('reason') || false,
      requiresVision: agent.tools?.includes('vision') || false,
      contextLength: (agent.systemPrompt?.length || 0) + context.taskInput.length,
      latencySensitive: false,
    };

    modelToUse = await selectOptimalModel(routingContext);
  }

  // Create language model instance
  const llm = getLanguageModel(modelToUse, agent.temperature);

  // Build prompt
  const systemPrompt = SystemMessagePromptTemplate.fromTemplate(
    agent.systemPrompt || 'You are a helpful AI assistant.'
  );

  const humanPrompt = HumanMessagePromptTemplate.fromTemplate('{input}');

  const prompt = ChatPromptTemplate.fromMessages([systemPrompt, humanPrompt]);

  // Create chain
  const chain = RunnableSequence.from([prompt, llm]);

  // Execute
  try {
    const response = await chain.invoke({
      input: context.taskInput,
    });

    const latencyMs = Date.now() - startTime;

    // Estimate tokens (rough approximation)
    const inputTokens = Math.ceil(
      (context.taskInput.length + (agent.systemPrompt?.length || 0)) / 4
    );
    const outputTokens = Math.ceil((response.content?.toString().length || 0) / 4);

    // Calculate cost
    const costUSD = estimateTaskCost(modelToUse, inputTokens, outputTokens);

    // Log execution
    await prisma.taskExecution.create({
      data: {
        organizationId: context.organizationId,
        taskId,
        agentId: context.agentId,
        status: 'COMPLETED',
        input: context.taskInput,
        output: response.content?.toString() || '',
        modelUsed: modelToUse,
        inputTokens,
        outputTokens,
        costUSD,
        durationMs: latencyMs,
      },
    });

    // Track cost metric
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    await prisma.costMetric.create({
      data: {
        organizationId: context.organizationId,
        agentId: context.agentId,
        model: modelToUse,
        period: 'MONTH',
        periodStart: monthStart,
        periodEnd: monthEnd,
        inputTokens,
        outputTokens,
        estimatedCostUSD: costUSD,
        taskCount: 1,
        totalTokens: inputTokens + outputTokens,
      },
    });

    return {
      output: response.content?.toString() || '',
      modelUsed: modelToUse,
      inputTokens,
      outputTokens,
      costUSD,
      latencyMs,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log failure
    await prisma.taskExecution.create({
      data: {
        organizationId: context.organizationId,
        taskId,
        agentId: context.agentId,
        status: 'FAILED',
        input: context.taskInput,
        output: `Error: ${errorMessage}`,
        modelUsed: modelToUse,
        durationMs: Date.now() - startTime,
        errorMessage,
      },
    });

    throw error;
  }
}

/**
 * Batch execute tasks with parallel processing
 */
export async function batchExecuteAgent(
  context: Omit<ExecutionContext, 'taskInput'>,
  inputs: string[]
): Promise<ExecutionResult[]> {
  const results = await Promise.all(
    inputs.map((input) =>
      executeAgent({
        ...context,
        taskInput: input,
      })
    )
  );

  return results;
}

/**
 * Stream agent response for real-time feedback
 */
export async function streamExecuteAgent(
  context: ExecutionContext,
  onChunk: (chunk: string) => void
): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Load agent
  const agent = await prisma.agent.findUnique({
    where: { id: context.agentId },
  });

  if (!agent) {
    throw new Error(`Agent not found: ${context.agentId}`);
  }

  // Create or use existing task
  let taskId = context.taskId;
  if (!taskId && context.userId) {
    const task = await prisma.task.create({
      data: {
        organizationId: context.organizationId,
        agentId: context.agentId,
        userId: context.userId,
        prompt: context.taskInput,
        status: 'PENDING',
      },
    });
    taskId = task.id;
  } else if (!taskId) {
    throw new Error('Either taskId or userId must be provided in ExecutionContext');
  }

  // Select model (always use agent's model for streaming)
  const modelToUse = context.forceModel || agent.model;

  // Create language model instance
  const llm = getLanguageModel(modelToUse, agent.temperature);

  // Build prompt
  const systemPrompt = SystemMessagePromptTemplate.fromTemplate(
    agent.systemPrompt || 'You are a helpful AI assistant.'
  );

  const humanPrompt = HumanMessagePromptTemplate.fromTemplate('{input}');
  const prompt = ChatPromptTemplate.fromMessages([systemPrompt, humanPrompt]);

  // Create chain with streaming
  const chain = RunnableSequence.from([prompt, llm]);

  let fullOutput = '';

  // Note: Streaming implementation depends on LangChain version
  // This is a simplified version; full implementation would use
  // the actual streaming API from LangChain
  try {
    const response = await chain.invoke({
      input: context.taskInput,
    });

    fullOutput = response.content?.toString() || '';
    onChunk(fullOutput);

    const latencyMs = Date.now() - startTime;
    const inputTokens = Math.ceil(
      (context.taskInput.length + (agent.systemPrompt?.length || 0)) / 4
    );
    const outputTokens = Math.ceil(fullOutput.length / 4);
    const costUSD = estimateTaskCost(modelToUse, inputTokens, outputTokens);

    // Log execution
    await prisma.taskExecution.create({
      data: {
        organizationId: context.organizationId,
        taskId,
        agentId: context.agentId,
        status: 'COMPLETED',
        input: context.taskInput,
        output: fullOutput,
        modelUsed: modelToUse,
        inputTokens,
        outputTokens,
        costUSD,
        durationMs: latencyMs,
      },
    });

    return {
      output: fullOutput,
      modelUsed: modelToUse,
      inputTokens,
      outputTokens,
      costUSD,
      latencyMs,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    onChunk(`\n\nError: ${errorMessage}`);
    throw error;
  }
}
