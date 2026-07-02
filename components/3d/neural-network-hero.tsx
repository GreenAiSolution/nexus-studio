"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import * as THREE from "three";
import { FloatingLogosCss } from "./floating-logos-css";

interface LogoParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  angle: number;
  angleVelocity: number;
  brand: string;
  bobPhase: number;
  size: number;
}

const SOCIAL_PLATFORMS = [
  { name: "Instagram", brand: "instagram" },
  { name: "TikTok", brand: "tiktok" },
  { name: "YouTube", brand: "youtube" },
  { name: "Twitter", brand: "twitter" },
  { name: "LinkedIn", brand: "linkedin" },
  { name: "Facebook", brand: "facebook" },
  { name: "Discord", brand: "discord" },
  { name: "Snapchat", brand: "snapchat" },
  { name: "WhatsApp", brand: "whatsapp" },
  { name: "Pinterest", brand: "pinterest" },
  { name: "Threads", brand: "threads" },
  { name: "Reddit", brand: "reddit" },
];

// Texture cache to avoid redrawing same logos
const textureCache = new Map<string, THREE.CanvasTexture>();

// Shared canvas drawing utility
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function createLogoTexture(brand: string): THREE.CanvasTexture {
  if (textureCache.has(brand)) {
    return textureCache.get(brand)!;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  switch (brand) {
    case "instagram": {
      const grad = ctx.createLinearGradient(0, 512, 512, 0);
      grad.addColorStop(0, "#f09433");
      grad.addColorStop(0.25, "#e6683c");
      grad.addColorStop(0.5, "#dc2743");
      grad.addColorStop(0.75, "#cc2366");
      grad.addColorStop(1, "#bc1888");
      ctx.fillStyle = grad;
      roundRect(ctx, 50, 50, 412, 412, 90);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 40;
      ctx.beginPath();
      ctx.arc(256, 256, 120, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(256, 256, 20, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "tiktok": {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 512, 512);
      // Musical note x3 with color shadows
      ctx.font = "bold 280px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Red shadow
      ctx.fillStyle = "#EE1D52";
      ctx.fillText("♪", 256 + 8, 256 + 8);
      // Cyan shadow
      ctx.fillStyle = "#69C9D0";
      ctx.fillText("♪", 256 - 8, 256 - 8);
      // White center
      ctx.fillStyle = "#fff";
      ctx.fillText("♪", 256, 256);
      break;
    }
    case "youtube": {
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = "#fff";
      roundRect(ctx, 150, 180, 212, 152, 20);
      ctx.fill();
      // Play triangle
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.moveTo(200, 220);
      ctx.lineTo(200, 300);
      ctx.lineTo(290, 260);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "twitter": {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 50;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(150, 150);
      ctx.lineTo(362, 362);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(362, 150);
      ctx.lineTo(150, 362);
      ctx.stroke();
      break;
    }
    case "linkedin": {
      ctx.fillStyle = "#0A66C2";
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 240px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("in", 256, 280);
      break;
    }
    case "facebook": {
      ctx.fillStyle = "#1877F2";
      ctx.beginPath();
      ctx.arc(256, 256, 180, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 300px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("f", 230, 290);
      break;
    }
    case "discord": {
      ctx.fillStyle = "#5865F2";
      roundRect(ctx, 50, 50, 412, 412, 80);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 280px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("D", 256, 280);
      break;
    }
    case "snapchat": {
      ctx.fillStyle = "#FFFC00";
      ctx.fillRect(0, 0, 512, 512);
      ctx.font = "bold 240px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000";
      ctx.fillText("👻", 256, 270);
      break;
    }
    case "whatsapp": {
      ctx.fillStyle = "#25D366";
      ctx.beginPath();
      ctx.arc(256, 256, 180, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 140px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("📱", 256, 260);
      break;
    }
    case "pinterest": {
      ctx.fillStyle = "#E60023";
      ctx.beginPath();
      ctx.arc(256, 256, 180, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 280px Georgia";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("P", 256, 300);
      break;
    }
    case "threads": {
      ctx.fillStyle = "#000";
      roundRect(ctx, 50, 50, 412, 412, 80);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 200px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("@", 256, 280);
      break;
    }
    case "reddit": {
      ctx.fillStyle = "#FF4500";
      ctx.beginPath();
      ctx.arc(256, 256, 180, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 180px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("r/", 256, 290);
      break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(brand, texture);
  return texture;
}

function SocialLogoSprite({ particle, texture }: { particle: LogoParticle; texture: THREE.CanvasTexture }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // Update position
    particle.position.add(particle.velocity);

    // Bounce off bounds
    if (Math.abs(particle.position.x) > 50) particle.velocity.x *= -1;
    if (Math.abs(particle.position.y) > 40) particle.velocity.y *= -1;
    if (Math.abs(particle.position.z) > 110) particle.velocity.z *= -1;

    // Apply new position
    meshRef.current.position.copy(particle.position);

    // Billboard effect - face camera
    meshRef.current.quaternion.copy(camera.quaternion);

    // Gentle bob animation
    const bobAmount = Math.sin(clock.getElapsedTime() * 0.7 + particle.bobPhase) * 2;
    meshRef.current.position.y += bobAmount * 0.001;

    // Update size based on z-depth for perspective
    const depth = (particle.position.z + 100) / 115;
    const size = THREE.MathUtils.lerp(1.5, 6, depth);
    meshRef.current.scale.set(size, size, 1);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function SpaceScene({ logoCount = 80, starCount = 1000 }: { logoCount?: number; starCount?: number }) {
  const sceneRef = useRef<THREE.Group>(null);
  const { camera, mouse } = useThree();
  const particlesRef = useRef<LogoParticle[]>([]);
  const starsRef = useRef<THREE.Points>(null);
  const cameraTargetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    camera.position.z = 60;
  }, [camera]);

  // Create logos
  useEffect(() => {
    const particles: LogoParticle[] = [];

    for (let i = 0; i < logoCount; i++) {
      const zone = i < logoCount * 0.167 ? "near" : i < logoCount * 0.667 ? "mid" : "far";
      let z: number;
      let sizeMult: number;

      if (zone === "near") {
        z = THREE.MathUtils.randFloat(-5, 12);
        sizeMult = 1;
      } else if (zone === "mid") {
        z = THREE.MathUtils.randFloat(-40, -5);
        sizeMult = 0.7;
      } else {
        z = THREE.MathUtils.randFloat(-95, -40);
        sizeMult = 0.4;
      }

      particles.push({
        position: new THREE.Vector3(
          THREE.MathUtils.randFloat(-50, 50),
          THREE.MathUtils.randFloat(-40, 40),
          z
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.03,
          (Math.random() - 0.5) * 0.03,
          (Math.random() - 0.5) * 0.015
        ),
        angle: Math.random() * Math.PI * 2,
        angleVelocity: (Math.random() - 0.5) * 0.02,
        brand: SOCIAL_PLATFORMS[i % SOCIAL_PLATFORMS.length].brand,
        bobPhase: Math.random() * Math.PI * 2,
        size: 2 * sizeMult,
      });
    }

    particlesRef.current = particles;
  }, [logoCount]);

  // Create stars
  useEffect(() => {
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = THREE.MathUtils.randFloat(-120, 120);
      positions[i * 3 + 1] = THREE.MathUtils.randFloat(-80, 80);
      positions[i * 3 + 2] = THREE.MathUtils.randFloat(-200, -30);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: "#ffffff",
      size: 0.15,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
    });

    const stars = new THREE.Points(geometry, material);
    if (starsRef.current) {
      starsRef.current.geometry.dispose();
      (starsRef.current.material as THREE.Material).dispose();
    }
    starsRef.current = stars;
  }, [starCount]);

  useFrame(() => {
    // Mouse parallax
    cameraTargetRef.current.x = mouse.x * 5;
    cameraTargetRef.current.y = mouse.y * 3;

    camera.position.x += (cameraTargetRef.current.x - camera.position.x) * 0.02;
    camera.position.y += (cameraTargetRef.current.y - camera.position.y) * 0.02;
  });

  return (
    <group ref={sceneRef}>
      {starsRef.current && <primitive object={starsRef.current} />}
      {particlesRef.current.map((particle, i) => (
        <SocialLogoSprite key={i} particle={particle} texture={createLogoTexture(particle.brand)} />
      ))}
    </group>
  );
}

export function NeuralNetworkHero() {
  const [useWebGL, setUseWebGL] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [logoCount, setLogoCount] = useState(80);
  const [starCount, setStarCount] = useState(1000);

  useEffect(() => {
    setIsClient(true);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setUseWebGL(false);
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setUseWebGL(false);
        return;
      }
    } catch {
      setUseWebGL(false);
      return;
    }

    const cores = navigator.hardwareConcurrency || 2;
    if (cores >= 6) {
      setLogoCount(120);
      setStarCount(1200);
    } else if (cores >= 3) {
      setLogoCount(60);
      setStarCount(500);
    } else {
      setUseWebGL(false);
    }
  }, []);

  if (!isClient) {
    return <div className="relative w-full h-screen bg-bg-primary overflow-hidden" />;
  }

  if (!useWebGL) {
    return <FloatingLogosCss />;
  }

  return (
    <div className="relative w-full h-screen bg-bg-primary overflow-hidden">
      <Canvas
        className="absolute inset-0"
        gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
      >
        <SpaceScene logoCount={logoCount} starCount={starCount} />
        <Preload all />
      </Canvas>

      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(8,9,10,0.4) 100%)",
        }}
      />
    </div>
  );
}
