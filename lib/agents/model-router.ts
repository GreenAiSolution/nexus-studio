/**
 * NEXUS AI — Model Router
 *
 * Intelligently routes tasks to the most cost-effective AI model
 * based on task complexity, budget, and performance requirements.
 */

import { prisma } from '@/lib/db';
import { AgentModel } from '@prisma/client';

export interface ModelPricingTier {
  inputTokenPrice: number; // Per 1M tokens
  outputTokenPrice: number; // Per 1M tokens
  avgLatencyMs: number;
  maxContextWindow: number;
  reasoning: boolean;
  vision: boolean;
}

export const MODEL_PRICING: Record<AgentModel, ModelPricingTier> = {
  CLAUDE_HAIKU: {
    inputTokenPrice: 0.08,
    outputTokenPrice: 0.24,
    avgLatencyMs: 400,
    maxContextWindow: 200000,
    reasoning: false,
    vision: true,
  },
  CLAUDE_SONNET: {
    inputTokenPrice: 3.0,
    outputTokenPrice: 15.0,
    avgLatencyMs: 600,
    maxContextWindow: 200000,
    reasoning: true,
    vision: true,
  },
  CLAUDE_OPUS: {
    inputTokenPrice: 15.0,
    outputTokenPrice: 75.0,
    avgLatencyMs: 1200,
    maxContextWindow: 200000,
    reasoning: true,
    vision: true,
  },
  GPT_4O: {
    inputTokenPrice: 5.0,
    outputTokenPrice: 15.0,
    avgLatencyMs: 800,
    maxContextWindow: 128000,
    reasoning: false,
    vision: true,
  },
  GEMINI_PRO: {
    inputTokenPrice: 0.5,
    outputTokenPrice: 1.5,
    avgLatencyMs: 700,
    maxContextWindow: 2000000,
    reasoning: false,
    vision: true,
  },
  LLAMA_70B: {
    inputTokenPrice: 0.6,
    outputTokenPrice: 0.9,
    avgLatencyMs: 1000,
    maxContextWindow: 8192,
    reasoning: false,
    vision: false,
  },
  MISTRAL_LARGE: {
    inputTokenPrice: 2.0,
    outputTokenPrice: 6.0,
    avgLatencyMs: 900,
    maxContextWindow: 32000,
    reasoning: false,
    vision: false,
  },
};

export interface RoutingContext {
  organizationId: string;
  taskComplexity: 'simple' | 'moderate' | 'complex';
  requiresReasoning: boolean;
  requiresVision: boolean;
  contextLength: number;
  latencySensitive: boolean;
  maxBudgetUSD?: number;
}

/**
 * Route task to optimal model based on complexity and budget
 */
export async function selectOptimalModel(context: RoutingContext): Promise<AgentModel> {
  // Get org subscription tier and budget info
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: context.organizationId },
  });

  // Get current month spend
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyMetrics = await prisma.costMetric.findMany({
    where: {
      organizationId: context.organizationId,
      createdAt: { gte: monthStart },
    },
  });
  const monthlySpend = monthlyMetrics.reduce((sum, m) => sum + m.estimatedCostUSD, 0);

  // Calculate available budget
  const estimatedBudget = subscription?.monthlyTokenLimit ? subscription.monthlyTokenLimit * 0.000001 : 500;
  const remainingBudget = estimatedBudget - monthlySpend;

  // Build candidate models based on requirements
  const candidates = Object.entries(MODEL_PRICING).filter(([_model, pricing]) => {
    // Filter out models that don't meet requirements
    if (context.requiresReasoning && !pricing.reasoning) return false;
    if (context.requiresVision && !pricing.vision) return false;
    if (context.contextLength > pricing.maxContextWindow) return false;
    return true;
  });

  if (candidates.length === 0) {
    // Fallback to most capable model if no perfect match
    return 'CLAUDE_OPUS';
  }

  // Score models based on complexity and budget
  const scoredModels = candidates.map(([model, pricing]) => {
    let score = 0;

    // Budget score (prefer cheaper models if budget constrained)
    const avgCost = (pricing.inputTokenPrice + pricing.outputTokenPrice) / 2;
    const budgetRatio = remainingBudget / estimatedBudget;
    const costScore = budgetRatio < 0.3 ? Math.max(0, 10 - avgCost) : 5; // Heavy penalty if low budget

    // Complexity score (prefer capable models for complex tasks)
    let complexityScore = 0;
    if (context.taskComplexity === 'simple') {
      complexityScore = 10 - Math.min(10, avgCost / 2); // Prefer cheap for simple
    } else if (context.taskComplexity === 'moderate') {
      complexityScore = 8; // Moderate preference
    } else {
      complexityScore = pricing.reasoning ? 10 : 5; // Prefer reasoning for complex
    }

    // Latency score (prefer fast models if latency sensitive)
    const latencyScore = context.latencySensitive ? Math.max(0, 10 - pricing.avgLatencyMs / 200) : 0;

    score = costScore * 0.4 + complexityScore * 0.4 + latencyScore * 0.2;

    return {
      model: model as AgentModel,
      score,
      pricing,
    };
  });

  // Sort by score and return top model
  scoredModels.sort((a, b) => b.score - a.score);

  return scoredModels[0].model;
}

/**
 * Calculate estimated cost for a task
 */
export function estimateTaskCost(model: AgentModel, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  const inputCost = (inputTokens / 1000000) * pricing.inputTokenPrice;
  const outputCost = (outputTokens / 1000000) * pricing.outputTokenPrice;
  return inputCost + outputCost;
}

/**
 * Get cost comparison across models
 */
export function compareModelCosts(
  inputTokens: number,
  outputTokens: number
): Array<{ model: AgentModel; cost: number }> {
  return Object.keys(MODEL_PRICING).map((model) => ({
    model: model as AgentModel,
    cost: estimateTaskCost(model as AgentModel, inputTokens, outputTokens),
  })).sort((a, b) => a.cost - b.cost);
}

/**
 * Get recommended model upgrade path for org
 */
export async function getModelRecommendations(
  organizationId: string
): Promise<{ currentModel: AgentModel; recommendedModel: AgentModel; savingsPercentage: number }[]> {
  // Get org's most-used models
  const metrics = await prisma.costMetric.findMany({
    where: { organizationId },
    select: { model: true, estimatedCostUSD: true },
  });

  const modelCosts = metrics.reduce(
    (acc, m) => {
      if (!acc[m.model]) acc[m.model] = 0;
      acc[m.model] += m.estimatedCostUSD;
      return acc;
    },
    {} as Record<string, number>
  );

  const recommendations = [];
  for (const [model, totalCost] of Object.entries(modelCosts)) {
    const comparable = Object.entries(MODEL_PRICING).filter(([_m, p]) => {
      const currentPricing = MODEL_PRICING[model as AgentModel];
      if (!currentPricing) return false;
      return (
        p.reasoning === currentPricing.reasoning &&
        p.maxContextWindow >= currentPricing.maxContextWindow
      );
    });

    const cheapest = comparable.reduce((a, b) => (b[1].inputTokenPrice < a[1].inputTokenPrice ? b : a));
    const savings = ((totalCost - (totalCost * cheapest[1].inputTokenPrice) / MODEL_PRICING[model as AgentModel].inputTokenPrice) / totalCost) * 100;

    if (savings > 10) {
      recommendations.push({
        currentModel: model as AgentModel,
        recommendedModel: cheapest[0] as AgentModel,
        savingsPercentage: Math.round(savings),
      });
    }
  }

  return recommendations;
}
