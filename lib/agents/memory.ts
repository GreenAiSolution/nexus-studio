/**
 * NEXUS AI — Agent Memory System
 *
 * Persistent conversation memory with conversation history,
 * entity extraction, and relevance filtering.
 */

import { prisma } from '@/lib/db';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
  cost?: number;
}

export interface EntityMention {
  name: string;
  type: string; // person, company, project, etc.
  context: string;
  confidence: number;
}

export interface MemoryContext {
  agentId: string;
  organizationId: string;
  conversationId?: string;
  maxMessages?: number;
  maxTokens?: number;
}

/**
 * Retrieve conversation history
 */
export async function getConversationHistory(
  agentId: string,
  organizationId: string,
  conversationId?: string,
  maxMessages: number = 10
): Promise<ConversationMessage[]> {
  // In production, this would query from a dedicated conversation store
  // For now, use task execution logs as conversation history

  const executions = await prisma.taskExecution.findMany({
    where: {
      agentId,
      organizationId: organizationId,
    },
    orderBy: { createdAt: 'desc' },
    take: maxMessages,
    select: {
      input: true,
      output: true,
      createdAt: true,
      inputTokens: true,
      costUSD: true,
    },
  });

  const history: ConversationMessage[] = [];

  // Reverse to get chronological order
  for (const exec of executions.reverse()) {
    if (exec.input) {
      history.push({
        role: 'user',
        content: exec.input,
        timestamp: exec.createdAt,
        tokens: exec.inputTokens,
      });
    }

    if (exec.output) {
      history.push({
        role: 'assistant',
        content: exec.output,
        timestamp: exec.createdAt,
        cost: exec.costUSD,
      });
    }
  }

  return history;
}

/**
 * Extract entities from text
 */
export function extractEntities(text: string): EntityMention[] {
  const entities: EntityMention[] = [];

  // Email pattern
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex) || [];
  emails.forEach((email) => {
    entities.push({
      name: email,
      type: 'email',
      context: extractContext(text, email),
      confidence: 0.95,
    });
  });

  // Phone pattern
  const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
  const phones = text.match(phoneRegex) || [];
  phones.forEach((phone) => {
    entities.push({
      name: phone,
      type: 'phone',
      context: extractContext(text, phone),
      confidence: 0.9,
    });
  });

  // Company names (basic pattern - in production, use NLP)
  const companyKeywords = ['Inc', 'LLC', 'Corp', 'Co', 'Ltd', 'Company'];
  const companyRegex = new RegExp(
    `\\b\\w+\\s+(${companyKeywords.join('|')})\\b`,
    'gi'
  );
  const companies = text.match(companyRegex) || [];
  companies.forEach((company) => {
    entities.push({
      name: company,
      type: 'company',
      context: extractContext(text, company),
      confidence: 0.7,
    });
  });

  return entities;
}

/**
 * Extract surrounding context for entity
 */
function extractContext(text: string, entity: string): string {
  const index = text.indexOf(entity);
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + entity.length + 50);

  return text.substring(start, end).trim();
}

/**
 * Summarize conversation for context window
 */
export function summarizeConversation(
  messages: ConversationMessage[],
  maxTokens: number = 500
): string {
  if (messages.length === 0) return '';

  // Simple summarization: extract key points from assistant responses
  const keyPoints: string[] = [];
  let tokenCount = 0;

  for (const msg of messages) {
    if (msg.role === 'assistant' && msg.tokens && msg.tokens < 100) {
      // Extract first sentence from assistant response
      const sentences = msg.content.split(/[.!?]+/);
      if (sentences[0]) {
        const trimmed = sentences[0].trim();
        const trimmedTokens = Math.ceil(trimmed.length / 4);

        if (tokenCount + trimmedTokens <= maxTokens) {
          keyPoints.push(trimmed);
          tokenCount += trimmedTokens;
        } else {
          break;
        }
      }
    }
  }

  if (keyPoints.length === 0) {
    return 'No previous context';
  }

  return `Previous conversation summary:\n${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
}

/**
 * Filter relevant history based on query
 */
export function filterRelevantHistory(
  query: string,
  history: ConversationMessage[],
  maxMessages: number = 5
): ConversationMessage[] {
  if (history.length === 0) return [];

  // Simple relevance scoring based on keyword overlap
  const queryWords = new Set(
    query.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  );

  const scored = history.map((msg) => {
    const msgWords = new Set(
      msg.content.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    );

    // Calculate Jaccard similarity
    const intersection = new Set([...queryWords].filter((x) => msgWords.has(x)));
    const union = new Set([...queryWords, ...msgWords]);
    const similarity = union.size > 0 ? intersection.size / union.size : 0;

    return { msg, similarity };
  });

  // Sort by relevance and recency
  scored.sort((a, b) => {
    const simDiff = b.similarity - a.similarity;
    if (Math.abs(simDiff) > 0.1) return simDiff;

    return b.msg.timestamp.getTime() - a.msg.timestamp.getTime();
  });

  return scored.slice(0, maxMessages).map((s) => s.msg);
}

/**
 * Format memory context for LLM prompt
 */
export function formatMemoryContext(
  messages: ConversationMessage[],
  entities: EntityMention[] = []
): string {
  let context = '';

  if (messages.length > 0) {
    context += '## Recent Conversation\n';
    messages.forEach((msg) => {
      context += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });
    context += '\n';
  }

  if (entities.length > 0) {
    context += '## Known Entities\n';
    entities
      .filter((e) => e.confidence > 0.7)
      .forEach((e) => {
        context += `- ${e.name} (${e.type}): ${e.context}\n`;
      });
  }

  return context || 'No previous context';
}
