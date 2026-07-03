"use client";

/* eslint-disable react-hooks/purity, react-hooks/refs, react-hooks/set-state-in-effect, react-hooks/immutability --
 * Three.js scene. Mutation IS the model here:
 *   - useMemo builds one-shot geometry / textures / particle layouts
 *   - useFrame mutates transforms + buffers per frame (not React render)
 *   - WebGL + perf detection needs a mount flag set inside useEffect
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CONNECTOR_LIST } from "@/pixel-pilot/connectors";

type PerfTier = "low" | "mid" | "high";

// ─── PROCEDURAL CONNECTOR CHIP ────────────────────────────────────────────────
// A rounded neon tile per connector (Meta / Google / TikTok / Shopify), drawn on
// canvas → CanvasTexture. Self-contained, offline, zero external assets.

const chipCache = new Map<string, THREE.CanvasTexture>();

function chipTexture(name: string, hue: string): THREE.CanvasTexture {
  const key = `${name}:${hue}`;
  const cached = chipCache.get(key);
  if (cached) return cached;

  const S = 256;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  // glow backdrop
  const glow = ctx.createRadialGradient(S / 2, S / 2, 20, S / 2, S / 2, S / 2);
  glow.addColorStop(0, hexToRgba(hue, 0.55));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  // rounded tile
  const pad = 46;
  const r = 40;
  ctx.beginPath();
  ctx.moveTo(pad + r, pad);
  ctx.arcTo(S - pad, pad, S - pad, S - pad, r);
  ctx.arcTo(S - pad, S - pad, pad, S - pad, r);
  ctx.arcTo(pad, S - pad, pad, pad, r);
  ctx.arcTo(pad, pad, S - pad, pad, r);
  ctx.closePath();

  const fill = ctx.createLinearGradient(pad, pad, S - pad, S - pad);
  fill.addColorStop(0, "#0d1020");
  fill.addColorStop(1, "#141a30");
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = hexToRgba(hue, 0.9);
  ctx.stroke();

  // brand dot
  ctx.beginPath();
  ctx.arc(S / 2, S / 2 - 22, 20, 0, Math.PI * 2);
  ctx.fillStyle = hue;
  ctx.shadowColor = hue;
  ctx.shadowBlur = 24;
  ctx.fill();
  ctx.shadowBlur = 0;

  // label
  ctx.fillStyle = "#F8F9FF";
  ctx.font = "600 30px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, S / 2, S / 2 + 40);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  chipCache.set(key, tex);
  return tex;
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// ─── CORE REACTOR ─────────────────────────────────────────────────────────────
// The autopilot at the center. A pulsing inner sphere inside a slowly counter-
// rotating icosahedron wireframe — the brain everything else feeds.

function CoreReactor({ scroll }: { scroll: { current: number } }) {
  const cage = useRef<THREE.LineSegments>(null);
  const inner = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  const wire = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.35, 1);
    return new THREE.EdgesGeometry(geo);
  }, []);

  useEffect(() => () => wire.dispose(), [wire]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = scroll.current;
    if (cage.current) {
      cage.current.rotation.y = t * 0.18;
      cage.current.rotation.x = t * 0.09;
    }
    if (inner.current) {
      const s = 0.82 + Math.sin(t * 2.2) * 0.06 + p * 0.15;
      inner.current.scale.setScalar(s);
    }
    if (halo.current) {
      halo.current.rotation.z = -t * 0.25;
      const s = 2.4 + Math.sin(t * 1.3) * 0.15;
      halo.current.scale.setScalar(s);
      halo.current.quaternion.copy((halo.current.parent as THREE.Object3D).quaternion);
    }
  });

  return (
    <group>
      <lineSegments ref={cage} geometry={wire}>
        <lineBasicMaterial color="#6C63FF" transparent opacity={0.65} />
      </lineSegments>
      <mesh ref={inner}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#00D4FF" transparent opacity={0.9} />
      </mesh>
      <mesh ref={halo}>
        <ringGeometry args={[1, 1.04, 64]} />
        <meshBasicMaterial color="#FF2E9A" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── ORBITING CONNECTOR CHIPS ─────────────────────────────────────────────────

interface ChipCfg {
  name: string;
  hue: string;
  radius: number;
  phase: number;
  speed: number;
  tilt: number;
  y: number;
}

function ConnectorChip({ cfg, scroll }: { cfg: ChipCfg; scroll: { current: number } }) {
  const ref = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => chipTexture(cfg.name, cfg.hue), [cfg.name, cfg.hue]);
  const { camera } = useThree();
  const tmp = useRef(new THREE.Vector3()).current;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const p = scroll.current;
    const a = cfg.phase + t * cfg.speed * (1 + p * 0.4);
    const x = Math.cos(a) * cfg.radius;
    const z = Math.sin(a) * cfg.radius;
    const y = cfg.y + Math.sin(a * 2 + cfg.phase) * 0.18;

    const cs = Math.cos(cfg.tilt);
    const sn = Math.sin(cfg.tilt);
    tmp.set(x, y * cs - z * sn, y * sn + z * cs);
    ref.current.position.copy(tmp);
    ref.current.quaternion.copy(camera.quaternion);
    const breath = 1 + Math.sin(t * 1.6 + cfg.phase) * 0.06;
    ref.current.scale.setScalar(0.9 * breath);

    if (trailRef.current) {
      trailRef.current.position.copy(tmp).multiplyScalar(0.5);
      trailRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <>
      <mesh ref={ref}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} />
      </mesh>
      {/* faint tether dot toward the core — implies the data pipe */}
      <mesh ref={trailRef}>
        <circleGeometry args={[0.03, 12]} />
        <meshBasicMaterial color={cfg.hue} transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </>
  );
}

