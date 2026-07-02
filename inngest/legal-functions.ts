import { inngest } from './client';
import { prisma } from '@/lib/db';
import { getLegalModel, getModelVersion } from '@/lib/legal/model-router';
import { writeLegalAuditEvent, hashContent } from '@/lib/legal/audit';
import { buildDraftPrompt, buildRiskScanPrompt } from '@/lib/legal/prompts';
import { uploadToDms } from '@/lib/legal/dms';
import { HumanMessage } from '@langchain/core/messages';
import { RiskFlag, ContractType } from '@/lib/legal/types';

// ── 1. Generate Contract Draft ────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateContractDraft = inngest.createFunction(
  { id: 'legal/contract.draft', name: 'Generate Contract Draft', triggers: [{ event: 'legal/contract.draft.requested' }] },
  async (ctx: any) => {
    const { contractId, organizationId, contractType, jurisdiction, clientName, counterpartyName, matterValue, playbookId, additionalContext } = ctx.event.data;

    // Load playbook rules
    let playbookRules;
    if (playbookId) {
      const playbook = await prisma.legalPlaybook.findUnique({ where: { id: playbookId } });
      if (playbook) playbookRules = JSON.parse(playbook.rules).rules;
    }

    // Update status to drafting
    await prisma.legalContract.update({
      where: { id: contractId },
      data: { status: 'DRAFT' },
    });

    // Generate draft with AI
    const model = getLegalModel({ contractType: contractType as ContractType, matterValue });
    const prompt = buildDraftPrompt({
      contractType: contractType as ContractType,
      jurisdiction,
      clientName,
      counterpartyName,
      clientPosition: 'vendor',
      playbookRules,
      additionalContext,
    });
    const response = await model.invoke([new HumanMessage(prompt)]);
    const draftText = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Parse risk flags
    let riskFlags: RiskFlag[] = [];
    const match = draftText.match(/RISK FLAGS[\s\S]*?(\[[\s\S]*?\])/);
    if (match) {
      try { riskFlags = JSON.parse(match[1]); } catch { /* ignore */ }
    }

    // Save draft and audit event
    const outputHash = hashContent(draftText);
    await prisma.legalContract.update({
      where: { id: contractId },
      data: {
        status: 'PENDING_REVIEW',
        draftDocUrl: `draft:${contractId}`,
        draftText,
      },
    });

    await writeLegalAuditEvent({
      organizationId,
      contractId,
      actor: 'AI',
      actorModel: getModelVersion({ contractType: contractType as ContractType, matterValue }),
      action: 'draft_generated',
      outputHash,
      changesSummary: `Draft generated — ${riskFlags.length} risk flags`,
      metadata: { riskFlags, jurisdiction },
    });

    // Trigger attorney review
    await inngest.send({
      name: 'legal/attorney.review.requested',
      data: { contractId, organizationId, riskFlags, modelVersion: getModelVersion({ contractType: contractType as ContractType, matterValue }) },
    });

    return { contractId, riskFlagCount: riskFlags.length };
  }
);

// ── 2. Attorney Review Gate ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const requestAttorneyReview = inngest.createFunction(
  { id: 'legal/attorney.review.requested', name: 'Request Attorney Review', triggers: [{ event: 'legal/attorney.review.requested' }] },
  async (ctx: any) => {
    const { contractId, organizationId, riskFlags, modelVersion } = ctx.event.data;

    await prisma.contractReview.create({
      data: {
        contractId,
        reviewerUserId: 'pending-assignment',
        redlineDocUrl: `draft:${contractId}`,
        modelVersion,
        requestedAt: new Date(),
      },
    });

    await prisma.legalContract.update({
      where: { id: contractId },
      data: { status: 'PENDING_REVIEW' },
    });

    await writeLegalAuditEvent({
      organizationId,
      contractId,
      actor: 'system',
      action: 'attorney_review_requested',
      changesSummary: `Attorney review requested — ${(riskFlags ?? []).length} risk flags`,
      metadata: { riskFlags },
    });

    return { contractId, status: 'awaiting_attorney_review' };
  }
);

