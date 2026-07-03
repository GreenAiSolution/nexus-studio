# Pixel Pilot — the autonomous media buyer

The premium sub-brand inside Nexus Studio. Pixel Pilot flies a brand's paid media
(Meta, Google, TikTok) to **real profit** — 24/7, hands-off — and forges its own
creative with Higgsfield along the way.

This folder is the **engine**: pure data + wiring, no React. The **surface** lives
in `app/pixel-pilot/*` and `components/pixel-pilot/*` and imports everything from
here via the `@/pixel-pilot` barrel.

## Layout

| File | Role |
| --- | --- |
| `connectors.ts` | The 4 connectors (Meta Ads, Google Ads, TikTok Ads, Shopify) as fully-typed OAuth definitions + `buildAuthUrl()`. |
| `services.ts` | All 10 services on the Flight Deck — single source of truth for the marketing surface and the 3D orbit. |
| `workflows.ts` | Real n8n workflow graphs (nodes + connections) + webhook paths — the automation spine. |
| `higgsfield.ts` | Higgsfield creative client. Real render when keyed; a shaped simulation otherwise. |
| `creative-apps.ts` | The in-platform apps a client opens (Creative Forge, Genome Lab, …). |
| `pricing.ts` | Premium retainer + performance tiers. |
| `index.ts` | Barrel + `PIXEL_PILOT` brand constants. |

## Wired endpoints

| Route | Does |
| --- | --- |
| `GET /api/pixel-pilot/connectors/[provider]` | Mints a live OAuth consent URL (302) or a legible 503 when creds are missing. Sets a CSRF `state` cookie. |
| `POST /api/pixel-pilot/higgsfield` | Fires a Higgsfield render for the Creative Forge. |
| `POST /api/pixel-pilot/workflows/[id]` | Triggers an n8n workflow webhook (dry-run receipt when `N8N_BASE_URL` is unset). |

## Environment (all optional — the platform degrades gracefully)

```
# Connectors
META_ADS_CLIENT_ID / META_ADS_CLIENT_SECRET
GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET
TIKTOK_ADS_CLIENT_ID / TIKTOK_ADS_CLIENT_SECRET
SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET

# Creative
HIGGSFIELD_API_KEY        # HIGGSFIELD_API_URL optional, defaults to api.higgsfield.ai/v1

# Automation
N8N_BASE_URL              # N8N_WEBHOOK_SECRET optional (sent as x-pp-signature)
```

Nothing here is required to build or to render the marketing site — every
integration checks for its credentials at request time and falls back to a
believable simulation, so the site is always demoable.

Live at **`/pixel-pilot`**.
