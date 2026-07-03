// ─── PIXEL PILOT · HIGGSFIELD CREATIVE FORGE ─────────────────────────────────
// POST /api/pixel-pilot/higgsfield
// Body: { brand, product, vibe, channel }
// Kicks off a Higgsfield render (or a shaped simulation when no key is set) and
// returns the CreativeJob the Forge polls/animates on screen.

import { NextRequest, NextResponse } from 'next/server';
import {
  generateCreative,
  higgsfieldIsLive,
  VIBES,
  type CreativeRequest,
  type CreativeVibe,
} from '@/pixel-pilot';

const CHANNELS: CreativeRequest['channel'][] = ['tiktok', 'reels', 'shorts', 'feed'];
const VIBE_IDS = VIBES.map((v) => v.id);

export async function POST(req: NextRequest) {
  let body: Partial<CreativeRequest>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const brand = (body.brand ?? '').toString().trim().slice(0, 80);
  const product = (body.product ?? '').toString().trim().slice(0, 280);
  const vibe = (body.vibe ?? 'kinetic') as CreativeVibe;
  const channel = (body.channel ?? 'tiktok') as CreativeRequest['channel'];

  if (!brand) {
    return NextResponse.json({ error: 'brand is required' }, { status: 400 });
  }
  if (!VIBE_IDS.includes(vibe)) {
    return NextResponse.json({ error: 'unknown vibe', valid: VIBE_IDS }, { status: 400 });
  }
  if (!CHANNELS.includes(channel)) {
    return NextResponse.json({ error: 'unknown channel', valid: CHANNELS }, { status: 400 });
  }

  try {
    const job = await generateCreative({ brand, product: product || brand, vibe, channel });
    return NextResponse.json({ job, live: higgsfieldIsLive() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Render failed' },
      { status: 502 }
    );
  }
}
