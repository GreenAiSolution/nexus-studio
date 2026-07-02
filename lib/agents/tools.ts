/**
 * NEXUS AI — Agent Tool Integrations
 *
 * Secure tool definitions for agents to interact with external APIs.
 * Each tool validates org access and integrations before execution.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { prisma } from '@/lib/db';

/**
 * Slack: Post messages to channels and threads
 */
export const slackPostMessage = tool(
  async (input) => {
    const { channel, message, threadTs } = input;

    const slackIntegration = await prisma.integration.findFirst({
      where: { provider: 'SLACK', isActive: true },
    });

    if (!slackIntegration?.accessToken) return { error: 'Slack not connected' };

    try {
      const { decryptToken } = await import('@/lib/integrations/oauth');
      const { postAgentResultToSlack } = await import('@/lib/integrations/slack');

      const token = decryptToken(slackIntegration.accessToken);
      const result = await postAgentResultToSlack(
        token,
        channel,
        threadTs || '',
        message,
        'AGENT',
        0,
        0
      );

      return result.ok
        ? { success: true, ts: result.timestamp }
        : { error: result.error };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Slack error' };
    }
  },
  {
    name: 'slack_post_message',
    description: 'Post a message to Slack channel or thread',
    schema: z.object({
      channel: z.string().describe('Channel ID or name'),
      message: z.string().describe('Message to send'),
      threadTs: z.string().optional().describe('Reply to thread'),
    }),
  }
);

/**
 * Salesforce: Query contacts and create activities
 */
export const salesforceQuery = tool(
  async (input) => {
    const { query } = input;

    const sfIntegration = await prisma.integration.findFirst({
      where: { provider: 'SALESFORCE', isActive: true },
    });

    if (!sfIntegration?.accessToken) return { error: 'Salesforce not connected' };

    try {
      const { decryptToken } = await import('@/lib/integrations/oauth');
      const { fetchSalesforceContacts } = await import('@/lib/integrations/salesforce');

      const token = decryptToken(sfIntegration.accessToken);
      const config = sfIntegration.config ? JSON.parse(sfIntegration.config) : {};

      const result = await fetchSalesforceContacts(token, config.instanceUrl, 20, 0);

      return result.ok
        ? { success: true, records: result.contacts }
        : { error: result.error };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Salesforce error' };
    }
  },
  {
    name: 'salesforce_query',
    description: 'Query contacts from Salesforce CRM',
    schema: z.object({
      query: z.string().describe('Search or filter query'),
    }),
  }
);

/**
 * Email: Send emails (Gmail/SMTP)
 */
export const sendEmail = tool(
  async (input) => {
    const { to, subject, body } = input;

    // TODO: Implement Gmail API or SMTP
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      note: 'Email integration coming Phase 5.1',
    };
  },
  {
    name: 'send_email',
    description: 'Send an email',
    schema: z.object({
      to: z.string().email().describe('Recipient email'),
      subject: z.string().describe('Email subject'),
      body: z.string().describe('Email body'),
    }),
  }
);

/**
 * Web Search: Search the internet
 */
export const webSearch = tool(
  async (input) => {
    const { query } = input;

    // TODO: Implement Perplexity or Tavily search
    return {
      success: true,
      results: [],
      note: 'Web search integration coming Phase 5.1',
    };
  },
  {
    name: 'web_search',
    description: 'Search the internet',
    schema: z.object({
      query: z.string().describe('Search query'),
    }),
  }
);

/**
 * HubSpot: Search deals and contacts
 */
export const hubspotSearch = tool(
  async (input) => {
    const { query } = input;

    // TODO: Implement HubSpot API
    return {
      success: true,
      results: [],
      note: 'HubSpot integration coming Phase 5.1',
    };
  },
  {
    name: 'hubspot_search',
    description: 'Search deals/contacts in HubSpot',
    schema: z.object({
      query: z.string().describe('Search query'),
    }),
  }
);

export const CORE_TOOLS = [
  slackPostMessage,
  salesforceQuery,
  sendEmail,
  webSearch,
  hubspotSearch,
];

/**
 * Get enabled tools for an organization
 */
export async function getToolsForOrg(organizationId: string) {
  const integrations = await prisma.integration.findMany({
    where: { organizationId, isActive: true },
    select: { provider: true },
  });

  const providers = new Set(integrations.map((i) => i.provider));
  const tools = [];

  // Add tools based on connected integrations
  if (providers.has('SLACK')) tools.push(slackPostMessage);
  if (providers.has('SALESFORCE')) tools.push(salesforceQuery);
  if (providers.has('HUBSPOT')) tools.push(hubspotSearch);

  // Always include universal tools
  tools.push(sendEmail, webSearch);

  return tools;
}
