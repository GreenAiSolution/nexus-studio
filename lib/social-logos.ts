/**
 * Procedurally drawn social/platform logos on canvas → THREE.CanvasTexture.
 * Pure CSS/2D-canvas — no external assets, works offline, ships in JS bundle.
 *
 * Each draw routine targets a 512×512 rounded-square tile with the brand's
 * color and a recognizable mark. Designed to read clearly at small sizes.
 */

import * as THREE from "three";

export interface SocialPlatform {
  brand: string;
  name: string;
  hue: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { brand: "instagram", name: "Instagram", hue: "#E1306C" },
  { brand: "facebook", name: "Facebook", hue: "#1877F2" },
  { brand: "twitter", name: "Twitter/X", hue: "#000000" },
  { brand: "youtube", name: "YouTube", hue: "#FF0000" },
  { brand: "tiktok", name: "TikTok", hue: "#000000" },
  { brand: "linkedin", name: "LinkedIn", hue: "#0A66C2" },
  { brand: "snapchat", name: "Snapchat", hue: "#FFFC00" },
  { brand: "whatsapp", name: "WhatsApp", hue: "#25D366" },
  { brand: "pinterest", name: "Pinterest", hue: "#E60023" },
  { brand: "discord", name: "Discord", hue: "#5865F2" },
  { brand: "threads", name: "Threads", hue: "#000000" },
  { brand: "reddit", name: "Reddit", hue: "#FF4500" },
  { brand: "skype", name: "Skype", hue: "#00AFF0" },
  { brand: "vimeo", name: "Vimeo", hue: "#1AB7EA" },
  { brand: "tumblr", name: "Tumblr", hue: "#35465C" },
  { brand: "flickr", name: "Flickr", hue: "#FF0084" },
  { brand: "yelp", name: "Yelp", hue: "#D32323" },
  { brand: "myspace", name: "MySpace", hue: "#000000" },
  { brand: "googleplus", name: "Google+", hue: "#DB4437" },
  { brand: "livejournal", name: "LiveJournal", hue: "#00B0EA" },
  { brand: "foursquare", name: "Foursquare", hue: "#F94877" },
  { brand: "telegram", name: "Telegram", hue: "#26A5E4" },
  { brand: "spotify", name: "Spotify", hue: "#1DB954" },
  { brand: "twitch", name: "Twitch", hue: "#9146FF" },
];

// Texture cache so repeated draws are O(1)
const cache = new Map<string, THREE.CanvasTexture>();

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fillBackground(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient) {
  ctx.fillStyle = fill;
  roundRect(ctx, 30, 30, 452, 452, 96);
  ctx.fill();
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  color: string,
  font: string,
  yOffset = 0
) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 256 + yOffset);
}

