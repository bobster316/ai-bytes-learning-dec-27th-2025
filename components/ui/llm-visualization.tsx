"use client";

/**
 * LLM Visualization — "Neural Cosmos"
 *
 * Ultra-cinematic 3D animation of a transformer language model.
 *
 * Visual story (auto-cycles, ~24s loop):
 *   1. TOKENISE   – Prompt crystallises into glowing token orbs in a ring
 *   2. EMBED      – Each orb emits a pulsing data-column downward
 *   3. ATTEND     – Bezier arc tubes form between semantically linked tokens;
 *                   particles with Trails stream along them; camera reveals depth
 *   4. PROCESS    – Data vortex spirals into the central transformer sphere,
 *                   layer planes light up in cascade
 *   5. PREDICT    – Probability orbs rise; winner pulses with corona
 *   6. GENERATE   – Output token crystallises in a supernova burst
 *
 * Stack: React Three Fiber · Drei (Trail, Sparkles, Float, Html, Line) · Three.js
 * No new dependencies required.
 */

import {
  useRef, useState, useEffect, useMemo, Suspense,
  useCallback,
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Stars, Sparkles, Float, Html, Trail,
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Brand palette ────────────────────────────────────────────────────────────
const C = {
  teal:   '#00FFB3',
  cyan:   '#29D9C2',
  iris:   '#9B8FFF',
  amber:  '#FFB347',
  nova:   '#FF6B6B',
  violet: '#C084FC',
  white:  '#FFFFFF',
} as const;

const TOKEN_HEX   = [C.teal, C.cyan, C.iris, C.amber, C.nova, C.violet];
const TOKEN_THREE = TOKEN_HEX.map(h => new THREE.Color(h));

// ─── Demo data ────────────────────────────────────────────────────────────────
interface Demo {
  prompt: string;
  tokens: string[];
  ids: string[];
  topTokens: { token: string; prob: number }[];
  /** Symmetric attention weight matrix [i][j] = 0–1 */
  attn: number[][];
}

const DEMOS: Demo[] = [
  {
    prompt: 'Why is the sky blue?',
    tokens: ['Why', 'is', 'the', 'sky', 'blue', '?'],
    ids:    ['5195','318','262','6766','4171','30'],
    topTokens: [
      { token: 'Because', prob: 0.34 },
      { token: 'The',     prob: 0.19 },
      { token: 'Light',   prob: 0.13 },
      { token: 'Air',     prob: 0.09 },
      { token: 'It',      prob: 0.06 },
    ],
    attn: [
      [1.0, 0.1, 0.1, 0.4, 0.5, 0.2],
      [0.1, 1.0, 0.2, 0.3, 0.3, 0.1],
      [0.1, 0.2, 1.0, 0.6, 0.3, 0.1],
      [0.4, 0.3, 0.6, 1.0, 0.9, 0.2],
      [0.5, 0.3, 0.3, 0.9, 1.0, 0.1],
      [0.2, 0.1, 0.1, 0.2, 0.1, 1.0],
    ],
  },
  {
    prompt: 'How do neural nets learn?',
    tokens: ['How', 'do', 'neural', 'nets', 'learn', '?'],
    ids:    ['2437','466','17019','18537','2193','30'],
    topTokens: [
      { token: 'Through', prob: 0.29 },
      { token: 'Using',   prob: 0.22 },
      { token: 'Via',     prob: 0.15 },
      { token: 'By',      prob: 0.11 },
      { token: 'With',    prob: 0.07 },
    ],
    attn: [
      [1.0, 0.2, 0.3, 0.2, 0.2, 0.1],
      [0.2, 1.0, 0.2, 0.3, 0.3, 0.1],
      [0.3, 0.2, 1.0, 0.8, 0.5, 0.1],
      [0.2, 0.3, 0.8, 1.0, 0.7, 0.2],
      [0.2, 0.3, 0.5, 0.7, 1.0, 0.3],
      [0.1, 0.1, 0.1, 0.2, 0.3, 1.0],
    ],
  },
  {
    prompt: 'What makes AI intelligent?',
    tokens: ['What', 'makes', 'AI', 'intell', 'igent', '?'],
    ids:    ['2061','1838','9552','45034','4528','30'],
    topTokens: [
      { token: 'Training', prob: 0.31 },
      { token: 'Data',     prob: 0.24 },
      { token: 'Scale',    prob: 0.17 },
      { token: 'Learning', prob: 0.12 },
      { token: 'Compute',  prob: 0.08 },
    ],
    attn: [
      [1.0, 0.3, 0.5, 0.4, 0.2, 0.2],
      [0.3, 1.0, 0.4, 0.3, 0.2, 0.2],
      [0.5, 0.4, 1.0, 0.7, 0.6, 0.3],
      [0.4, 0.3, 0.7, 1.0, 0.9, 0.2],
      [0.2, 0.2, 0.6, 0.9, 1.0, 0.2],
      [0.2, 0.2, 0.3, 0.2, 0.2, 1.0],
    ],
  },
];

// ─── Phases ───────────────────────────────────────────────────────────────────
const PHASES = [
  { id: 'tokenise', label: 'Tokenising',          sub: 'Input text segmented into sub-word tokens',          ms: 3000 },
  { id: 'embed',    label: 'Embedding',            sub: 'Each token mapped to a 1024-dimensional vector',     ms: 3000 },
  { id: 'attend',   label: 'Self-Attention',       sub: '12 heads discover linguistic relationships',         ms: 5500 },
  { id: 'process',  label: 'Forward Pass',         sub: 'Representations refined across 32 transformer blocks', ms: 4000 },
  { id: 'predict',  label: 'Token Distribution',   sub: 'Softmax over 50,000-token vocabulary',               ms: 3500 },
  { id: 'generate', label: 'Generating',           sub: 'Top candidate selected · context extended',          ms: 2500 },
] as const;
type PhaseId = (typeof PHASES)[number]['id'];

// ─── Token ring geometry ──────────────────────────────────────────────────────
const N_TOKENS = 6;
const RING_R   = 4.2;
const RING_RZ  = 1.6; // ellipse depth

function ringPos(i: number, z = 0): THREE.Vector3 {
  const angle = (i / N_TOKENS) * Math.PI * 2 - Math.PI / 2;
  return new THREE.Vector3(
    Math.cos(angle) * RING_R,
    2.8 + Math.sin(angle * 2) * 0.25,
    Math.sin(angle) * RING_RZ + z,
  );
}

// ─── FlowParticle (travels along a pre-sampled curve) ────────────────────────
interface FlowParticleProps {
  points: THREE.Vector3[];
  speed: number;
  offset: number;
  color: THREE.Color;
  size?: number;
}

function FlowParticle({ points, speed, offset, color, size = 0.055 }: FlowParticleProps) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current || points.length < 2) return;
    const t   = ((clock.getElapsedTime() * speed + offset) % 1);
    const raw = t * (points.length - 1);
    const lo  = Math.floor(raw);
    const hi  = Math.min(lo + 1, points.length - 1);
    ref.current.position.lerpVectors(points[lo], points[hi], raw - lo);
  });

  return (
    <Trail
      width={0.25}
      length={6}
      color={color}
      attenuation={t => t * t}
      decay={1}
    >
      <mesh ref={ref}>
        <sphereGeometry args={[size, 6, 6]} />
        <meshBasicMaterial color={color} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </Trail>
  );
}

