import { prisma } from '@/lib/db';
import { AuditEventInput } from './types';
import { createHash } from 'crypto';

export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export async function writeLegalAuditEvent(input: AuditEventInput): Promise<void> {
  await prisma.legalAuditEvent.create({
    data: {
      organizationId: input.organizationId,
      contractId: input.contractId,
      actor: input.actor,
      actorModel: input.actorModel,
      action: input.action,
      inputHash: input.inputHash,
      outputHash: input.outputHash,
      changesSummary: input.changesSummary,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
