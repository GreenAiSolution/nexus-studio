// ─── PIXEL PILOT · HIGGSFIELD CREATIVE AUTOMATION ────────────────────────────
// Higgsfield is our cinematic render farm. Point it at a brand and it returns
// scroll-stopping, motion-first product reels — the raw creative the Genome then
// recombines and the buyer ships. On the site this powers the "Creative Forge":
// a visitor drops a product, Pixel Pilot spins up an ad reel live.
//
// The client is env-driven (HIGGSFIELD_API_KEY / HIGGSFIELD_API_URL). With no key
// present it returns a deterministic simulated job so the on-site demo always
// renders something believable instead of erroring — real key, real render.

export interface CreativeRequest {
  /** Brand or product name. */
  readonly brand: string;
  /** Product URL or short description to anchor the render. */
  readonly product: string;
  /** Creative direction — maps to a Higgsfield motion preset. */
  readonly vibe: CreativeVibe;
  /** Target channel governs aspect ratio + pacing. */
  readonly channel: 'tiktok' | 'reels' | 'shorts' | 'feed';
}

export type CreativeVibe = 'kinetic' | 'luxe' | 'ugc' | 'surreal';

export interface CreativeJob {
  readonly id: string;
  readonly status: 'queued' | 'rendering' | 'ready';
  readonly brand: string;
  readonly vibe: CreativeVibe;
  readonly channel: CreativeRequest['channel'];
  readonly aspect: string;
  readonly durationSec: number;
  readonly preset: string;
  readonly previewUrl: string | null;
  readonly simulated: boolean;
  readonly createdAt: string;
}

export const VIBES: { id: CreativeVibe; name: string; preset: string; note: string }[] = [
  { id: 'kinetic', name: 'Kinetic', preset: 'higgs-motion-v3', note: 'Fast cuts, snap zooms, hook in 0.8s' },
  { id: 'luxe', name: 'Luxe', preset: 'higgs-cine-v2', note: 'Slow push-ins, volumetric light' },
  { id: 'ugc', name: 'UGC', preset: 'higgs-native-v4', note: 'Handheld, authentic, native-feel' },
  { id: 'surreal', name: 'Surreal', preset: 'higgs-dream-v1', note: 'Impossible physics, scroll-stopping' },
];

const CHANNEL_ASPECT: Record<CreativeRequest['channel'], { aspect: string; dur: number }> = {
  tiktok: { aspect: '9:16', dur: 9 },
  reels: { aspect: '9:16', dur: 12 },
  shorts: { aspect: '9:16', dur: 15 },
  feed: { aspect: '1:1', dur: 8 },
};

function presetFor(vibe: CreativeVibe): string {
  return VIBES.find((v) => v.id === vibe)?.preset ?? 'higgs-motion-v3';
}

export function higgsfieldIsLive(): boolean {
  return Boolean(process.env.HIGGSFIELD_API_KEY);
}

/**
 * Kick off a creative render. Returns a CreativeJob either from Higgsfield or,
 * absent credentials, a simulated-but-shaped job so the Forge demo never breaks.
 */
export async function generateCreative(req: CreativeRequest): Promise<CreativeJob> {
  const { aspect, dur } = CHANNEL_ASPECT[req.channel];
  const preset = presetFor(req.vibe);
  const base = {
    brand: req.brand,
    vibe: req.vibe,
    channel: req.channel,
    aspect,
    durationSec: dur,
    preset,
    createdAt: new Date().toISOString(),
  };

  if (!higgsfieldIsLive()) {
    return {
      id: `sim_${Math.random().toString(36).slice(2, 10)}`,
      status: 'rendering',
      previewUrl: null,
      simulated: true,
      ...base,
    };
  }

  const apiUrl = process.env.HIGGSFIELD_API_URL || 'https://api.higgsfield.ai/v1';
  const res = await fetch(`${apiUrl}/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.HIGGSFIELD_API_KEY}`,
    },
    body: JSON.stringify({
      preset,
      aspect_ratio: aspect,
      duration: dur,
      prompt: `${req.vibe} product ad for ${req.brand}. ${req.product}. Scroll-stopping hook, ${req.channel} native.`,
    }),
  });

  if (!res.ok) {
    throw new Error(`Higgsfield render failed (${res.status})`);
  }

  const data = (await res.json()) as { id?: string; status?: string; preview_url?: string };
  return {
    id: data.id ?? `hf_${Date.now()}`,
    status: (data.status as CreativeJob['status']) ?? 'queued',
    previewUrl: data.preview_url ?? null,
    simulated: false,
    ...base,
  };
}