function drawLogo(ctx: CanvasRenderingContext2D, brand: string) {
  switch (brand) {
    case "instagram": {
      const grad = ctx.createLinearGradient(0, 512, 512, 0);
      grad.addColorStop(0, "#F09433");
      grad.addColorStop(0.25, "#E6683C");
      grad.addColorStop(0.5, "#DC2743");
      grad.addColorStop(0.75, "#CC2366");
      grad.addColorStop(1, "#BC1888");
      fillBackground(ctx, grad);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 32;
      ctx.beginPath();
      ctx.arc(256, 256, 110, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(360, 152, 20, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "facebook": {
      fillBackground(ctx, "#1877F2");
      drawCenteredText(ctx, "f", "#fff", "bold 360px Georgia", 20);
      break;
    }
    case "twitter": {
      fillBackground(ctx, "#000");
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 48;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(150, 150);
      ctx.lineTo(362, 362);
      ctx.moveTo(362, 150);
      ctx.lineTo(150, 362);
      ctx.stroke();
      break;
    }
    case "youtube": {
      fillBackground(ctx, "#FF0000");
      ctx.fillStyle = "#fff";
      roundRect(ctx, 132, 178, 248, 156, 28);
      ctx.fill();
      ctx.fillStyle = "#FF0000";
      ctx.beginPath();
      ctx.moveTo(212, 218);
      ctx.lineTo(212, 294);
      ctx.lineTo(300, 256);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "tiktok": {
      fillBackground(ctx, "#000");
      ctx.font = "bold 280px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#EE1D52";
      ctx.fillText("♪", 264, 264);
      ctx.fillStyle = "#69C9D0";
      ctx.fillText("♪", 248, 248);
      ctx.fillStyle = "#fff";
      ctx.fillText("♪", 256, 256);
      break;
    }
    case "linkedin": {
      fillBackground(ctx, "#0A66C2");
      drawCenteredText(ctx, "in", "#fff", "bold 240px Arial", 20);
      break;
    }
    case "snapchat": {
      fillBackground(ctx, "#FFFC00");
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(256, 280, 110, 130, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(220, 256, 14, 0, Math.PI * 2);
      ctx.arc(292, 256, 14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "whatsapp": {
      fillBackground(ctx, "#25D366");
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(256, 250, 130, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#25D366";
      ctx.beginPath();
      ctx.moveTo(180, 360);
      ctx.lineTo(220, 320);
      ctx.lineTo(140, 320);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#25D366";
      ctx.lineWidth = 36;
      ctx.beginPath();
      ctx.arc(256, 250, 60, Math.PI * 0.25, Math.PI * 1.25);
      ctx.stroke();
      break;
    }
    case "pinterest": {
      fillBackground(ctx, "#E60023");
      drawCenteredText(ctx, "P", "#fff", "bold 320px Georgia", 30);
      break;
    }
    case "discord": {
      fillBackground(ctx, "#5865F2");
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(200, 256, 28, 36, 0, 0, Math.PI * 2);
      ctx.ellipse(312, 256, 28, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 24;
      ctx.beginPath();
      ctx.moveTo(160, 180);
      ctx.quadraticCurveTo(256, 150, 352, 180);
      ctx.moveTo(160, 330);
      ctx.quadraticCurveTo(256, 360, 352, 330);
      ctx.stroke();
      break;
    }
    case "threads": {
      fillBackground(ctx, "#000");
      drawCenteredText(ctx, "@", "#fff", "bold 240px Arial", 20);
      break;
    }
    case "reddit": {
      fillBackground(ctx, "#FF4500");
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(256, 290, 150, 110, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FF4500";
      ctx.beginPath();
      ctx.arc(200, 280, 18, 0, Math.PI * 2);
      ctx.arc(312, 280, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(256, 140, 32, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "skype": {
      fillBackground(ctx, "#00AFF0");
      drawCenteredText(ctx, "S", "#fff", "bold italic 320px Arial", 10);
      break;
    }
    case "vimeo": {
      fillBackground(ctx, "#1AB7EA");
      drawCenteredText(ctx, "V", "#fff", "bold 320px Arial", 10);
      break;
    }
    case "tumblr": {
      fillBackground(ctx, "#35465C");
      drawCenteredText(ctx, "t", "#fff", "bold 360px Georgia", 30);
      break;
    }
    case "flickr": {
      fillBackground(ctx, "#fff");
      ctx.fillStyle = "#0063DC";
      ctx.beginPath();
      ctx.arc(190, 256, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FF0084";
      ctx.beginPath();
      ctx.arc(322, 256, 80, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "yelp": {
      fillBackground(ctx, "#D32323");
      drawCenteredText(ctx, "yelp", "#fff", "bold 140px Arial", 0);
      break;
    }
    case "myspace": {
      fillBackground(ctx, "#000");
      drawCenteredText(ctx, "my__", "#fff", "bold 120px Arial", 0);
      break;
    }
    case "googleplus": {
      fillBackground(ctx, "#DB4437");
      drawCenteredText(ctx, "g+", "#fff", "bold 220px Arial", 0);
      break;
    }
    case "livejournal": {
      fillBackground(ctx, "#00B0EA");
      drawCenteredText(ctx, "LJ", "#fff", "bold 220px Arial", 0);
      break;
    }
    case "foursquare": {
      fillBackground(ctx, "#F94877");
      drawCenteredText(ctx, "4°", "#fff", "bold 220px Arial", 0);
      break;
    }
    case "telegram": {
      fillBackground(ctx, "#26A5E4");
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(140, 250);
      ctx.lineTo(380, 160);
      ctx.lineTo(340, 360);
      ctx.lineTo(260, 290);
      ctx.lineTo(220, 340);
      ctx.lineTo(220, 270);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "spotify": {
      fillBackground(ctx, "#1DB954");
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 26;
      ctx.lineCap = "round";
      for (let i = 0; i < 3; i++) {
        const r = 80 + i * 50;
        ctx.beginPath();
        ctx.arc(256, 280, r, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
      break;
    }
    case "twitch": {
      fillBackground(ctx, "#9146FF");
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(150, 130);
      ctx.lineTo(150, 340);
      ctx.lineTo(210, 340);
      ctx.lineTo(210, 380);
      ctx.lineTo(260, 340);
      ctx.lineTo(330, 340);
      ctx.lineTo(380, 280);
      ctx.lineTo(380, 130);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#9146FF";
      ctx.fillRect(220, 170, 30, 110);
      ctx.fillRect(290, 170, 30, 110);
      break;
    }
    default: {
      fillBackground(ctx, "#222");
      drawCenteredText(ctx, "?", "#fff", "bold 280px Arial", 0);
    }
  }
}

export function createSocialLogoTexture(brand: string): THREE.CanvasTexture {
  const cached = cache.get(brand);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas not supported");

  drawLogo(ctx, brand);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  cache.set(brand, tex);
  return tex;
}

/**
 * Procedural stylized Earth — blue oceans, simplified continents,
 * subtle atmospheric edge. Tiles seamlessly around a sphere.
 */
export function createEarthTexture(): THREE.CanvasTexture {
  const cached = cache.get("__earth");
  if (cached) return cached;

  const W = 1024;
  const H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas not supported");

  // Ocean base — vertical gradient (lighter equator, darker poles)
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#0a2e5a");
  grad.addColorStop(0.5, "#1e5cb0");
  grad.addColorStop(1, "#0a2e5a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Continent silhouettes — stylized but Earth-recognizable.
  // Coordinates in (u, v) ∈ [0,1] mapping to equirectangular.
  const continents: Array<{ cx: number; cy: number; rx: number; ry: number; rot: number }> = [
    // North America
    { cx: 0.2, cy: 0.32, rx: 0.09, ry: 0.13, rot: -0.2 },
    { cx: 0.16, cy: 0.45, rx: 0.06, ry: 0.08, rot: 0.4 },
    // South America
    { cx: 0.28, cy: 0.65, rx: 0.05, ry: 0.13, rot: 0.1 },
    // Europe / Africa
    { cx: 0.5, cy: 0.35, rx: 0.06, ry: 0.06, rot: 0 },
    { cx: 0.53, cy: 0.55, rx: 0.08, ry: 0.16, rot: 0 },
    // Asia
    { cx: 0.65, cy: 0.3, rx: 0.14, ry: 0.12, rot: -0.1 },
    { cx: 0.72, cy: 0.42, rx: 0.08, ry: 0.07, rot: 0.2 },
    // India
    { cx: 0.62, cy: 0.46, rx: 0.04, ry: 0.06, rot: 0 },
    // Australia
    { cx: 0.82, cy: 0.65, rx: 0.06, ry: 0.04, rot: 0 },
    // Greenland
    { cx: 0.42, cy: 0.18, rx: 0.05, ry: 0.05, rot: 0 },
  ];

  ctx.fillStyle = "#2d6b3a";
  for (const c of continents) {
    ctx.save();
    ctx.translate(c.cx * W, c.cy * H);
    ctx.rotate(c.rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, c.rx * W, c.ry * H, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Darken continent edges with overlay noise (simple)
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(45,107,58,0.35)";
  for (let i = 0; i < 60; i++) {
    const x = (i * 137.5) % W;
    const y = ((i * 91.7) % H) * 0.95 + H * 0.025;
    ctx.beginPath();
    ctx.ellipse(x, y, 14 + (i % 4) * 6, 10 + (i % 5) * 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle highlight near equator (sun-side)
  const equator = ctx.createRadialGradient(W * 0.4, H * 0.5, 30, W * 0.4, H * 0.5, W * 0.6);
  equator.addColorStop(0, "rgba(255,255,255,0.08)");
  equator.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = equator;
  ctx.fillRect(0, 0, W, H);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  cache.set("__earth", tex);
  return tex;
}
