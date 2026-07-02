'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function NeuralOrbContent() {
  const ref = useRef<THREE.Points>(null);
  const particles = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Generate initial particle positions in a sphere
    const count = 5000;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      const radius = Math.random() * 4;
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI * 2;

      positions[i] = radius * Math.cos(angle1) * Math.sin(angle2);
      positions[i + 1] = radius * Math.sin(angle1) * Math.sin(angle2);
      positions[i + 2] = radius * Math.cos(angle2);
    }

    ref.current.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    particles.current = positions;
  }, []);

  useFrame(() => {
    if (!ref.current || !particles.current) return;

    const positions = ref.current.geometry.attributes.position.array as Float32Array;
    const time = Date.now() * 0.00005;

    for (let i = 0; i < positions.length; i += 3) {
      const x = particles.current[i];
      const y = particles.current[i + 1];
      const z = particles.current[i + 2];

      // Orbital motion
      const angle = Math.atan2(y, x) + time;
      const radius = Math.sqrt(x * x + y * y);

      positions[i] = radius * Math.cos(angle);
      positions[i + 1] = radius * Math.sin(angle);
      positions[i + 2] = z + Math.sin(time * 3 + z) * 0.2;
    }

    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.x += 0.0001;
    ref.current.rotation.y += 0.0002;
  });

  return (
    <Points ref={ref} limit={5000}>
      <PointMaterial
        transparent
        color="#6C63FF"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
}

export function NeuralOrb() {
  return (
    <Canvas
      className="w-full h-full"
      camera={{ position: [0, 0, 8], fov: 75 }}
      dpr={typeof window !== 'undefined' ? window.devicePixelRatio : 1}
    >
      <NeuralOrbContent />
    </Canvas>
  );
}