// ─── AttentionArc ─────────────────────────────────────────────────────────────
interface AttentionArcProps {
  from: THREE.Vector3;
  to:   THREE.Vector3;
  weight: number;
  colorA: THREE.Color;
  colorB: THREE.Color;
  active: boolean;
}

function AttentionArc({ from, to, weight, colorA, colorB, active }: AttentionArcProps) {
  const tubeRef = useRef<THREE.Mesh>(null);

  const { curve, tubeGeo, points } = useMemo(() => {
    const mid = new THREE.Vector3(
      (from.x + to.x) / 2,
      Math.max(from.y, to.y) + weight * 5.5,  // arc height = semantic strength
      (from.z + to.z) / 2,
    );
    const c  = new THREE.QuadraticBezierCurve3(from, mid, to);
    const g  = new THREE.TubeGeometry(c, 32, 0.018 + weight * 0.038, 6, false);
    const ps = c.getPoints(80);
    return { curve: c, tubeGeo: g, points: ps };
  }, [from, to, weight]);

  useFrame(({ clock }) => {
    if (!tubeRef.current) return;
    const t   = clock.getElapsedTime();
    const mat = tubeRef.current.material as THREE.MeshBasicMaterial;
    const pulse = 0.25 + Math.abs(Math.sin(t * 1.8 + weight * 5)) * 0.25;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, active ? weight * pulse : 0, 0.06);
  });

  const blendColor = colorA.clone().lerp(colorB, 0.5);

  return (
    <group>
      {/* Tube */}
      <mesh ref={tubeRef} geometry={tubeGeo}>
        <meshBasicMaterial
          color={blendColor}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Outer glow tube */}
      <mesh geometry={new THREE.TubeGeometry(curve, 20, 0.06 + weight * 0.08, 4, false)}>
        <meshBasicMaterial
          color={blendColor}
          transparent
          opacity={active ? weight * 0.06 : 0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Flow particles with trails */}
      {active && weight > 0.45 && [0, 0.35, 0.7].map((off, k) => (
        <FlowParticle
          key={k}
          points={points}
          speed={0.28 + weight * 0.18}
          offset={off}
          color={blendColor}
        />
      ))}
    </group>
  );
}