function ConnectorRing({ scroll }: { scroll: { current: number } }) {
  const configs = useMemo<ChipCfg[]>(() => {
    return CONNECTOR_LIST.map((c, i) => ({
      name: c.name,
      hue: c.hue,
      radius: 3.1,
      phase: (i / CONNECTOR_LIST.length) * Math.PI * 2,
      speed: 0.22,
      tilt: 0.42,
      y: (i % 2 === 0 ? 1 : -1) * 0.25,
    }));
  }, []);
  return (
    <>
      {configs.map((c) => (
        <ConnectorChip key={c.name} cfg={c} scroll={scroll} />
      ))}
    </>
  );
}

// ─── SPEND / RETURN STREAM ────────────────────────────────────────────────────
// Particles spiraling in toward the core (spend) and back out (returns) — the
// profit loop, made literal. Each particle oscillates along its radius.

function ProfitStream({ count, scroll }: { count: number; scroll: { current: number } }) {
  const ref = useRef<THREE.Points>(null);

  const { geometry, material, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const s = new Float32Array(count * 3); // angle, radiusBase, speed
    const cyan = new THREE.Color("#00D4FF");
    const gold = new THREE.Color("#C9A84C");
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rBase = 1.8 + Math.random() * 3.6;
      s[i * 3] = angle;
      s[i * 3 + 1] = rBase;
      s[i * 3 + 2] = 0.3 + Math.random() * 0.9;
      const c = Math.random() > 0.5 ? cyan : gold;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const m = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: g, material: m, seeds: s };
  }, [count]);

  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const p = scroll.current;
    const pos = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const angle = seeds[i * 3] + t * seeds[i * 3 + 2] * (1 + p * 0.5);
      // radius pulses in and out → the spend↔return loop
      const rBase = seeds[i * 3 + 1];
      const r = rBase * (0.5 + 0.5 * Math.abs(Math.sin(t * 0.4 + rBase)));
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.sin(angle * 0.7 + rBase) * 0.6;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y = t * 0.04;
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

// ─── GRID TUNNEL (FLIGHT FLOOR) ───────────────────────────────────────────────
// A wireframe grid scrolling toward the camera → speed + depth. Two planes,
// floor + ceiling, give the "flying through a corridor" read.

function GridPlane({ y, scroll }: { y: number; scroll: { current: number } }) {
  const ref = useRef<THREE.GridHelper>(null);
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(60, 60, "#6C63FF", "#182042");
    (g.material as THREE.Material).transparent = true;
    (g.material as THREE.Material).opacity = 0.22;
    return g;
  }, []);
  useEffect(() => () => grid.dispose(), [grid]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const p = scroll.current;
    // scroll the grid toward camera; wrap every cell (1 unit)
    const z = ((clock.getElapsedTime() * (2 + p * 3)) % 1);
    ref.current.position.set(0, y, z);
  });

  return <primitive ref={ref} object={grid} position={[0, y, 0]} />;
}

