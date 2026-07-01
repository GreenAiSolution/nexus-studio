# NEXUS Studio

An immersive **3D studio** where customers sign in, design their AI workforce,
and activate it — a cinematic, high-end buying experience.

Sign in → **Enter** → **Choose your workforce** (living 3D crystals) →
**Customize** add-on services → **Review** → **Activate** (payment). A card is
only ever collected at the final step.

## Stack

- **Next.js 16** (App Router) + **React 19** + TypeScript
- **Three.js** via **@react-three/fiber**, **drei**, and **postprocessing** (bloom)
- **Framer Motion** for stage transitions
- **Tailwind CSS v4**

Zero external services — no database, no auth provider, no API keys. Sign-in is
self-contained (any credentials open the studio); real auth and Stripe Checkout
drop into `lib/session.ts` and the `handleActivate` step without touching the UI.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

## Deploy

Push to any Git host and import into **Vercel** — it's a stock Next.js app with
no environment variables required.

## Structure

```
app/
  page.tsx            # self-contained sign-in
  studio/page.tsx     # the 5-stage 3D experience
  studio/layout.tsx   # full-bleed chrome-free shell
components/studio/
  studio-canvas.tsx   # R3F scene: nebula + plan crystals + bloom
  catalog.ts          # plans, add-ons, pricing math
lib/session.ts        # client-only "who's signed in"
```