// ── 3. Process Attorney Decision ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const processAttorneyDecision = inngest.createFunction(
  { id: 'legal/attorney.decision.submitted', name: 'Process Attorney Decision', triggers: [{ event: 'legal/attorney.decision.submitted' }] },
  async (ctx: any) => {
    const { contractId, organizationId, reviewerUserId, decision, comments, clioMatterId, dmsProvider } = ctx.event.data;

    // Record decision
    await prisma.contractReview.updateMany({
      where: { contractId, decidedAt: null },
      data: { decision, comments, decidedAt: new Date() },
    });

    await writeLegalAuditEvent({
      organizationId,
      contractId,
      actor: reviewerUserId,
      action: decision === 'APPROVE' ? 'attorney_approved'
        : decision === 'REVISE' ? 'attorney_revision_requested'
        : 'attorney_escalated',
      changesSummary: comments ?? `Attorney decision: ${decision}`,
    });

    if (decision === 'APPROVE') {
      if (dmsProvider && clioMatterId) {
        const contract = await prisma.legalContract.findUnique({ where: { id: contractId } });
        if (contract) {
          try {
            const result = await uploadToDms({
              organizationId,
              provider: dmsProvider,
              fileName: `${contract.title.replace(/\s+/g, '_')}_FINAL.docx`,
              fileBuffer: Buffer.from(`Contract: ${contractId}`),
              clioMatterId,
            });
            await prisma.legalContract.update({
              where: { id: contractId },
              data: { status: 'APPROVED', dmsProvider, dmsDocumentId: result.documentId },
            });
            await writeLegalAuditEvent({
              organizationId, contractId, actor: 'system',
              action: 'dms_uploaded',
              changesSummary: `Uploaded to ${dmsProvider} — doc ID: ${result.documentId}`,
            });
          } catch (err) {
            console.error('[DMS Upload Error]', err);
          }
        }
      } else {
        await prisma.legalContract.update({
          where: { id: contractId },
          data: { status: 'APPROVED' },
        });
      }
    } else if (decision === 'REVISE') {
      const contract = await prisma.legalContract.findUnique({ where: { id: contractId } });
      if (contract && contract.revisionCount >= 3) {
        // Auto-escalate after 3 revisions
        await prisma.legalContract.update({
          where: { id: contractId },
          data: { status: 'PENDING_REVIEW', revisionCount: { increment: 1 } },
        });
        await inngest.send({
          name: 'legal/attorney.review.requested',
          data: { contractId, organizationId, riskFlags: [], modelVersion: 'escalated' },
        });
      } else {
        await prisma.legalContract.update({
          where: { id: contractId },
          data: { status: 'REVISION_REQUESTED', revisionCount: { increment: 1 } },
        });
        await inngest.send({
          name: 'legal/contract.draft.requested',
          data: {
            contractId, organizationId,
            contractType: contract?.contractType ?? 'OTHER',
            jurisdiction: contract?.jurisdiction ?? 'CA',
            clientName: contract?.clioClientName ?? 'Client',
            counterpartyName: 'Counterparty',
            matterValue: contract?.matterValue ?? undefined,
            additionalContext: `ATTORNEY REVISION COMMENTS: ${comments}`,
          },
        });
      }
    }

    return { contractId, decision };
  }
);

// ── 4. Risk Scan ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const scanContractRisks = inngest.createFunction(
  { id: 'legal/contract.risk.scan', name: 'Scan Contract Risks', triggers: [{ event: 'legal/contract.risk.scan.requested' }] },
  async (ctx: any) => {
    const { contractId, organizationId, contractText, jurisdiction, matterValue } = ctx.event.data;

    const model = getLegalModel({ contractType: 'OTHER', matterValue });
    const prompt = buildRiskScanPrompt(contractText, jurisdiction);
    const response = await model.invoke([new HumanMessage(prompt)]);
    const text = typeof response.content === 'string' ? response.content : '';

    let riskFlags: RiskFlag[] = [];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) riskFlags = JSON.parse(match[0]);
    } catch { /* ignore */ }

    await writeLegalAuditEvent({
      organizationId, contractId,
      actor: 'AI',
      actorModel: getModelVersion({ contractType: 'OTHER', matterValue }),
      action: 'risk_scan_completed',
      changesSummary: `${riskFlags.length} risk flags identified`,
      metadata: { riskFlags },
    });

    return { contractId, riskFlags };
  }
);
