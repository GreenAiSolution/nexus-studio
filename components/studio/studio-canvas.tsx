'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Points, PointMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { CORE_PLANS } from './catalog';

/** Slowly drifting star / particle nebula that fills the void. */
function Nebula() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const count = 1400;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 6 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02;
      ref.current.rotation.x += delta * 0.005;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#6C63FF"
        size={0.06}
        sizeAttenuation
        depthWrite={false}
        opacity={0.7}
      />
    </Points>
  );
}

interface CrystalProps {
  index: number;
  color: string;
  x: number;
  selected: boolean;
  dimmed: boolean;
  onSelect: (i: number) => void;
  onHover: (i: number | null) => void;
}

/** A living crystalline monolith representing one plan. */
function Crystal({ index, color, x, selected, dimmed, onSelect, onHover }: CrystalProps) {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    const target = selected ? 1.35 : dimmed ? 0.78 : 1;
    group.current.scale.lerp(new THREE.Vector3(target, target, target), 0.08);
    group.current.rotation.y += delta * (selected ? 0.5 : 0.18);
    if (light.current) {
      const pulse = selected ? 6 : dimmed ? 0.8 : 2.2;
      light.current.intensity = pulse + Math.sin(state.clock.elapsedTime * 2 + index) * 0.4;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={selected ? 0.6 : 1.1}>
      <group
        ref={group}
        position={[x, 0, 0]}
        onClick={e => {
          e.stopPropagation();
          onSelect(index);
        }}
        onPointerOver={e => {
          e.stopPropagation();
          onHover(index);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <mesh>
          <icosahedronGeometry args={[1, 4]} />
          <MeshDistortMaterial
            color={color}
            emissive={color}
            emissiveIntensity={selected ? 0.9 : 0.35}
            roughness={0.05}
            metalness={0.9}
            distort={selected ? 0.45 : 0.28}
            speed={selected ? 3 : 1.6}
            opacity={dimmed ? 0.55 : 1}
            transparent
          />
        </mesh>
        <mesh scale={1.28}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={dimmed ? 0.12 : 0.28} />
        </mesh>
        <pointLight ref={light} color={color} distance={7} />
      </group>
    </Float>
  );
}

export interface StudioCanvasProps {
  selectedIndex: number | null;
  hoveredIndex: number | null;
  onSelect: (i: number) => void;
  onHover: (i: number | null) => void;
  showCrystals: boolean;
}

function Rig({ selectedIndex, showCrystals }: { selectedIndex: number | null; showCrystals: boolean }) {
  useFrame((state, delta) => {
    const targetZ = showCrystals ? 7 : 10;
    const targetX = selectedIndex != null && showCrystals ? (selectedIndex - 1) * 1.4 : 0;
    state.camera.position.z += (targetZ - state.camera.position.z) * Math.min(1, delta * 2);
    state.camera.position.x += (targetX - state.camera.position.x) * Math.min(1, delta * 2);
    state.camera.position.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.3;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function StudioCanvas({
  selectedIndex,
  hoveredIndex,
  onSelect,
  onHover,
  showCrystals,
}: StudioCanvasProps) {
  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 55 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <color attach="background" args={['#08090A']} />
      <fog attach="fog" args={['#08090A', 9, 22]} />
      <ambientLight intensity={0.25} />
      <Nebula />

      {showCrystals &&
        CORE_PLANS.map((plan, i) => (
          <Crystal
            key={plan.id}
            index={i}
            color={plan.color}
            x={(i - 1) * 3.1}
            selected={selectedIndex === i}
            dimmed={
              (hoveredIndex != null && hoveredIndex !== i) ||
              (selectedIndex != null && selectedIndex !== i)
            }
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}

      <Rig selectedIndex={selectedIndex} showCrystals={showCrystals} />

      <EffectComposer>
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.15} luminanceSmoothing={0.9} />
        <Vignette eskil={false} offset={0.25} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  );
}
