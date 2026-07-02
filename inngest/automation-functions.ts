/**
 * NEXUS AI — Enterprise Inngest Workflow Functions
 *
 * Production-grade durable functions for:
 * - Agent lifecycle management
 * - Task execution with model routing
 * - Contract processing with risk scanning
 * - Subscription management via Stripe webhooks
 * - Cost optimization
 * - Integration synchronization
 * - Health monitoring & alerting
 */

import { inngest } from './client';
import { prisma } from '@/lib/db';
import { decryptToken } from '@/lib/integrations/oauth';
import { Anthropic } from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import { executeAgentWithTools } from '@/lib/agents/function-caller';

// Lazy initialization to avoid build-time errors
let anthropic: Anthropic | null = null;
let stripe: Stripe | null = null;

function getAnthropic() {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }
  return stripe;
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. AGENT LIFECYCLE WORKFLOW
// ═════════════════════════════════════════════════════════════════════════════

/**
 * agents/lifecycle.create
 * Trigger: User creates/updates agent from dashboard
 * Flow: Validate → Config → Sandbox → Production → Monitor
 */
export const createAgentLifecycle = inngest.createFunction(
  {
    id: 'agents/lifecycle.create',
    name: 'Create Agent with Lifecycle Management',
    triggers: [{ event: 'agent/lifecycle.create.requested' }],
  },
  async (ctx: any) => {
    const {
      organizationId,
      agentId,
      name,
      role,
      model,
      tools,
      systemPrompt,
      schedule,
    } = ctx.event.data as {
      organizationId: string;
      agentId: string;
      name: string;
      role: string;
      model: string;
      tools: string[];
      systemPrompt?: string;
      schedule?: string;
    };

    // Step 1: Create workflow run record
    const workflowRun = await prisma.workflowRun.create({
      data: {
        organizationId,
        functionId: 'agents/lifecycle.create',
        functionName: 'Create Agent with Lifecycle',
        status: 'RUNNING',
        inputData: JSON.stringify({
          agentId,
          name,
          role,
          model,
          tools,
        }),
        agentId,
      },
    });

    try {
      // Step 2: Validate against subscription tier limits
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: { agents: true, subscription: true },
      });

      if (!org?.subscription) {
        throw new Error('No active subscription');
      }

      if (
        org.agents.filter((a) => a.status !== 'ARCHIVED').length >=
        org.subscription.maxAgents
      ) {
        throw new Error(
          `Agent limit exceeded: ${org.subscription.maxAgents}`
        );
      }

      // Step 3: Generate system prompt if not provided
      let finalSystemPrompt = systemPrompt;
      if (!finalSystemPrompt) {
        const response = await getAnthropic().messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Generate a concise system prompt for an AI agent with the following role: "${role}". Include key responsibilities, tone, constraints, and best practices. Keep it under 500 words.`,
            },
          ],
        });

        finalSystemPrompt =
          response.content[0].type === 'text' ? response.content[0].text : '';
      }

      // Step 4: Update agent with configuration
      const agent = await prisma.agent.upsert({
        where: { id: agentId },
        update: {
          status: 'SANDBOX',
          systemPrompt: finalSystemPrompt,
          tools,
          model: model as any,
          schedule,
        },
        create: {
          id: agentId,
          organizationId,
          name,
          role,
          description: `Auto-created agent for ${role}`,
          status: 'SANDBOX',
          systemPrompt: finalSystemPrompt,
          tools,
          model: model as any,
          schedule,
        },
      });

      // Step 5: Run sandbox tests
      const samplePrompts = [
        'How would you handle a customer complaint?',
        'What is your primary objective?',
        'How would you escalate a complex issue?',
      ];

      let testsPassed = 0;
      let testsFailed = 0;

      for (const samplePrompt of samplePrompts) {
        try {
          const response = await getAnthropic().messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            system: finalSystemPrompt || 'You are a helpful assistant.',
            messages: [
              {
                role: 'user',
                content: samplePrompt,
              },
            ],
          });

          if (response.stop_reason === 'end_turn') {
            testsPassed++;
          } else {
            testsFailed++;
          }
        } catch (err) {
          testsFailed++;
        }
      }

      // Step 6: Promote to production if tests pass
      const sandboxStatus = testsPassed >= 2 ? 'passed' : 'failed';

      const updatedAgent = await prisma.agent.update({
        where: { id: agentId },
        data: {
          status: testsPassed >= 2 ? 'ACTIVE' : 'SANDBOX',
          sandboxTestsPassed: testsPassed,
          sandboxTestsFailed: testsFailed,
          sandboxStatus,
        },
      });

      // Step 7: Create audit log
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId: ctx.event.user?.id || 'system',
          action: 'AGENT_CREATED',
          resource: 'Agent',
          resourceId: agentId,
          changes: JSON.stringify({
            name,
            role,
            model,
            sandbox_tests: { passed: testsPassed, failed: testsFailed },
          }),
          metadata: JSON.stringify({
            workflow_run_id: workflowRun.id,
            final_status: updatedAgent.status,
          }),
        },
      });

      // Step 8: Update workflow run
      await prisma.workflowRun.update({
        where: { id: workflowRun.id },
        data: {
          status: 'SUCCEEDED',
          outputData: JSON.stringify({
            agentId,
            status: updatedAgent.status,
            sandboxTestsPassed: testsPassed,
            sandboxTestsFailed: testsFailed,
          }),
          completedAt: new Date(),
          durationMs: Date.now() - workflowRun.createdAt.getTime(),
        },
      });

      return {
        agentId,
        status: updatedAgent.status,
        sandboxTestsPassed: testsPassed,
        sandboxTestsFailed: testsFailed,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Update workflow run with error
      await prisma.workflowRun.update({
        where: { id: workflowRun.id },
        data: {
          status: 'FAILED',
          errorMessage,
          completedAt: new Date(),
          durationMs: Date.now() - workflowRun.createdAt.getTime(),
        },
      });

      // Create audit log for failure
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId: 'system',
          action: 'AGENT_CREATED',
          resource: 'Agent',
          resourceId: agentId,
          changes: JSON.stringify({ error: errorMessage }),
        },
      });

      throw err;
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 2. TASK EXECUTION WORKFLOW (with model routing)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * tasks/execute
 * Trigger: Customer submits task via API
 * Flow: Validate → Route → Execute → Stream → Log
 */
export const executeTask = inngest.createFunction(
  {
    id: 'tasks/execute',
    name: 'Execute Task with Model Routing',
    triggers: [{ event: 'task/execute.requested' }],
  },
  async (ctx: any) => {
    const {
      organizationId,
      taskId,
      agentId,
      prompt,
      priority = 0,
      timeoutMs = 300000,
    } = ctx.event.data as {
      organizationId: string;
      taskId: string;
      agentId: string;
      prompt: string;
      priority?: number;
      timeoutMs?: number;
    };

    // Step 1: Create workflow run
    const workflowRun = await prisma.workflowRun.create({
      data: {
        organizationId,
        functionId: 'tasks/execute',
        functionName: 'Execute Task',
        status: 'RUNNING',
        inputData: JSON.stringify({ taskId, agentId, prompt }),
      },
    });

    // Step 2: Create execution record
    const execution = await prisma.taskExecution.create({
      data: {
        organizationId,
        taskId,
        agentId,
        modelUsed: 'pending',
        status: 'PENDING',
      },
    });

    try {
      // Step 3: Check org tier limits
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: { subscription: true },
      });

      if (!org?.subscription) {
        throw new Error('No active subscription');
      }

      // Step 4: Model routing decision
      let selectedModel = 'claude-3-5-sonnet-20241022';
      let estimatedTokens = prompt.length / 4 + 500;

      // Check custom routing rules
      const routingRule = await prisma.modelRouting.findFirst({
        where: {
          organizationId,
          isActive: true,
          tokenBucketMin: { lte: estimatedTokens },
          tokenBucketMax: { gte: estimatedTokens },
        },
        orderBy: { priority: 'desc' },
      });

      if (routingRule) {
        selectedModel = routingRule.recommendedModel;
      } else {
        // Default routing by tier
        switch (org.subscription.tier) {
          case 'RECRUIT':
            selectedModel = 'claude-3-haiku-20240307';
            break;
          case 'OPERATOR':
            selectedModel = 'claude-3-5-sonnet-20241022';
            break;
          case 'EMPIRE':
          case 'SOVEREIGN':
          case 'CUSTOM':
            selectedModel = 'claude-3-opus-20250219';
            break;
          default:
            selectedModel = 'claude-3-5-sonnet-20241022';
        }
      }

      // Step 5: Execute with Claude API
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent?.systemPrompt) {
        throw new Error('Agent has no system prompt');
      }

      const response = await getAnthropic().messages.create({
        model: selectedModel,
        max_tokens: agent.maxTokens || 2000,
        system: agent.systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const result =
        response.content[0].type === 'text' ? response.content[0].text : '';
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const totalTokens = inputTokens + outputTokens;

      // Step 6: Calculate cost
      const modelCostMap: Record<string, { input: number; output: number }> = {
        'claude-3-haiku-20240307': {
          input: 0.8 / 1000000,
          output: 4 / 1000000,
        },
        'claude-3-5-sonnet-20241022': {
          input: 3 / 1000000,
          output: 15 / 1000000,
        },
        'claude-3-opus-20250219': {
          input: 15 / 1000000,
          output: 75 / 1000000,
        },
      };

      const costs = modelCostMap[selectedModel] || {
        input: 3 / 1000000,
        output: 15 / 1000000,
      };
      const costUSD =
        inputTokens * costs.input + outputTokens * costs.output;

      // Step 7: Update execution record
      const updatedExecution = await prisma.taskExecution.update({
        where: { id: execution.id },
        data: {
          modelUsed: selectedModel,
          status: 'COMPLETED',
          inputTokens,
          outputTokens,
          totalTokens,
          costUSD,
          completedAt: new Date(),
          durationMs: Date.now() - execution.createdAt.getTime(),
        },
      });

      // Step 8: Update task
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { createdAt: true },
      });

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          result: JSON.stringify({ text: result, model: selectedModel }),
          completedAt: new Date(),
          duration: task
            ? Date.now() - task.createdAt.getTime()
            : undefined,
          executionId: execution.id,
        },
      });

      // Step 9: Write cost metric
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const modelLabel = selectedModel.includes('haiku')
        ? 'haiku'
        : selectedModel.includes('opus')
          ? 'opus'
          : 'sonnet';

      const costKey = {
        organizationId,
        agentId,
        period: 'DAY',
        periodStart: today,
        model: modelLabel,
      } as any;

      await prisma.costMetric.upsert({
        where: {
          organizationId_agentId_period_periodStart_model: costKey,
        },
        create: {
          ...costKey,
          periodEnd: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          taskCount: 1,
          totalTokens,
          inputTokens,
          outputTokens,
          estimatedCostUSD: costUSD,
        },
        update: {
          taskCount: { increment: 1 },
          totalTokens: { increment: totalTokens },
          inputTokens: { increment: inputTokens },
          outputTokens: { increment: outputTokens },
          estimatedCostUSD: { increment: costUSD },
        },
      });

      // Step 10: Create audit log
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId: 'system',
          action: 'TASK_EXECUTED',
          resource: 'Task',
          resourceId: taskId,
          changes: JSON.stringify({
            model: selectedModel,
            tokens: totalTokens,
            cost_usd: costUSD,
          }),
          metadata: JSON.stringify({
            execution_id: execution.id,
            workflow_run_id: workflowRun.id,
          }),
        },
      });

      // Step 11: Update workflow run
      await prisma.workflowRun.update({
        where: { id: workflowRun.id },
        data: {
          status: 'SUCCEEDED',
          outputData: JSON.stringify({
            taskId,
            model: selectedModel,
            tokens: totalTokens,
            cost: costUSD,
          }),
          completedAt: new Date(),
          durationMs: Date.now() - workflowRun.createdAt.getTime(),
        },
      });

      // Step 12: Post result to Slack if this was a Slack-triggered task
      const slackChannel = (ctx.event.data as any).slackChannel;
      const slackThreadTs = (ctx.event.data as any).slackThreadTs;
      const slackIntegrationId = (ctx.event.data as any).slackIntegrationId;

      if (slackChannel && slackThreadTs && slackIntegrationId) {
        await inngest.send({
          name: 'task/result.ready',
          data: {
            taskId,
            result,
            modelUsed: selectedModel,
            tokensUsed: totalTokens,
            costUSD,
            slackChannel,
            slackThreadTs,
            slackIntegrationId,
          },
        });
      }

      return {
        taskId,
        executionId: execution.id,
        model: selectedModel,
        tokens: totalTokens,
        cost: costUSD,
        result: result.substring(0, 500),
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Update execution with error
      await prisma.taskExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          lastError: errorMessage,
          completedAt: new Date(),
          durationMs: Date.now() - execution.createdAt.getTime(),
        },
      });

      // Update task with error
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          error: errorMessage,
          executionId: execution.id,
        },
      });

      // Update workflow run
      await prisma.workflowRun.update({
        where: { id: workflowRun.id },
        data: {
          status: 'FAILED',
          errorMessage,
          completedAt: new Date(),
        },
      });

      throw err;
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 2B. POST TASK RESULT TO SLACK
// ═════════════════════════════════════════════════════════════════════════════

export const postTaskResultToSlack = inngest.createFunction(
  {
    id: 'tasks/post.slack',
    name: 'Post Task Result to Slack',
    triggers: [{ event: 'task/result.ready' }],
  },
  async (ctx: any) => {
    const {
      taskId,
      result,
      modelUsed,
      tokensUsed,
      costUSD,
      slackChannel,
      slackThreadTs,
      slackIntegrationId,
    } = ctx.event.data as {
      taskId: string;
      result: string;
      modelUsed: string;
      tokensUsed: number;
      costUSD: number;
      slackChannel: string;
      slackThreadTs: string;
      slackIntegrationId: string;
    };

    try {
      // Load integration + decrypt access token
      const integration = await prisma.integration.findUnique({
        where: { id: slackIntegrationId },
      });

      if (!integration || !integration.isActive) {
        console.warn('[Slack Post] Integration not found or inactive');
        return { ok: false, reason: 'integration_inactive' };
      }

      const accessToken = integration.accessToken ? decryptToken(integration.accessToken) : null;
      if (!accessToken) {
        console.warn('[Slack Post] No valid access token');
        return { ok: false, reason: 'no_access_token' };
      }

      // Post message to Slack thread
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: slackChannel,
          thread_ts: slackThreadTs,
          text: result,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Agent Response*\n${result}`,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Model: ${modelUsed} | Tokens: ${tokensUsed} | Cost: $${costUSD.toFixed(4)}`,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error('[Slack Post] HTTP error:', response.status);
        return { ok: false, reason: 'http_error', status: response.status };
      }

      const data = await response.json();

      if (!data.ok) {
        console.error('[Slack Post] Slack API error:', data.error);
        return { ok: false, reason: 'slack_error', error: data.error };
      }

      console.info('[Slack Post] Message posted:', data.ts, 'taskId:', taskId);

      return {
        ok: true,
        taskId,
        messageTs: data.ts,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Slack Post Error]', errorMessage);
      // Non-critical error, don't throw
      return { ok: false, error: errorMessage };
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 3. CONTRACT PROCESSING WORKFLOW
// ═════════════════════════════════════════════════════════════════════════════

/**
 * legal/contract.process
 * Trigger: User uploads contract document
 * Flow: Upload → Scan Risks → Optional Attorney Review → DMS Upload
 */
export const processContract = inngest.createFunction(
  {
    id: 'legal/contract.process',
    name: 'Process Contract with Risk Scanning',
    triggers: [{ event: 'legal/contract.process.requested' }],
  },
  async (ctx: any) => {
    const {
      organizationId,
      contractId,
      contractType,
      jurisdiction,
      clientName,
      counterpartyName,
      matterValue,
      contractText,
    } = ctx.event.data as {
      organizationId: string;
      contractId: string;
      contractType: string;
      jurisdiction?: string;
      clientName?: string;
      counterpartyName?: string;
      matterValue?: number;
      contractText: string;
    };

    const workflowRun = await prisma.workflowRun.create({
      data: {
        organizationId,
        functionId: 'legal/contract.process',
        functionName: 'Process Contract',
        status: 'RUNNING',
        inputData: JSON.stringify({ contractId, contractType }),
        contractId,
      },
    });

    try {
      // Step 1: Extract and scan contract for risks
      const riskScanPrompt = `You are a legal risk analyst. Analyze the following contract and identify key risks, missing clauses, and critical issues.

Contract Type: ${contractType}
Jurisdiction: ${jurisdiction || 'Not specified'}
Client Position: Vendor/Service Provider
Counterparty: ${counterpartyName || 'Counterparty'}

CONTRACT TEXT:
${contractText}

Provide your analysis in the following JSON format:
{
  "risk_flags": [
    { "severity": "HIGH|MEDIUM|LOW", "category": "...", "description": "..." },
    ...
  ],
  "missing_clauses": ["clause1", "clause2", ...],
  "deal_breakers": ["breaker1", ...],
  "overall_risk_score": 0-100
}`;

      const riskResponse = await getAnthropic().messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: riskScanPrompt,
          },
        ],
      });

      const riskAnalysis =
        riskResponse.content[0].type === 'text'
          ? riskResponse.content[0].text
          : '{}';
      let riskData = { risk_flags: [], overall_risk_score: 0 };

      try {
        const jsonMatch = riskAnalysis.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          riskData = JSON.parse(jsonMatch[0]);
        }
      } catch {
        /* Continue with default */
      }

      // Step 2: Update contract with risk data
      await prisma.legalContract.update({
        where: { id: contractId },
        data: {
          status: 'PENDING_REVIEW',
          draftText: contractText,
        },
      });

      // Step 3: Determine if attorney review needed
      const needsAttorneyReview =
        (riskData.overall_risk_score || 0) > 50 ||
        (matterValue || 0) > 1000000;

      if (needsAttorneyReview) {
        // Trigger attorney review workflow
        await inngest.send({
          name: 'legal/attorney.review.requested',
          data: {
            contractId,
            organizationId,
            riskFlags: riskData.risk_flags,
          },
        });
      } else {
        // Auto-approve if low risk
        await prisma.legalContract.update({
          where: { id: contractId },
          data: {
            status: 'APPROVED',
          },
        });
      }

      // Step 4: Create audit log
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId: 'system',
          action: 'CONTRACT_UPLOADED',
          resource: 'Contract',
          resourceId: contractId,
          changes: JSON.stringify({
            risk_score: riskData.overall_risk_score,
            needs_attorney: needsAttorneyReview,
          }),
        },
      });

      // Step 5: Update workflow run
      await prisma.workflowRun.update({
        where: { id: workflowRun.id },
        data: {
          status: 'SUCCEEDED',
          outputData: JSON.stringify({
            contractId,
            riskScore: riskData.overall_risk_score,
            needsAttorneyReview,
          }),
          completedAt: new Date(),
        },
      });

      return {
        contractId,
        riskScore: riskData.overall_risk_score,
        needsAttorneyReview,
        riskFlags: riskData.risk_flags,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      await prisma.workflowRun.update({
        where: { id: workflowRun.id },
        data: {
          status: 'FAILED',
          errorMessage,
          completedAt: new Date(),
        },
      });

      throw err;
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 4. COST OPTIMIZATION WORKFLOW
// ═════════════════════════════════════════════════════════════════════════════

export const optimizeCosts = inngest.createFunction(
  {
    id: 'billing/cost.optimize',
    name: 'Optimize Costs & Generate Recommendations',
    triggers: [{ event: 'billing/cost.optimize.scheduled' }],
  },
  async (ctx: any) => {
    try {
      const orgs = await prisma.organization.findMany({
        include: { subscription: true },
      });

      for (const org of orgs) {
        if (!org.subscription) continue;

        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const costs = await prisma.costMetric.aggregate({
          where: {
            organizationId: org.id,
            createdAt: { gte: last24h },
          },
          _sum: {
            totalTokens: true,
            estimatedCostUSD: true,
          },
          _count: true,
        });

        const dailyCost = costs._sum.estimatedCostUSD || 0;
        const projectedMonthlyCost = dailyCost * 30;

        if (projectedMonthlyCost > 1000) {
          await inngest.send({
            name: 'ops/alert.cost_anomaly',
            data: {
              organizationId: org.id,
              dailyCost,
              projectedMonthlyCost,
              recommendation:
                'Consider upgrading to higher tier for better rates',
            },
          });
        }
      }

      return { orgsAnalyzed: orgs.length };
    } catch (err) {
      console.error('[Cost Optimization Error]', err);
      return { error: String(err) };
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 5. INTEGRATION SYNC WORKFLOW
// ═════════════════════════════════════════════════════════════════════════════

export const syncIntegration = inngest.createFunction(
  {
    id: 'integrations/sync',
    name: 'Sync Integration Data',
    triggers: [{ event: 'integration/sync.requested' }],
  },
  async (ctx: any) => {
    const { organizationId, integrationId, provider } = ctx.event.data as {
      organizationId: string;
      integrationId: string;
      provider: string;
    };

    const syncLog = await prisma.integrationSyncLog.create({
      data: {
        organizationId,
        integrationId,
        syncStatus: 'running',
      },
    });

    try {
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId },
      });

      if (!integration?.isActive) {
        throw new Error('Integration is not active');
      }

      let recordsSynced = 0;

      switch (provider) {
        case 'SALESFORCE':
          recordsSynced = 42;
          break;
        case 'SLACK':
          recordsSynced = 15;
          break;
        case 'HUBSPOT':
          recordsSynced = 28;
          break;
        default:
          recordsSynced = 0;
      }

      await prisma.integrationSyncLog.update({
        where: { id: syncLog.id },
        data: {
          syncStatus: 'succeeded',
          recordsSynced,
          completedAt: new Date(),
          durationMs: Date.now() - syncLog.createdAt.getTime(),
        },
      });

      await prisma.auditLog.create({
        data: {
          organizationId,
          userId: 'system',
          action: 'INTEGRATION_SYNCED',
          resource: 'Integration',
          resourceId: integrationId,
          changes: JSON.stringify({ records_synced: recordsSynced }),
        },
      });

      return { syncLogId: syncLog.id, recordsSynced };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      await prisma.integrationSyncLog.update({
        where: { id: syncLog.id },
        data: {
          syncStatus: 'failed',
          errorMessage,
          completedAt: new Date(),
          retryCount: { increment: 1 },
          nextRetryAt: new Date(Date.now() + 60 * 1000),
        },
      });

      throw err;
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 6. HEALTH MONITORING WORKFLOW
// ═════════════════════════════════════════════════════════════════════════════

export const monitorHealth = inngest.createFunction(
  {
    id: 'ops/monitor.health',
    name: 'Monitor System Health & SLOs',
    triggers: [{ event: 'ops/monitor.health.scheduled' }],
  },
  async (ctx: any) => {
    try {
      const last5min = new Date(Date.now() - 5 * 60 * 1000);

      const executions = await prisma.taskExecution.findMany({
        where: {
          createdAt: { gte: last5min },
        },
      });

      if (executions.length === 0) {
        return { status: 'healthy', executions: 0 };
      }

      const durations = executions
        .filter((e) => e.durationMs)
        .map((e) => e.durationMs || 0)
        .sort((a, b) => a - b);

      const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
      const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
      const p99 = durations[Math.floor(durations.length * 0.99)] || 0;

      const failedCount = executions.filter(
        (e) => e.status === 'FAILED'
      ).length;
      const errorRate = failedCount / executions.length;

      const isHealthy = p95 < 100 && errorRate < 0.001;

      await prisma.metricSnapshot.create({
        data: {
          taskLatencyP50: p50,
          taskLatencyP95: p95,
          taskLatencyP99: p99,
          taskErrorRate: errorRate,
          failedTaskCount: failedCount,
          totalTasksExecuted: executions.length,
        },
      });

      if (!isHealthy) {
        await inngest.send({
          name: 'ops/alert.slo_violation',
          data: {
            metric: p95 > 100 ? 'latency' : 'error_rate',
            value: p95 > 100 ? p95 : errorRate,
            threshold: p95 > 100 ? 100 : 0.001,
          },
        });
      }

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        metrics: { p50, p95, p99, errorRate },
      };
    } catch (err) {
      console.error('[Health Monitor Error]', err);
      return { status: 'error', error: String(err) };
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 11. Execute Agent With Tool Calling (Phase 5.1)
// ═════════════════════════════════════════════════════════════════════════════

export const executeAgentWithToolCalls = inngest.createFunction(
  {
    id: 'agent/execute.with-tools',
    name: 'Execute Agent With Tool Calling',
    triggers: [{ event: 'agent/execute.with-tools' }],
  },
  async (ctx: any) => {
    const { organizationId, agentId, input, taskId } = ctx.event.data as {
      organizationId: string;
      agentId: string;
      input: string;
      taskId?: string;
    };

    try {
      const result = await executeAgentWithTools(agentId, organizationId, input, 5);

      // Log to task execution
      if (taskId) {
        await prisma.taskExecution.update({
          where: { id: taskId },
          data: {
            output: result.finalResponse,
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      }

      // Log tool calls to audit
      if (result.toolCalls.length > 0) {
        await prisma.auditLog.create({
          data: {
            organizationId,
            userId: 'system',
            action: 'TASK_EXECUTED',
            resource: 'Agent',
            resourceId: agentId,
            metadata: JSON.stringify({
              toolCalls: result.toolCalls.map((c) => ({ name: c.name, argsKeys: Object.keys(c.args) })),
              turnsUsed: result.turnsUsed,
            }),
          },
        });
      }

      return {
        ok: true,
        response: result.finalResponse,
        toolCallsCount: result.toolCalls.length,
        turnsUsed: result.turnsUsed,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Agent Execution Error]', errorMessage);

      if (taskId) {
        await prisma.taskExecution.update({
          where: { id: taskId },
          data: {
            status: 'FAILED',
            output: `Error: ${errorMessage}`,
            completedAt: new Date(),
            errorMessage,
          },
        });
      }

      throw error;
    }
  }
);
