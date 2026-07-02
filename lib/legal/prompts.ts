import { ContractType } from './types';
import { ClauseRule } from './types';

export function buildDraftPrompt(params: {
  contractType: ContractType;
  jurisdiction: string;
  clientName: string;
  counterpartyName: string;
  clientPosition: 'vendor' | 'customer' | 'employer' | 'employee' | 'landlord' | 'tenant';
  playbookRules?: ClauseRule[];
  additionalContext?: string;
}): string {
  const rulesBlock = params.playbookRules?.length
    ? `\nFIRM PLAYBOOK RULES:\n${params.playbookRules.map(r => `- ${r.clauseType}: ${r.position} — ${r.standardLanguage}`).join('\n')}`
    : '';

  return `You are a senior transactional attorney licensed in ${params.jurisdiction}.
Draft a ${params.contractType.replace(/_/g, ' ')} agreement for the following matter.

CLIENT: ${params.clientName} (${params.clientPosition} position)
COUNTERPARTY: ${params.counterpartyName}
GOVERNING LAW: ${params.jurisdiction}
${rulesBlock}
${params.additionalContext ? `\nADDITIONAL CONTEXT:\n${params.additionalContext}` : ''}

INSTRUCTIONS:
- Draft from the client's position — favor client interests within market-standard norms.
- Include all standard clauses for this contract type.
- Flag any clause where you deviate from standard market terms with a comment: [ATTORNEY REVIEW: reason].
- Output format: plain contract text with numbered sections. Do not include disclaimers or meta-commentary.
- End with a RISK FLAGS section listing any high-risk clauses in JSON format:
  [{"clauseType": "...", "severity": "low|medium|high", "description": "...", "suggestedAction": "..."}]`;
}

export function buildRedlinePrompt(params: {
  clauseType: string;
  incomingClause: string;
  firmStandardClause: string;
  firmPosition: string;
  jurisdiction: string;
}): string {
  return `You are a legal editor. Compare the incoming contract clause against the firm's standard position and produce a minimally-edited version that achieves the firm's position.

CLAUSE TYPE: ${params.clauseType}
JURISDICTION: ${params.jurisdiction}
FIRM POSITION: ${params.firmPosition}

INCOMING CLAUSE:
${params.incomingClause}

FIRM STANDARD CLAUSE:
${params.firmStandardClause}

INSTRUCTIONS:
- Output ONLY the modified clause text. No commentary, no explanation.
- Make the minimum edits necessary to achieve the firm's position.
- Do NOT add new provisions that were not in the incoming clause unless the firm standard requires them.
- Do NOT fabricate legal concepts or cite non-existent statutes.
- Preserve the counterparty's numbering and formatting style.`;
}

export function buildRiskScanPrompt(contractText: string, jurisdiction: string): string {
  return `You are a senior transactional attorney. Review this contract and identify high-risk clauses.

JURISDICTION: ${jurisdiction}

CONTRACT:
${contractText.slice(0, 8000)}

Output ONLY a JSON array of risk flags:
[
  {
    "clauseType": "indemnification|liability_cap|ip_assignment|governing_law|termination|other",
    "severity": "low|medium|high",
    "description": "What the clause says and why it is risky",
    "suggestedAction": "Specific edit or deletion to reduce risk"
  }
]

Identify only genuine legal risks. Do not flag standard boilerplate.`;
}