// ─── STARFIELD ────────────────────────────────────────────────────────────────

function Starfield({ count, scroll }: { count: number; scroll: { current: number } }) {
  const ref = useRef<THREE.Points>(null);
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 30 + Math.random() * 70;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const m = new THREE.PointsMaterial({
      color: "#cdd7ff",
      size: 0.22,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    return { geometry: g, material: m };
  }, [count]);

  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.005;
    ref.current.rotation.x = scroll.current * 0.25;
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

// ─── CAMERA RIG ───────────────────────────────────────────────────────────────

const camScratch = new THREE.Vector3();

function CameraRig({ scroll }: { scroll: { current: number } }) {
  const { camera, mouse } = useThree();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = scroll.current;
    camScratch.set(
      Math.sin(t * 0.05) * 1.1 + mouse.x * 0.7,
      0.6 + Math.cos(t * 0.04) * 0.4 + mouse.y * 0.4,
      9.5 - p * 3.5
    );
    camera.position.lerp(camScratch, 0.05);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── SCENE ROOT ───────────────────────────────────────────────────────────────

function Scene({ tier, scroll }: { tier: PerfTier; scroll: { current: number } }) {
  const stars = tier === "high" ? 1100 : tier === "mid" ? 550 : 220;
  const stream = tier === "high" ? 900 : tier === "mid" ? 450 : 180;
  return (
    <>
      <CameraRig scroll={scroll} />
      <Starfield count={stars} scroll={scroll} />
      <GridPlane y={-3.2} scroll={scroll} />
      <GridPlane y={3.6} scroll={scroll} />
      <ProfitStream count={stream} scroll={scroll} />
      <ConnectorRing scroll={scroll} />
      <CoreReactor scroll={scroll} />
    </>
  );
}

// ─── PUBLIC COMPONENT ─────────────────────────────────────────────────────────

export function FlightScene() {
  const [tier, setTier] = useState<PerfTier | null>(null);
  const [mounted, setMounted] = useState(false);
  const scroll = useRef<{ current: number }>({ current: 0 }).current;

  useEffect(() => {
    setMounted(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTier("low");
      return;
    }
    let ok = false;
    try {
      const probe = document.createElement("canvas");
      ok = !!(probe.getContext("webgl2") || probe.getContext("webgl"));
    } catch {
      ok = false;
    }
    if (!ok) {
      setTier("low");
      return;
    }
    const cores = navigator.hardwareConcurrency || 2;
    const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (mobile) setTier(cores >= 6 ? "mid" : "low");
    else if (cores >= 8) setTier("high");
    else if (cores >= 4) setTier("mid");
    else setTier("low");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let frame = 0;
    const update = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      scroll.current = THREE.MathUtils.clamp(total > 0 ? window.scrollY / total : 0, 0, 1);
      frame = 0;
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [mounted, scroll]);

  if (!mounted || tier === null) {
    return <div className="fixed inset-0 -z-10 bg-[#05060f]" aria-hidden />;
  }
  if (tier === "low") return <LowTierFallback />;

  return (
    <div className="fixed inset-0 -z-10 bg-[#05060f]" aria-hidden>
      <Canvas
        dpr={tier === "high" ? [1, 1.75] : [1, 1.25]}
        gl={{ antialias: tier === "high", alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0.6, 9.5], fov: 60, near: 0.1, far: 200 }}
      >
        <color attach="background" args={["#05060f"]} />
        <fog attach="fog" args={["#05060f", 22, 70]} />
        <Scene tier={tier} scroll={scroll} />
      </Canvas>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 30%, rgba(5,6,15,0.7) 100%)",
        }}
      />
    </div>
  );
}

function LowTierFallback() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#05060f]" aria-hidden>
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(0,212,255,0.5) 0%, rgba(108,99,255,0.35) 45%, rgba(255,46,154,0.25) 70%, transparent 78%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(108,99,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
    </div>
  );
}