// ─── Token Orb ────────────────────────────────────────────────────────────────
interface TokenOrbProps {
  idx:     number;
  token:   string;
  tokenId: string;
  phase:   PhaseId;
  active:  boolean;
}

function TokenOrb({ idx, token, tokenId, phase, active }: TokenOrbProps) {
  const coreRef  = useRef<THREE.Mesh>(null);
  const halo1Ref = useRef<THREE.Mesh>(null);
  const halo2Ref = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const color    = TOKEN_THREE[idx];

  useFrame(({ clock }) => {
    const t      = clock.getElapsedTime();
    const pulse  = 1 + Math.sin(t * 3.5 + idx * 1.1) * 0.12;
    const target = active ? 1.45 * pulse : 1.0;
    const lerpK  = 0.08;

    if (coreRef.current) {
      coreRef.current.scale.lerp(
        new THREE.Vector3(target, target, target), lerpK,
      );
      (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        THREE.MathUtils.lerp(
          (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity,
          active ? 4.5 : 0.6,
          lerpK,
        );
    }
    if (halo1Ref.current) {
      const s = target * 2.8;
      halo1Ref.current.scale.lerp(new THREE.Vector3(s, s, s), lerpK);
      (halo1Ref.current.material as THREE.MeshBasicMaterial).opacity =
        THREE.MathUtils.lerp(
          (halo1Ref.current.material as THREE.MeshBasicMaterial).opacity,
          active ? 0.18 : 0.04,
          lerpK,
        );
    }
    if (halo2Ref.current) {
      const s = target * 5.5;
      halo2Ref.current.scale.lerp(new THREE.Vector3(s, s, s), lerpK * 0.5);
      (halo2Ref.current.material as THREE.MeshBasicMaterial).opacity =
        THREE.MathUtils.lerp(
          (halo2Ref.current.material as THREE.MeshBasicMaterial).opacity,
          active ? 0.06 : 0.01,
          lerpK * 0.5,
        );
    }
    if (lightRef.current) {
      lightRef.current.intensity =
        THREE.MathUtils.lerp(lightRef.current.intensity, active ? 4 : 0, lerpK);
    }
  });

  return (
    <Float speed={1.6} floatIntensity={0.3} rotationIntensity={0.1}>
      <group position={ringPos(idx)}>
        {/* Core */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshStandardMaterial
            color={color} emissive={color}
            emissiveIntensity={0.6} toneMapped={false}
          />
        </mesh>
        {/* Inner halo */}
        <mesh ref={halo1Ref}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshBasicMaterial
            color={color} transparent opacity={0.04}
            depthWrite={false} blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Outer halo */}
        <mesh ref={halo2Ref}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshBasicMaterial
            color={color} transparent opacity={0.01}
            depthWrite={false} blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Local light */}
        <pointLight ref={lightRef} color={TOKEN_HEX[idx]} intensity={0} distance={4} />
        {/* Label */}
        <Html center distanceFactor={11} position={[0, -0.58, 0]}>
          <div className="pointer-events-none select-none text-center" style={{ whiteSpace: 'nowrap' }}>
            <div style={{
              color: TOKEN_HEX[idx],
              fontSize: '13px', fontFamily: 'monospace', fontWeight: 700,
              textShadow: `0 0 16px ${TOKEN_HEX[idx]}99`,
              letterSpacing: '0.04em',
            }}>
              {token}
            </div>
            {(phase === 'embed' || phase === 'attend' || phase === 'process') && (
              <div style={{
                color: 'rgba(255,255,255,0.25)', fontSize: '9px',
                fontFamily: 'monospace', marginTop: '2px',
              }}>
                #{tokenId}
              </div>
            )}
          </div>
        </Html>
      </group>
    </Float>
  );
}

// ─── Embedding data-column ────────────────────────────────────────────────────
const EMBED_SLABS = 16;

function EmbeddingColumn({ idx, phase }: { idx: number; phase: PhaseId }) {
  const refs = useRef<THREE.Mesh[]>([]);
  const visible = phase === 'embed';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((m, row) => {
      if (!m) return;
      const wave = Math.abs(Math.sin(t * 1.4 + row * 0.35 + idx * 0.9));
      const mat  = m.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.lerp(
        mat.opacity,
        visible ? 0.12 + wave * 0.5 : 0,
        0.05,
      );
    });
  });

  const base = ringPos(idx);
  const color = TOKEN_THREE[idx];

  return (
    <group position={[base.x, 0, base.z]}>
      {Array.from({ length: EMBED_SLABS }).map((_, row) => (
        <mesh
          key={row}
          ref={el => { if (el) refs.current[row] = el; }}
          position={[0, 1.8 - row * 0.28, 0]}
        >
          <boxGeometry args={[0.28, 0.055, 0.055]} />
          <meshBasicMaterial
            color={color} transparent opacity={0}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Central transformer sphere ───────────────────────────────────────────────
function CentralSphere({ phase }: { phase: PhaseId }) {
  const icoRef   = useRef<THREE.Mesh>(null);
  const solidRef = useRef<THREE.Mesh>(null);
  const glowRef  = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t   = clock.getElapsedTime();
    const hot = phase === 'process' || phase === 'generate';
    if (icoRef.current) {
      icoRef.current.rotation.y = t * 0.18;
      icoRef.current.rotation.x = Math.sin(t * 0.09) * 0.15;
      const mat = icoRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, hot ? 2.5 : 0.6, 0.04);
    }
    if (solidRef.current) {
      solidRef.current.rotation.y = -t * 0.12;
      const mat = solidRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, hot ? 1.2 : 0.2, 0.04);
    }
    if (glowRef.current) {
      const pulse = 1 + Math.sin(t * 1.3) * 0.08;
      glowRef.current.scale.setScalar(pulse);
    }
    if (lightRef.current) {
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, hot ? 5 : 1.5, 0.04);
    }
  });

  const col = new THREE.Color(C.iris);

  return (
    <group>
      {/* Wireframe icosahedron */}
      <mesh ref={icoRef}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshStandardMaterial
          color={col} emissive={col} emissiveIntensity={0.6}
          transparent opacity={0.25} wireframe toneMapped={false}
        />
      </mesh>
      {/* Solid inner */}
      <mesh ref={solidRef}>
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshStandardMaterial
          color={col} emissive={col} emissiveIntensity={0.2}
          transparent opacity={0.12} toneMapped={false}
        />
      </mesh>
      {/* Big glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[3.0, 16, 16]} />
        <meshBasicMaterial
          color={col} transparent opacity={0.04}
          depthWrite={false} blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight ref={lightRef} color={C.iris} intensity={1.5} distance={12} />
    </group>
  );
}

// ─── Vortex particle system (data flowing into the sphere) ────────────────────
const VORTEX_COUNT = 420;

function VortexParticles({ phase }: { phase: PhaseId }) {
  const meshRef  = useRef<THREE.InstancedMesh>(null);
  const dummy    = useMemo(() => new THREE.Object3D(), []);
  const active   = phase === 'process' || phase === 'generate' || phase === 'attend';

  const particles = useMemo(() =>
    Array.from({ length: VORTEX_COUNT }, (_, i) => {
      const t     = i / VORTEX_COUNT;
      const turns = 5;
      return {
        baseAngle: t * Math.PI * 2 * turns,
        radius:    1.4 + t * 3.2,
        y:         (t - 0.5) * 7,
        speed:     0.22 + (1 - t) * 0.35,
        scale:     0.25 + Math.random() * 0.55,
        colorIdx:  Math.floor(Math.random() * TOKEN_HEX.length),
      };
    }), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    particles.forEach((p, i) => {
      const angle = p.baseAngle + t * p.speed;
      dummy.position.set(
        Math.cos(angle) * p.radius,
        p.y + Math.sin(t * 0.3 + i * 0.05) * 0.3,
        Math.sin(angle) * p.radius * 0.55,
      );
      dummy.scale.setScalar(active ? p.scale : p.scale * 0.3);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, VORTEX_COUNT]}>
      <sphereGeometry args={[0.038, 4, 4]} />
      <meshBasicMaterial
        color={new THREE.Color(C.teal)}
        transparent opacity={0.55}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

// ─── Transformer layer planes ─────────────────────────────────────────────────
const LAYER_N = 10;

function LayerStack({ phase }: { phase: PhaseId }) {
  const refs  = useRef<THREE.Mesh[]>([]);
  const show  = phase === 'process';

  useFrame(({ clock }) => {
    if (!show) return;
    const t = clock.getElapsedTime();
    refs.current.forEach((m, i) => {
      if (!m) return;
      const wave = Math.abs(Math.sin(t * 0.85 - i * 0.55));
      const mat  = m.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.08 + wave * 0.55;
      mat.opacity           = 0.08 + wave * 0.18;
    });
  });

  if (!show) return null;

  const col = new THREE.Color(C.iris);
  return (
    <group position={[0, -1.5, -3.5]}>
      {Array.from({ length: LAYER_N }).map((_, i) => (
        <mesh
          key={i}
          ref={el => { if (el) refs.current[i] = el; }}
          position={[0, -i * 0.42, 0]}
        >
          <boxGeometry args={[9, 0.055, 3.8]} />
          <meshStandardMaterial
            color={col} emissive={col} emissiveIntensity={0.08}
            transparent opacity={0.08} depthWrite={false}
          />
        </mesh>
      ))}
      <Html position={[5.8, 0.2, 0]} distanceFactor={14}>
        <div className="pointer-events-none select-none whitespace-nowrap" style={{
          color: C.iris, fontSize: '9px', fontFamily: 'monospace',
          fontWeight: 600, opacity: 0.55,
          textTransform: 'uppercase', letterSpacing: '0.14em',
        }}>
          × 32 blocks
        </div>
      </Html>
    </group>
  );
}

// ─── Output probability orbs ──────────────────────────────────────────────────
interface PredOrbsProps {
  preds: { token: string; prob: number }[];
  phase: PhaseId;
}

function PredOrbs({ preds, phase }: PredOrbsProps) {
  const show    = phase === 'predict' || phase === 'generate';
  const winRef  = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!winRef.current || !coronaRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 3.2) * 0.18;
    winRef.current.scale.setScalar(pulse);
    coronaRef.current.scale.setScalar(pulse * 3.2);
    (coronaRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.08 + Math.abs(Math.sin(t * 1.5)) * 0.1;
  });

  if (!show) return null;

  const max = Math.max(...preds.map(p => p.prob));

  return (
    <group position={[0, -3.8, 0]}>
      {preds.map((pred, i) => {
        const x  = (i - 2) * 2.1;
        const r  = 0.16 + (pred.prob / max) * 0.44;
        const win = i === 0;
        const col = new THREE.Color(win ? C.teal : C.iris);

        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh ref={win ? winRef : undefined}>
              <sphereGeometry args={[r, 28, 28]} />
              <meshStandardMaterial
                color={col} emissive={col}
                emissiveIntensity={win ? 3 : 0.5} toneMapped={false}
              />
            </mesh>
            {win && (
              <mesh ref={coronaRef}>
                <sphereGeometry args={[r, 12, 12]} />
                <meshBasicMaterial
                  color={col} transparent opacity={0.08}
                  depthWrite={false} blending={THREE.AdditiveBlending}
                />
              </mesh>
            )}
            {win && <pointLight color={C.teal} intensity={3} distance={4} />}
            <Html center distanceFactor={10} position={[0, -r - 0.52, 0]}>
              <div className="pointer-events-none select-none text-center" style={{ whiteSpace: 'nowrap' }}>
                <div style={{
                  color: win ? C.teal : 'rgba(255,255,255,0.5)',
                  fontSize: win ? '13px' : '10px', fontFamily: 'monospace',
                  fontWeight: win ? 700 : 400,
                  textShadow: win ? `0 0 14px ${C.teal}` : 'none',
                }}>
                  {pred.token}
                </div>
                <div style={{
                  color: win ? C.teal : 'rgba(255,255,255,0.22)',
                  fontSize: '9px', fontFamily: 'monospace',
                }}>
                  {(pred.prob * 100).toFixed(0)}%
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// ─── Camera rig ───────────────────────────────────────────────────────────────
function CameraRig({ phase }: { phase: PhaseId }) {
  const camTarget = useRef(new THREE.Vector3(0, 2, 15));
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(({ camera, clock }) => {
    const t  = clock.getElapsedTime();
    const sw = Math.sin(t * 0.07) * 2.5;

    let tx = sw, ty = 2.2, tz = 15;
    let lx = 0,  ly = 0.5, lz = 0;

    switch (phase) {
      case 'embed':
        ty = 1;   tz = 13; ly = 0; break;
      case 'attend':
        // Sweep to reveal arc dome
        tx = Math.sin(t * 0.1) * 5;
        ty = 5;   tz = 11;
        lx = 0; ly = 3.5; lz = 0; break;
      case 'process':
        tx = Math.sin(t * 0.08) * 3.5;
        ty = 0.5; tz = 12;
        lx = 0; ly = -0.5; lz = -3.5; break;
      case 'predict':
      case 'generate':
        ty = -1.5; tz = 11;
        lx = 0; ly = -3.5; lz = 0; break;
    }

    camTarget.current.set(tx, ty, tz);
    lookTarget.current.set(lx, ly, lz);
    camera.position.lerp(camTarget.current, 0.022);
    camera.lookAt(lookTarget.current);
  });

  return null;
}

// ─── Full 3D Scene ────────────────────────────────────────────────────────────
interface SceneProps {
  phase:       PhaseId;
  demo:        Demo;
  activeToken: number;
}

function Scene({ phase, demo, activeToken }: SceneProps) {
  const showAttn = phase === 'attend' || phase === 'process';

  // Build arc pairs that have significant mutual attention
  const arcPairs = useMemo(() => {
    const pairs: { i: number; j: number; weight: number }[] = [];
    for (let i = 0; i < N_TOKENS; i++) {
      for (let j = i + 1; j < N_TOKENS; j++) {
        const w = (demo.attn[i][j] + demo.attn[j][i]) / 2;
        if (w > 0.3) pairs.push({ i, j, weight: w });
      }
    }
    return pairs;
  }, [demo]);

  return (
    <>
      <ambientLight intensity={0.05} />
      <Stars radius={70} depth={90} count={3000} factor={3} saturation={0.3} fade speed={0.1} />
      <Sparkles count={80}  scale={[20, 14, 20]} size={1.4} speed={0.18} color={C.teal}  opacity={0.3} />
      <Sparkles count={55}  scale={[18, 12, 18]} size={0.9} speed={0.12} color={C.iris}  opacity={0.22} />
      <Sparkles count={30}  scale={[14, 10, 14]} size={0.7} speed={0.14} color={C.amber} opacity={0.15} />

      <CameraRig phase={phase} />

      {/* Central LLM sphere */}
      <CentralSphere phase={phase} />

      {/* Vortex particles */}
      <VortexParticles phase={phase} />

      {/* Token orbs */}
      {demo.tokens.map((tok, i) => (
        <TokenOrb
          key={i} idx={i} token={tok}
          tokenId={demo.ids[i]}
          phase={phase}
          active={activeToken === i}
        />
      ))}

      {/* Embedding columns */}
      {demo.tokens.map((_, i) => (
        <EmbeddingColumn key={i} idx={i} phase={phase} />
      ))}

      {/* Attention arcs */}
      {arcPairs.map(({ i, j, weight }) => (
        <AttentionArc
          key={`${i}-${j}`}
          from={ringPos(i)}
          to={ringPos(j)}
          weight={weight}
          colorA={TOKEN_THREE[i]}
          colorB={TOKEN_THREE[j]}
          active={showAttn}
        />
      ))}

      {/* Transformer layer stack */}
      <LayerStack phase={phase} />

      {/* Output probability orbs */}
      <PredOrbs preds={demo.topTokens} phase={phase} />
    </>
  );
}

