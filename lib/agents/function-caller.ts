/**
 * NEXUS AI — Function Calling System
 *
 * Enables agents to call tools (Slack, Salesforce, etc.) within responses.
 * Implements tool calling with LangChain's function_calls integration.
 */

import { prisma } from '@/lib/db';
import { AgentModel } from '@prisma/client';
import { getLanguageModel } from './models';
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts';

export interface ToolCall {
  name: string;
  args: Record<string, any>;
  id?: string;
}

export interface FunctionCallResult {
  toolCall: ToolCall;
  result: any;
  error?: string;
}

/**
 * Parse tool calls from model response
 */
export function parseToolCalls(content: string): ToolCall[] {
  try {
    // Look for JSON tool calls in response
    const toolCallRegex = /\{[\s\n]*"tool":\s*"([^"]+)"[\s\n]*,[\s\n]*"args":\s*({[^}]*})/g;
    const calls: ToolCall[] = [];
    let match;

    while ((match = toolCallRegex.exec(content)) !== null) {
      calls.push({
        name: match[1],
        args: JSON.parse(match[2]),
      });
    }

    return calls;
  } catch (err) {
    console.error('Failed to parse tool calls:', err);
    return [];
  }
}

/**
 * Execute a single tool call
 */
export async function executeTool(call: ToolCall, organizationId: string): Promise<FunctionCallResult> {
  try {
    switch (call.name) {
      case 'slack_post_message': {
        const { decryptToken } = await import('@/lib/integrations/oauth');
        const { postAgentResultToSlack } = await import('@/lib/integrations/slack');

        const integration = await prisma.integration.findFirst({
          where: { organizationId, provider: 'SLACK', isActive: true },
        });

        if (!integration?.accessToken) {
          return {
            toolCall: call,
            result: null,
            error: 'Slack integration not found',
          };
        }

        const token = decryptToken(integration.accessToken);
        const result = await postAgentResultToSlack(
          token,
          call.args.channel,
          call.args.threadTs || '',
          call.args.text,
          'AGENT',
          0,
          0
        );

        return {
          toolCall: call,
          result: result.ok ? { ts: result.timestamp } : null,
          error: result.ok ? undefined : result.error,
        };
      }

      case 'salesforce_query': {
        const { decryptToken } = await import('@/lib/integrations/oauth');
        const { fetchSalesforceContacts } = await import('@/lib/integrations/salesforce');

        const integration = await prisma.integration.findFirst({
          where: { organizationId, provider: 'SALESFORCE', isActive: true },
        });

        if (!integration?.accessToken) {
          return {
            toolCall: call,
            result: null,
            error: 'Salesforce integration not found',
          };
        }

        const token = decryptToken(integration.accessToken);
        const config = integration.config ? JSON.parse(integration.config) : {};
        const result = await fetchSalesforceContacts(token, config.instanceUrl, 20, 0);

        return {
          toolCall: call,
          result: result.ok ? result.contacts : null,
          error: result.ok ? undefined : result.error,
        };
      }

      case 'web_search': {
        // Placeholder: Implement Perplexity or Tavily
        return {
          toolCall: call,
          result: { results: [] },
          error: undefined,
        };
      }

      default:
        return {
          toolCall: call,
          result: null,
          error: `Unknown tool: ${call.name}`,
        };
    }
  } catch (err) {
    return {
      toolCall: call,
      result: null,
      error: err instanceof Error ? err.message : 'Tool execution failed',
    };
  }
}

/**
 * Execute all tool calls in sequence
 */
export async function executeAllToolCalls(
  calls: ToolCall[],
  organizationId: string
): Promise<FunctionCallResult[]> {
  const results: FunctionCallResult[] = [];

  for (const call of calls) {
    const result = await executeTool(call, organizationId);
    results.push(result);
  }

  return results;
}

/**
 * Format tool results for agent context
 */
export function formatToolResults(results: FunctionCallResult[]): string {
  return results
    .map((r) => {
      if (r.error) {
        return `Tool: ${r.toolCall.name}\nError: ${r.error}`;
      }
      return `Tool: ${r.toolCall.name}\nResult: ${JSON.stringify(r.result)}`;
    })
    .join('\n\n');
}

/**
 * Execute agent with tool calling support
 */
export async function executeAgentWithTools(
  agentId: string,
  organizationId: string,
  input: string,
  maxTurns: number = 5
): Promise<{
  finalResponse: string;
  toolCalls: ToolCall[];
  results: FunctionCallResult[];
  turnsUsed: number;
}> {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  const llm = getLanguageModel(agent.model, agent.temperature);
  const systemPrompt = SystemMessagePromptTemplate.fromTemplate(
    (agent.systemPrompt || '') +
      `

You can call tools by responding with JSON blocks like:
{"tool": "slack_post_message", "args": {"channel": "#channel", "text": "message"}}
{"tool": "salesforce_query", "args": {"query": "search term"}}
{"tool": "web_search", "args": {"query": "search query"}}

Call tools when needed to complete the task.`
  );

  const humanPrompt = HumanMessagePromptTemplate.fromTemplate('{input}');
  const prompt = ChatPromptTemplate.fromMessages([systemPrompt, humanPrompt]);

  let currentInput = input;
  const allToolCalls: ToolCall[] = [];
  const allResults: FunctionCallResult[] = [];

  for (let turn = 0; turn < maxTurns; turn++) {
    // Get agent response
    const response = await prompt.format({ input: currentInput });
    const messages = [
      { role: 'user' as const, content: response },
    ];

    // Parse tool calls from response
    const toolCalls = parseToolCalls(response);

    if (toolCalls.length === 0) {
      // No tool calls, return final response
      return {
        finalResponse: response,
        toolCalls: allToolCalls,
        results: allResults,
        turnsUsed: turn + 1,
      };
    }

    // Execute tools
    allToolCalls.push(...toolCalls);
    const results = await executeAllToolCalls(toolCalls, organizationId);
    allResults.push(...results);

    // Format results for next turn
    const toolResults = formatToolResults(results);
    currentInput = `${input}\n\n[Tool Results]\n${toolResults}`;
  }

  return {
    finalResponse: currentInput,
    toolCalls: allToolCalls,
    results: allResults,
    turnsUsed: maxTurns,
  };
}
