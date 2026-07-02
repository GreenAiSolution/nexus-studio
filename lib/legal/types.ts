export type ContractType =
  | 'NDA' | 'MSA' | 'SOW' | 'EMPLOYMENT' | 'COMMERCIAL_LEASE'
  | 'SAAS_AGREEMENT' | 'VENDOR_AGREEMENT' | 'INDEPENDENT_CONTRACTOR' | 'OTHER';

export type ContractStatus =
  | 'DRAFT' | 'PENDING_REVIEW' | 'IN_REVIEW' | 'REVISION_REQUESTED'
  | 'APPROVED' | 'EXECUTED' | 'ARCHIVED';

export type ReviewDecision = 'APPROVE' | 'REVISE' | 'ESCALATE' | 'REJECT';

export interface ClauseRule {
  clauseType: string;
  position: 'must-have' | 'acceptable-with-modification' | 'deal-breaker';
  standardLanguage: string;
  fallbackLanguage?: string;
  notes?: string;
}

export interface PlaybookRules {
  rules: ClauseRule[];
}

export interface DraftRequest {
  contractType: ContractType;
  jurisdiction: string;
  clientName: string;
  counterpartyName: string;
  matterValue?: number;
  clioMatterId?: string;
  playbookId?: string;
  additionalContext?: string;
}

export interface RedlineRequest {
  contractId: string;
  incomingDocUrl: string;
  playbookId?: string;
}

export interface AttorneyReviewPayload {
  contractId: string;
  threadId: string;
  redlineDocUrl: string;
  changeSummary: string;
  riskFlags: RiskFlag[];
  modelVersion: string;
}

export interface RiskFlag {
  clauseType: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedAction: string;
}

export interface ReviewDecisionPayload {
  contractId: string;
  threadId: string;
  decision: ReviewDecision;
  comments?: string;
}

export interface AuditEventInput {
  organizationId: string;
  contractId: string;
  actor: string;
  actorModel?: string;
  action: LegalAuditAction;
  inputHash?: string;
  outputHash?: string;
  changesSummary?: string;
  metadata?: Record<string, unknown>;
}

export type LegalAuditAction =
  | 'draft_generated'
  | 'redline_generated'
  | 'risk_scan_completed'
  | 'attorney_review_requested'
  | 'attorney_approved'
  | 'attorney_revision_requested'
  | 'attorney_escalated'
  | 'revision_applied'
  | 'dms_uploaded'
  | 'contract_executed';
