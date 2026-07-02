'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CONTRACT_TYPES = [
  { value: 'NDA', label: 'Non-Disclosure Agreement (NDA)' },
  { value: 'MSA', label: 'Master Service Agreement (MSA)' },
  { value: 'SOW', label: 'Statement of Work (SOW)' },
  { value: 'EMPLOYMENT', label: 'Employment Agreement' },
  { value: 'COMMERCIAL_LEASE', label: 'Commercial Lease' },
  { value: 'SAAS_AGREEMENT', label: 'SaaS Agreement' },
  { value: 'VENDOR_AGREEMENT', label: 'Vendor Agreement' },
  { value: 'INDEPENDENT_CONTRACTOR', label: 'Independent Contractor Agreement' },
] as const;

const US_JURISDICTIONS = ['CA', 'NY', 'DE', 'TX', 'FL', 'IL', 'WA', 'MA', 'CO', 'GA'];

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function NewContractModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    title: '',
    contractType: 'NDA' as typeof CONTRACT_TYPES[number]['value'],
    jurisdiction: 'CA',
    clientName: '',
    counterpartyName: '',
    matterValue: '',
    additionalContext: '',
  });

  const createContract = useMutation({
    mutationFn: () => trpc.legal.createContract.mutate({
      title: form.title,
      contractType: form.contractType,
      jurisdiction: form.jurisdiction,
      clientName: form.clientName,
      counterpartyName: form.counterpartyName,
      matterValue: form.matterValue ? parseFloat(form.matterValue) : undefined,
      additionalContext: form.additionalContext || undefined,
    }),
    onSuccess: onCreated,
  });

  const matterValueNum = form.matterValue ? parseFloat(form.matterValue) : undefined;
  const usesOpus = matterValueNum && matterValueNum > 1_000_000;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createContract.mutate();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">New Contract</h2>
              <p className="text-xs text-zinc-400 mt-0.5">AI drafts · Attorney reviews · ABA compliant</p>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-xl leading-none">×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Contract Title</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. NDA with Acme Corp"
              required
              className="bg-zinc-800 border-zinc-700 text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Contract Type</label>
              <select
                value={form.contractType}
                onChange={(e) => setForm({ ...form, contractType: e.target.value as typeof form.contractType })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6C63FF]"
              >
                {CONTRACT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Jurisdiction</label>
              <select
                value={form.jurisdiction}
                onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6C63FF]"
              >
                {US_JURISDICTIONS.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Client Name</label>
              <Input
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                placeholder="Your client"
                required
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Counterparty</label>
              <Input
                value={form.counterpartyName}
                onChange={(e) => setForm({ ...form, counterpartyName: e.target.value })}
                placeholder="Other party"
                required
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">
              Matter Value (USD)
              {usesOpus && (
                <span className="ml-2 text-amber-400">&gt;$1M → Claude Opus 4.8 escalated</span>
              )}
            </label>
            <Input
              value={form.matterValue}
              onChange={(e) => setForm({ ...form, matterValue: e.target.value })}
              placeholder="Optional — triggers Opus above $1M"
              type="number"
              className="bg-zinc-800 border-zinc-700 text-white text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Additional Context</label>
            <textarea
              value={form.additionalContext}
              onChange={(e) => setForm({ ...form, additionalContext: e.target.value })}
              placeholder="Special terms, deal points, prior negotiation context..."
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] resize-none"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <Button
              type="submit"
              disabled={createContract.isPending}
              className="flex-1 bg-[#6C63FF] hover:bg-[#5a52d5] text-white text-sm"
            >
              {createContract.isPending ? 'Generating Draft...' : '⚡ Generate Draft'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm"
            >
              Cancel
            </Button>
          </div>

          <p className="text-[10px] text-zinc-600 text-center">
            AI draft requires mandatory attorney review before use · All actions audit-logged per ABA Opinion 512 (2024)
          </p>
        </form>
      </div>
    </div>
  );
}
