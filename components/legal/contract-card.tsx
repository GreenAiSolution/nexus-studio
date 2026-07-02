'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc-client';

interface ContractCardProps {
  contract: {
    id: string;
    title: string;
    contractType: string;
    status: string;
    jurisdiction?: string | null;
    clioClientName?: string | null;
    revisionCount: number;
    matterValue?: number | null;
    createdAt: Date | string;
    draftText?: string | null;
    reviews: Array<{ decision?: string | null; comments?: string | null; decidedAt?: Date | string | null }>;
  };
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
  onDecisionSubmitted: () => void;
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  NDA: 'NDA', MSA: 'MSA', SOW: 'SOW', EMPLOYMENT: 'Employment',
  COMMERCIAL_LEASE: 'Commercial Lease', SAAS_AGREEMENT: 'SaaS Agreement',
  VENDOR_AGREEMENT: 'Vendor Agreement', INDEPENDENT_CONTRACTOR: 'Independent Contractor', OTHER: 'Other',
};

export function ContractCard({ contract, statusColors, statusLabels, onDecisionSubmitted }: ContractCardProps) {
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [comments, setComments] = useState('');

  const submitDecision = useMutation({
    mutationFn: (vars: { decision: 'APPROVE' | 'REVISE' | 'ESCALATE' | 'REJECT'; comments?: string }) =>
      trpc.legal.submitReviewDecision.mutate({ contractId: contract.id, ...vars }),
    onSuccess: () => { setShowReviewPanel(false); setComments(''); onDecisionSubmitted(); },
  });

  const isPendingReview = contract.status === 'PENDING_REVIEW' || contract.status === 'IN_REVIEW';
  const latestReview = contract.reviews[0];

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white truncate">{contract.title}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[contract.status] ?? 'bg-zinc-700 text-zinc-300'}`}>
              {statusLabels[contract.status] ?? contract.status}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700">
              {CONTRACT_TYPE_LABELS[contract.contractType] ?? contract.contractType}
            </span>
            {contract.jurisdiction && (
              <span className="text-[10px] text-zinc-500">{contract.jurisdiction}</span>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-500">
            {contract.clioClientName && <span>Client: {contract.clioClientName}</span>}
            {contract.matterValue && (
              <span className={contract.matterValue > 1_000_000 ? 'text-amber-400' : ''}>
                ${contract.matterValue.toLocaleString()}
                {contract.matterValue > 1_000_000 && ' · Opus 4.8'}
              </span>
            )}
            {contract.revisionCount > 0 && (
              <span className="text-orange-400">Rev {contract.revisionCount}</span>
            )}
            <span>{new Date(contract.createdAt).toLocaleDateString()}</span>
          </div>

          {latestReview?.comments && (
            <p className="mt-2 text-xs text-zinc-400 italic border-l-2 border-zinc-700 pl-2">
              &ldquo;{latestReview.comments}&rdquo;
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPendingReview && (
            <Button
              size="sm"
              onClick={() => setShowReviewPanel(!showReviewPanel)}
              className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"
            >
              Review
            </Button>
          )}
          {contract.draftText && (
            <button
              onClick={() => setShowDraft(!showDraft)}
              className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-zinc-800 transition-colors border border-zinc-700"
            >
              {showDraft ? 'Hide Draft' : 'View Draft'}
            </button>
          )}
        </div>
      </div>

      {/* Draft Viewer */}
      {showDraft && contract.draftText && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <p className="text-xs font-medium text-zinc-300 mb-2">AI-Generated Draft</p>
          <pre className="whitespace-pre-wrap text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg p-4 max-h-[500px] overflow-y-auto font-mono leading-relaxed">
            {contract.draftText}
          </pre>
        </div>
      )}

      {/* Attorney Review Panel — ABA Rule 5.3 gate */}
      {showReviewPanel && (
        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
          <p className="text-xs font-medium text-zinc-300">Attorney Review Gate — ABA Rule 5.3</p>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add comments or revision instructions..."
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => submitDecision.mutate({ decision: 'APPROVE', comments })}
              disabled={submitDecision.isPending}
              className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30"
            >
              ✓ Approve
            </Button>
            <Button
              size="sm"
              onClick={() => submitDecision.mutate({ decision: 'REVISE', comments })}
              disabled={submitDecision.isPending || !comments.trim()}
              className="text-xs bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30"
            >
              ↩ Revise
            </Button>
            <Button
              size="sm"
              onClick={() => submitDecision.mutate({ decision: 'ESCALATE', comments })}
              disabled={submitDecision.isPending}
              className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
            >
              ↑ Escalate
            </Button>
          </div>
          <p className="text-[10px] text-zinc-600">
            All decisions are logged to an immutable audit trail per ABA Opinion 512 (2024).
          </p>
        </div>
      )}
    </Card>
  );
}
