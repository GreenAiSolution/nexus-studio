"use client";

/* eslint-disable react-hooks/purity, react-hooks/refs, react-hooks/set-state-in-effect --
 * Three.js scene file. Mutation IS the programming model:
 *   - useMemo / useState init blocks generate one-shot randomized particle layouts
 *   - useFrame callbacks mutate scratch buffers per frame (not render)
 *   - WebGL capability detection requires a mount flag set inside useEffect
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  SOCIAL_PLATFORMS,
  createSocialLogoTexture,
} from "@/lib/social-logos";

type PerfTier = "low" | "mid" | "high";

interface SceneProps {
  scrollProgress: { current: number };
  tier: PerfTier;
}

// ─── ORBITING SOCIAL LOGO ─────────────────────────────────────────────────

interface OrbitConfig {
  brand: string;
  radius: number;
  speed: number;
  phase: number;
  tilt: number;
  yaw: number;
  size: number;
  vertical: number;
}

function OrbitingLogo({
  config,
  scrollProgress,
}: {
  config: OrbitConfig;
  scrollProgress: { current: number };
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => createSocialLogoTexture(config.brand), [config.brand]);
  const { camera } = useThree();
  const tmp = useRef(new THREE.Vector3()).current;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const p = scrollProgress.current;

    const angle = config.phase + t * config.speed * (1 + p * 0.3);
    const localX = Math.cos(angle) * config.radius;
    const localZ = Math.sin(angle) * config.radius;
    const localY = config.vertical + Math.sin(angle * 2 + config.phase) * 0.12;

    const cosT = Math.cos(config.tilt);
    const sinT = Math.sin(config.tilt);
    const yAfterTilt = localY * cosT - localZ * sinT;
    const zAfterTilt = localY * sinT + localZ * cosT;

    const cosY = Math.cos(config.yaw);
    const sinY = Math.sin(config.yaw);
    tmp.set(
      localX * cosY + zAfterTilt * sinY,
      yAfterTilt,
      -localX * sinY + zAfterTilt * cosY
    );

    meshRef.current.position.copy(tmp);
    meshRef.current.quaternion.copy(camera.quaternion);
    const breath = 1 + Math.sin(t * 1.4 + config.phase) * 0.07;
    meshRef.current.scale.setScalar(config.size * breath);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

function FloatingLogos({ scrollProgress, tier }: SceneProps) {
  const configs = useMemo<OrbitConfig[]>(() => {
    // 3 rings at varied tilts — logos float freely in space with no center object
    const rings = [
      { radius: 3.0, count: tier === "high" ? 12 : tier === "mid" ? 9 : 6,  tilt: 0.15, yaw: 0,    size: 0.62, speed: 0.20 },
      { radius: 5.0, count: tier === "high" ? 18 : tier === "mid" ? 13 : 8,  tilt: 0.60, yaw: 0.45, size: 0.50, speed: 0.14 },
      { radius: 7.0, count: tier === "high" ? 24 : tier === "mid" ? 16 : 10, tilt: -0.75, yaw: -0.55, size: 0.40, speed: 0.09 },
    ];

    const out: OrbitConfig[] = [];
    let brandIdx = 0;
    rings.forEach((plan, ringIdx) => {
      for (let i = 0; i < plan.count; i++) {
        const platform = SOCIAL_PLATFORMS[brandIdx % SOCIAL_PLATFORMS.length];
        brandIdx++;
        out.push({
          brand: platform.brand,
          radius: plan.radius + (Math.random() - 0.5) * 0.4,
          speed: plan.speed * (1 + ringIdx * 0.08) * (Math.random() * 0.3 + 0.85),
          phase: (i / plan.count) * Math.PI * 2 + Math.random() * 0.25,
          tilt: plan.tilt + (Math.random() - 0.5) * 0.2,
          yaw: plan.yaw + (Math.random() - 0.5) * 0.15,
          size: plan.size + (Math.random() - 0.5) * 0.1,
          vertical: (Math.random() - 0.5) * 0.5,
        });
      }
    });
    return out;
  }, [tier]);

  return (
    <>
      {configs.map((c, i) => (
        <OrbitingLogo key={i} config={c} scrollProgress={scrollProgress} />
      ))}
    </>
  );
}

// ─── STARFIELD ────────────────────────────────────────────────────────────

function Starfield({ count, scrollProgress }: { count: number; scrollProgress: { current: number } }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 40 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const m = new THREE.PointsMaterial({
      color: "#dfe7ff",
      size: 0.28,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    return { geometry: g, material: m };
  }, [count]);

  useEffect(() => {
    return () => { geometry.dispose(); material.dispose(); };
  }, [geometry, material]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = clock.getElapsedTime() * 0.004;
    pointsRef.current.rotation.x = scrollProgress.current * 0.2;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

// ─── AURORA BACKDROP ──────────────────────────────────────────────────────

function AuroraDome() {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const W = 256; const H = 256;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#070b20";
    ctx.fillRect(0, 0, W, H);

    const blobs = [
      { x: 0.3, y: 0.4, r: 0.5, color: "rgba(50,110,200,0.7)" },
      { x: 0.7, y: 0.5, r: 0.6, color: "rgba(108,99,255,0.5)" },
      { x: 0.5, y: 0.7, r: 0.7, color: "rgba(0,170,230,0.55)" },
      { x: 0.2, y: 0.8, r: 0.4, color: "rgba(80,180,255,0.45)" },
    ];
    for (const b of blobs) {
      const g = ctx.createRadialGradient(b.x*W, b.y*H, 0, b.x*W, b.y*H, b.r*W);
      g.addColorStop(0, b.color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.rotation.y = clock.getElapsedTime() * 0.006;
  });

  if (!texture) return null;
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[80, 32, 16]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

// ─── CAMERA RIG ───────────────────────────────────────────────────────────
// Drifts through the floating logo field. No fixed center to look at.

const cameraScratch = new THREE.Vector3();

function CameraRig({ scrollProgress }: { scrollProgress: { current: number } }) {
  const { camera, mouse } = useThree();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = scrollProgress.current;

    // Gentle orbital drift — camera circles slowly through the logo field
    const baseX = Math.sin(t * 0.04 + p * 1.2) * 1.5;
    const baseY = Math.cos(t * 0.03) * 0.8 + p * 1.0;
    const baseZ = 10 - p * 2.5;

    cameraScratch.set(
      baseX + mouse.x * 0.6,
      baseY + mouse.y * 0.35,
      baseZ
    );

    camera.position.lerp(cameraScratch, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ─── SCENE ROOT ───────────────────────────────────────────────────────────

function Scene({ scrollProgress, tier }: SceneProps) {
  const starCount = tier === "high" ? 1200 : tier === "mid" ? 600 : 250;
  return (
    <>
      <CameraRig scrollProgress={scrollProgress} />
      <AuroraDome />
      <Starfield count={starCount} scrollProgress={scrollProgress} />
      <FloatingLogos scrollProgress={scrollProgress} tier={tier} />
    </>
  );
}

// ─── PUBLIC COMPONENT ─────────────────────────────────────────────────────

export function ImmersiveScrollScene() {
  const [tier, setTier] = useState<PerfTier | null>(null);
  const [mounted, setMounted] = useState(false);
  const scrollProgress = useRef<{ current: number }>({ current: 0 }).current;

  useEffect(() => {
    setMounted(true);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) { setTier("low"); return; }

    let webglOK = false;
    try {
      const probe = document.createElement("canvas");
      const gl = probe.getContext("webgl2") || probe.getContext("webgl");
      webglOK = !!gl;
    } catch { webglOK = false; }
    if (!webglOK) { setTier("low"); return; }

    const cores = navigator.hardwareConcurrency || 2;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      setTier(cores >= 6 ? "mid" : "low");
    } else if (cores >= 8) {
      setTier("high");
    } else if (cores >= 4) {
      setTier("mid");
    } else {
      setTier("low");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let frame = 0;
    const update = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      scrollProgress.current = THREE.MathUtils.clamp(
        total > 0 ? window.scrollY / total : 0, 0, 1
      );
      frame = 0;
    };
    const onScroll = () => { if (frame) return; frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [mounted, scrollProgress]);

  if (!mounted || tier === null) {
    return <div className="fixed inset-0 -z-10 bg-bg-primary" aria-hidden />;
  }

  if (tier === "low") return <LowTierFallback />;

  return (
    <div className="fixed inset-0 -z-10 bg-bg-primary" aria-hidden>
      <Canvas
        dpr={tier === "high" ? [1, 1.75] : [1, 1.25]}
        gl={{ antialias: tier === "high", alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 10], fov: 58, near: 0.1, far: 200 }}
        style={{ background: "transparent" }}
      >
        <color attach="background" args={["#070b20"]} />
        <fog attach="fog" args={["#070b20", 30, 90]} />
        <Scene scrollProgress={scrollProgress} tier={tier} />
      </Canvas>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 35%, rgba(7,11,32,0.55) 100%)",
        }}
      />
    </div>
  );
}

function LowTierFallback() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-bg-primary" aria-hidden>
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-25"
        style={{ background: "radial-gradient(circle, rgba(108,99,255,0.6) 0%, rgba(0,212,255,0.3) 50%, transparent 70%)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
