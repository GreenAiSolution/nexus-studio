// ─── PIXEL PILOT · n8n WORKFLOW TRIGGER ──────────────────────────────────────
// POST /api/pixel-pilot/workflows/[id]
// Forwards a payload to the workflow's n8n webhook. With no N8N_BASE_URL set it
// returns a dry-run receipt so the demo runs end to end without an n8n instance.

import { NextRequest, NextResponse } from 'next/server';
import { getWorkflow, WORKFLOWS } from '@/pixel-pilot';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workflow = getWorkflow(id);

  if (!workflow) {
    return NextResponse.json(
      { error: 'Unknown workflow', valid: WORKFLOWS.map((w) => w.id) },
      { status: 404 }
    );
  }

  let payload: unknown = {};
  try {
    payload = await req.json();
  } catch {
    // Empty body is fine — some triggers carry no payload.
  }

  const base = process.env.N8N_BASE_URL;
  if (!base) {
    return NextResponse.json({
      ok: true,
      mode: 'dry-run',
      workflow: { id: workflow.id, name: workflow.name },
      wouldPost: `${'{N8N_BASE_URL}'}${workflow.webhookPath}`,
      receivedAt: new Date().toISOString(),
    });
  }

  try {
    const res = await fetch(`${base}${workflow.webhookPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { 'x-pp-signature': process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({ source: 'pixel-pilot', workflow: workflow.id, payload }),
    });

    return NextResponse.json({
      ok: res.ok,
      mode: 'live',
      status: res.status,
      workflow: { id: workflow.id, name: workflow.name },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Trigger failed' },
      { status: 502 }
    );
  }
}
