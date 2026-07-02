import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { AgentModel } from '@prisma/client';

const modelConfigs = {
  CLAUDE_HAIKU: {
    model: 'claude-3-haiku-20240307',
    provider: 'anthropic',
  },
  CLAUDE_SONNET: {
    model: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
  },
  CLAUDE_OPUS: {
    model: 'claude-3-opus-20250219',
    provider: 'anthropic',
  },
  GPT_4O: {
    model: 'gpt-4o',
    provider: 'openai',
  },
  GEMINI_PRO: {
    model: 'gpt-4o',
    provider: 'openai', // Fallback to OpenAI
  },
  LLAMA_70B: {
    model: 'gpt-4o',
    provider: 'openai', // Fallback
  },
  MISTRAL_LARGE: {
    model: 'gpt-4o',
    provider: 'openai', // Fallback
  },
};

export function getLanguageModel(agentModel: AgentModel, temperature: number = 0.7) {
  const config = modelConfigs[agentModel];

  if (config.provider === 'anthropic') {
    return new ChatAnthropic({
      modelName: config.model,
      temperature,
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  return new ChatOpenAI({
    modelName: config.model,
    temperature,
    apiKey: process.env.OPENAI_API_KEY,
  });
}
