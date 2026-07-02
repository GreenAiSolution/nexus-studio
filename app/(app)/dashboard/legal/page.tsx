'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NewContractModal } from '@/components/legal/new-contract-modal';
import { ContractCard } from '@/components/legal/contract-card';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-zinc-700 text-zinc-300',
  PENDING_REVIEW: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  IN_REVIEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  REVISION_REQUESTED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  APPROVED: 'bg-green-500/20 text-green-400 border-green-500/30',
  EXECUTED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ARCHIVED: 'bg-zinc-800 text-zinc-500',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  IN_REVIEW: 'In Review',
  REVISION_REQUESTED: 'Needs Revision',
  APPROVED: 'Approved',
  EXECUTED: 'Executed',
  ARCHIVED: 'Archived',
};

const STATUSES = ['PENDING_REVIEW', 'IN_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'DRAFT'] as const;
type ContractStatus = typeof STATUSES[number];

export default function LegalPage() {
  const [showNewModal, setShowNewModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ContractStatus | undefined>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['legal.listContracts', statusFilter],
    queryFn: () => trpc.legal.listContracts.query({ status: statusFilter, limit: 20 }),
  });

  const contracts = data?.contracts ?? [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Legal Assistant</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            AI-powered contract drafting &amp; redlining — attorney reviewed, ABA compliant
          </p>
        </div>
        <Button
          onClick={() => setShowNewModal(true)}
          className="bg-[#6C63FF] hover:bg-[#5a52d5] text-white"
        >
          + New Contract
        </Button>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter(undefined)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            !statusFilter
              ? 'bg-[#6C63FF]/20 text-[#6C63FF] border-[#6C63FF]/40'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'
          }`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? undefined : s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === s
                ? STATUS_COLORS[s]
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending Review', status: 'PENDING_REVIEW', color: 'text-amber-400' },
          { label: 'Approved', status: 'APPROVED', color: 'text-green-400' },
          { label: 'In Revision', status: 'REVISION_REQUESTED', color: 'text-orange-400' },
          { label: 'Total', status: undefined, color: 'text-white' },
        ].map((stat) => {
          const count = contracts.filter(c => stat.status ? c.status === stat.status : true).length;
          return (
            <Card key={stat.label} className="bg-zinc-900 border-zinc-800 p-4">
              <p className={`text-2xl font-bold ${stat.color}`}>{count}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Contract list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800 border-dashed p-12 text-center">
          <div className="text-4xl mb-3">⚖️</div>
          <p className="text-zinc-400 text-sm">No contracts yet.</p>
          <p className="text-zinc-600 text-xs mt-1">
            Click &ldquo;New Contract&rdquo; to draft your first AI-assisted agreement.
          </p>
          <Button
            onClick={() => setShowNewModal(true)}
            className="mt-4 bg-[#6C63FF] hover:bg-[#5a52d5] text-white text-sm"
          >
            Draft First Contract
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              statusColors={STATUS_COLORS}
              statusLabels={STATUS_LABELS}
              onDecisionSubmitted={refetch}
            />
          ))}
        </div>
      )}

      {showNewModal && (
        <NewContractModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => { setShowNewModal(false); refetch(); }}
        />
      )}
    </div>
  );
}