// ─── HUD chrome ───────────────────────────────────────────────────────────────
const PHASE_GLYPH: Record<PhaseId, string> = {
  tokenise: '⬡', embed: '⊞', attend: '◎',
  process: '⊛', predict: '▦', generate: '✦',
};

// ─── Exported component ───────────────────────────────────────────────────────
export function LLMVisualization() {
  const [phaseIdx,     setPhaseIdx]     = useState(0);
  const [demoIdx,      setDemoIdx]      = useState(0);
  const [activeToken,  setActiveToken]  = useState(-1);
  const [isPlaying,    setIsPlaying]    = useState(true);
  const [displayText,  setDisplayText]  = useState('');
  const [barProgress,  setBarProgress]  = useState(0);

  const phaseTimer  = useRef<ReturnType<typeof setTimeout>  | undefined>(undefined);
  const tokenTimer  = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const textTimer   = useRef<ReturnType<typeof setTimeout>  | undefined>(undefined);
  const rafRef      = useRef<number | undefined>(undefined);

  const phase = PHASES[phaseIdx];
  const demo  = DEMOS[demoIdx];

  // Advance phase
  useEffect(() => {
    if (!isPlaying) return;
    phaseTimer.current = setTimeout(() => {
      const next = (phaseIdx + 1) % PHASES.length;
      setPhaseIdx(next);
      if (next === 0) setDemoIdx(i => (i + 1) % DEMOS.length);
    }, phase.ms);
    return () => clearTimeout(phaseTimer.current);
  }, [phaseIdx, isPlaying, phase.ms]);

  // Active token cycling
  useEffect(() => {
    clearInterval(tokenTimer.current);
    const cycling = phase.id === 'tokenise' || phase.id === 'embed' || phase.id === 'attend';
    if (!cycling) { setActiveToken(-1); return; }
    let i = 0;
    tokenTimer.current = setInterval(() => {
      setActiveToken(i % N_TOKENS);
      i++;
    }, 450);
    return () => clearInterval(tokenTimer.current);
  }, [phase.id]);

  // Prompt typing effect
  useEffect(() => {
    setDisplayText('');
    let i = 0;
    const tick = () => {
      i++;
      setDisplayText(demo.prompt.slice(0, i));
      if (i < demo.prompt.length) textTimer.current = setTimeout(tick, 52);
    };
    textTimer.current = setTimeout(tick, 52);
    return () => clearTimeout(textTimer.current);
  }, [demo.prompt]);

  // Progress bar
  useEffect(() => {
    if (!isPlaying) return;
    setBarProgress(0);
    const start = performance.now();
    const dur   = phase.ms;
    const tick  = (now: number) => {
      setBarProgress(Math.min((now - start) / dur, 1));
      if (now - start < dur) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phaseIdx, isPlaying, phase.ms]);

  const phaseColor = TOKEN_HEX[phaseIdx % TOKEN_HEX.length];

  return (
    <div className="w-full h-[560px] relative rounded-3xl border border-white/[0.06] overflow-hidden bg-[#02020b] shadow-[0_0_80px_rgba(0,0,0,0.8)] keep-dark">

      {/* R3F canvas */}
      <Canvas
        camera={{ position: [0, 2.2, 15], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene phase={phase.id} demo={demo} activeToken={activeToken} />
        </Suspense>
      </Canvas>

      {/* ── Progress bar ── */}
      <div className="absolute top-0 inset-x-0 h-[2px] z-30 bg-white/[0.04]">
        <div
          className="h-full transition-none"
          style={{
            width: `${barProgress * 100}%`,
            background: phaseColor,
            boxShadow: `0 0 10px ${phaseColor}, 0 0 20px ${phaseColor}44`,
          }}
        />
      </div>

      {/* ── Phase chip (top centre) ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase.id}
          initial={{ opacity: 0, y: -14, scale: 0.9 }}
          animate={{ opacity: 1, y: 0,   scale: 1 }}
          exit={{    opacity: 0, y:  10, scale: 0.9 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none
                     inline-flex items-center gap-2.5 px-5 py-2 rounded-full border backdrop-blur-xl"
          style={{
            background: `rgba(2,2,11,0.7)`,
            borderColor: `${phaseColor}35`,
            color: phaseColor,
            boxShadow: `0 0 28px ${phaseColor}1A, inset 0 1px 0 ${phaseColor}18`,
          }}
        >
          <span className="font-mono text-sm leading-none">{PHASE_GLYPH[phase.id]}</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.24em] font-semibold">
            {phase.label}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* ── Phase dots (top right) ── */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5 pointer-events-none">
        {PHASES.map((p, i) => (
          <div
            key={p.id}
            className="rounded-full transition-all duration-300"
            style={{
              width:  i === phaseIdx ? '22px' : '5px',
              height: '5px',
              background: i === phaseIdx ? TOKEN_HEX[i % TOKEN_HEX.length] : 'rgba(255,255,255,0.12)',
              boxShadow: i === phaseIdx ? `0 0 10px ${TOKEN_HEX[i % TOKEN_HEX.length]}` : 'none',
            }}
          />
        ))}
      </div>

      {/* ── Attention mini-heatmap (top left) ── */}
      <AnimatePresence>
        {(phase.id === 'attend' || phase.id === 'process') && (
          <motion.div
            key="heatmap"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{    opacity: 0, x: -10 }}
            transition={{ duration: 0.4 }}
            className="absolute top-5 left-5 z-20 p-2.5 rounded-xl border border-white/[0.07]
                       backdrop-blur-xl pointer-events-none"
            style={{ background: 'rgba(2,2,11,0.75)' }}
          >
            <div className="font-mono text-[8px] uppercase tracking-widest text-white/25 mb-2 text-center">
              Attention
            </div>
            <div
              className="grid gap-[2px]"
              style={{ gridTemplateColumns: `repeat(${N_TOKENS}, 14px)` }}
            >
              {demo.attn.flat().map((w, k) => (
                <div
                  key={k}
                  className="rounded-[2px]"
                  style={{
                    width: '14px', height: '14px',
                    background: `rgba(0,255,179,${w * 0.88})`,
                    boxShadow: w > 0.75 ? `0 0 5px ${C.teal}88` : 'none',
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1.5 gap-[2px]">
              {demo.tokens.map((tok, i) => (
                <div
                  key={i}
                  style={{
                    color: TOKEN_HEX[i], fontSize: '7px',
                    fontFamily: 'monospace', width: '14px',
                    textAlign: 'center', overflow: 'hidden',
                  }}
                >
                  {tok[0]}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Prompt + sub-label (bottom left) ── */}
      <div className="absolute bottom-5 left-5 z-20 pointer-events-none max-w-[280px]">
        <AnimatePresence mode="wait">
          <motion.p
            key={phase.sub}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/25 mb-1.5"
          >
            {phase.sub}
          </motion.p>
        </AnimatePresence>
        <p className="font-mono text-[13px] text-white/65" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <span className="text-white/25 mr-2">›</span>
          {displayText}
          <span className="animate-pulse opacity-55">▊</span>
        </p>
      </div>

      {/* ── Play / Pause ── */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsPlaying(v => !v)}
        className="absolute bottom-5 right-5 z-20 w-8 h-8 rounded-full bg-white/[0.05]
                   hover:bg-white/[0.1] text-white/35 hover:text-white/65
                   border border-white/[0.08] cursor-pointer transition-all duration-200"
      >
        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </Button>

      {/* Reduced-motion accessibility */}
      <style>{`@media(prefers-reduced-motion:reduce){canvas{display:none}}`}</style>
    </div>
  );
}
