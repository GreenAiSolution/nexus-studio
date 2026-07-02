import { ChatAnthropic } from '@langchain/anthropic';
import { ContractType } from './types';

const COMPLEX_CONTRACT_TYPES: ContractType[] = ['MSA', 'EMPLOYMENT', 'COMMERCIAL_LEASE'];

const COMPLEX_CONTRACT_THRESHOLD = 1_000_000;

interface ModelRouterInput {
  contractType: ContractType;
  matterValue?: number;
  revisionCount?: number;
  jurisdictionCount?: number;
}

function shouldUseOpus(input: ModelRouterInput): boolean {
  if (input.matterValue && input.matterValue > COMPLEX_CONTRACT_THRESHOLD) return true;
  if (input.revisionCount && input.revisionCount > 2) return true;
  if (input.jurisdictionCount && input.jurisdictionCount > 1) return true;
  if (COMPLEX_CONTRACT_TYPES.includes(input.contractType)) return true;
  return false;
}

export function getLegalModel(input: ModelRouterInput): ChatAnthropic {
  const useOpus = shouldUseOpus(input);

  return new ChatAnthropic({
    model: useOpus ? 'claude-opus-4-8' : 'claude-sonnet-4-6',
    temperature: 0.1, // low temp for legal precision
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxTokens: useOpus ? 8000 : 4000,
  });
}

export function getModelVersion(input: ModelRouterInput): string {
  return shouldUseOpus(input) ? 'claude-opus-4-8' : 'claude-sonnet-4-6';
}
